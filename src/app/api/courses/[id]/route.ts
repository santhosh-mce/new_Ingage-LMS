import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const numericId = Number(rawId);

    let course: any = null;
    if (!isNaN(numericId)) {
      course = await prisma.courses.findUnique({
        where: { id: BigInt(numericId) },
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
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseId = Number(course.id);

    // Check enrollment if user is logged in
    const user = await getSessionUser(req);
    let isEnrolled = false;
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
      isEnrolled = !!enrollment;
    }

    const sections = (course.course_sections || []).map((sec: any) => ({
      id: Number(sec.id),
      title: sec.title,
      description: sec.description || "",
      displayOrder: sec.display_order ?? 0,
      lessons: (sec.course_lessons || []).map((les: any) => ({
        id: Number(les.id),
        title: les.title,
        description: les.description || "",
        lessonType: les.lesson_type || "VIDEO",
        contentUrl: les.content_url || null,
        duration: les.duration || "15m",
        durationSeconds: les.duration_seconds || 900,
        freePreview: Boolean(les.free_preview),
        displayOrder: les.display_order ?? 0,
        required: Boolean(les.required),
      })),
      course_lessons: sec.course_lessons,
    }));

    const price = course.price != null ? Number(course.price) : 0;
    const finalPrice = course.final_price != null ? Number(course.final_price) : price;

    return NextResponse.json(serializeData({
      ...course,
      id: Number(course.id),
      price,
      finalPrice,
      isEnrolled,
      enrollment,
      sections,
    }));
  } catch (error: any) {
    console.error("Course detail error:", error);
    return NextResponse.json({ error: "Failed to fetch course detail" }, { status: 500 });
  }
}
