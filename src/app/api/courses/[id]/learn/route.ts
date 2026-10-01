import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser, isAdminRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseId = Number(resolvedParams.id);
    const isAdmin = isAdminRole(user.role);

    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        course_sections: {
          orderBy: { display_order: "asc" },
          include: {
            course_lessons: {
              orderBy: { display_order: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isFree = Number(course.final_price ?? course.price ?? 0) === 0;

    let enrollment = null;
    if (user) {
      enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: user.id,
            course_id: BigInt(courseId),
          },
        },
      });
    }

    // Role-based authorization:
    // ADMIN -> allow
    // STUDENT + enrolled -> allow
    // STUDENT + free course -> allow
    // STUDENT + not enrolled + paid -> deny 403 Forbidden
    if (!isAdmin && !isFree && (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED"))) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const progressRecords = enrollment
      ? await prisma.lesson_progress.findMany({
          where: { enrollment_id: enrollment.id },
        })
      : [];

    return NextResponse.json(serializeData({
      course,
      enrollment: enrollment || (isAdmin ? { id: 0, status: "ACTIVE", isAdminPreview: true } : null),
      progress: progressRecords,
      userWatermark: {
        email: user.email,
        userId: user.id,
      },
    }));
  } catch (error: any) {
    console.error("Course learn error:", error);
    return NextResponse.json({ error: "Failed to load learning environment" }, { status: 500 });
  }
}
