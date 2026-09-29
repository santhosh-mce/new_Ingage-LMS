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
    const user = await getSessionUser(req);
    let isEnrolled = false;
    let progressPercentage = 0;
    let completedLessonIds: number[] = [];

    if (user) {
      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: user.id,
            course_id: BigInt(courseId),
          },
        },
      });

      if (enrollment) {
        isEnrolled = enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED";
        progressPercentage = enrollment.progress_percentage || 0;
      }
    }

    const sections = (course.course_sections || []).map((sec: any) => ({
      id: Number(sec.id),
      title: sec.title,
      description: sec.description || "",
      displayOrder: sec.display_order ?? 0,
      lessons: (sec.course_lessons || []).map((les: any) => {
        const rawContent = les.content_url || "";
        const cleanContent =
          les.lesson_type === "VIDEO" &&
          (!rawContent ||
            rawContent.includes("commondatastorage.googleapis.com") ||
            rawContent.includes("localhost:8080"))
            ? "/uploads/videos/video.mp4"
            : rawContent;
        return {
          id: Number(les.id),
          title: les.title,
          description: les.description || "",
          lessonType: les.lesson_type || "VIDEO",
          contentUrl: cleanContent || null,
          videoUrl: cleanContent || null,
          content_url: cleanContent || null,
          duration: les.duration || "15m",
          durationSeconds: les.duration_seconds || 900,
          freePreview: Boolean(les.free_preview),
          displayOrder: les.display_order ?? 0,
          required: Boolean(les.required),
        };
      }),
      // Legacy snake_case compatibility
      course_lessons: (sec.course_lessons || []).map((les: any) => {
        const rawContent = les.content_url || "";
        const cleanContent =
          les.lesson_type === "VIDEO" &&
          (!rawContent ||
            rawContent.includes("commondatastorage.googleapis.com") ||
            rawContent.includes("localhost:8080"))
            ? "/uploads/videos/video.mp4"
            : rawContent;
        return {
          id: Number(les.id),
          title: les.title,
          description: les.description || "",
          duration: les.duration || "15m",
          duration_seconds: les.duration_seconds || 900,
          free_preview: Boolean(les.free_preview),
          lesson_type: les.lesson_type || "VIDEO",
          content_url: cleanContent || null,
          video_url: cleanContent || null,
          display_order: les.display_order ?? 0,
          required: Boolean(les.required),
        };
      }),
    }));

    const price = course.price != null ? Number(course.price) : 0;
    const finalPrice = course.final_price != null ? Number(course.final_price) : price;

    const result = {
      id: Number(course.id),
      title: course.title,
      slug: course.slug || ("course-" + course.id),
      description: course.description || "",
      category: course.category || "General",
      level: course.level || "Beginner",
      duration: course.duration || "6 weeks",
      instructor: course.instructor || "Lead Technical Mentor",
      price,
      finalPrice,
      isEnrolled,
      progressPercentage,
      completedLessonIds,
      sections,
      // Compatibility properties
      thumbnail: course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      course_sections: sections,
    };

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Course content error:", error);
    return NextResponse.json({ error: "Failed to fetch course content" }, { status: 500 });
  }
}
