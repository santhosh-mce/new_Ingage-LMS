import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const numericId = Number(rawId);

    let course: any = null;
    if (!isNaN(numericId)) {
      course = await prisma.courses.findUnique({
        where: { id: BigInt(numericId) },
        select: { id: true, price: true, final_price: true }
      });
    }

    if (!course) {
      const idFromPrefix = rawId.startsWith("course-") ? Number(rawId.replace("course-", "")) : NaN;
      course = await prisma.courses.findFirst({
        where: {
          OR: [
            { slug: rawId },
            ...(!isNaN(idFromPrefix) ? [{ id: BigInt(idFromPrefix) }] : []),
          ],
        },
        select: { id: true, price: true, final_price: true }
      });
    }

    if (!course) {
      return NextResponse.json({
        courseId: isNaN(numericId) ? 0 : numericId,
        hasAccess: false,
        accessType: "NONE",
        progressPercentage: 0,
        completed: false,
        certificateAvailable: false,
      });
    }

    const courseId = Number(course.id);
    const user = await getSessionUser(req);
    const isAdmin = user && isAdminRole(user.role);

    // 1. Role-based bypass for ADMIN: Full access to all courses without enrollment or payment
    if (isAdmin) {
      return NextResponse.json({
        courseId,
        hasAccess: true,
        accessType: "DIRECT_COURSE",
        careerPathId: null,
        careerPathName: null,
        careerPathSlug: null,
        directEnrollmentId: null,
        directStatus: "ACTIVE",
        progressPercentage: 0,
        completed: false,
        certificateAvailable: false,
        isAdminPreview: true,
      });
    }

    // 2. Free course check
    const isFreeCourse = Number(course.final_price ?? course.price ?? 0) === 0;

    let hasAccess = isFreeCourse;
    let accessType: "NONE" | "DIRECT_COURSE" | "CAREER_PATH_INCLUDED" | "BOTH" = isFreeCourse ? "DIRECT_COURSE" : "NONE";
    let directEnrollmentId: number | null = null;
    let directStatus: string | null = null;
    let progressPercentage = 0;
    let completed = false;
    let certificateAvailable = false;
    let careerPathId: number | null = null;
    let careerPathName: string | null = null;
    let careerPathSlug: string | null = null;

    if (user) {
      // 3. Direct course enrollment check
      const directEnrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: user.id,
            course_id: BigInt(courseId),
          },
        },
      });

      if (directEnrollment) {
        hasAccess = directEnrollment.status === "ACTIVE" || directEnrollment.status === "COMPLETED";
        accessType = "DIRECT_COURSE";
        directEnrollmentId = Number(directEnrollment.id);
        directStatus = directEnrollment.status;
        progressPercentage = directEnrollment.progress_percentage || 0;
        completed = directEnrollment.status === "COMPLETED";
        certificateAvailable = completed;
      }

      // 4. Career path inclusion check
      const careerCourse = await prisma.career_courses.findFirst({
        where: {
          course_id: BigInt(courseId),
          included: true,
        },
        include: {
          careers: {
            include: {
              career_enrollments: {
                where: { user_id: user.id },
              },
            },
          },
        },
      });

      if (careerCourse && careerCourse.careers?.career_enrollments?.length > 0) {
        const ce = careerCourse.careers.career_enrollments[0];
        if (ce.status === "ACTIVE" || ce.status === "COMPLETED") {
          hasAccess = true;
          accessType = directEnrollment ? "BOTH" : "CAREER_PATH_INCLUDED";
          careerPathId = Number(careerCourse.careers.id);
          careerPathName = careerCourse.careers.title;
          careerPathSlug = careerCourse.careers.slug;
        }
      }
    }

    return NextResponse.json({
      courseId,
      hasAccess,
      accessType,
      careerPathId,
      careerPathName,
      careerPathSlug,
      directEnrollmentId,
      directStatus,
      progressPercentage,
      completed,
      certificateAvailable,
    });
  } catch (error: any) {
    console.error("Course access status error:", error);
    return NextResponse.json({
      courseId: 0,
      hasAccess: false,
      accessType: "NONE",
      progressPercentage: 0,
      completed: false,
      certificateAvailable: false,
    });
  }
}
