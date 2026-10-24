import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser, isAdminRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const url = new URL(req.url);
    const rawType = url.searchParams.get("type") || url.searchParams.get("contentType") || "";
    const filterType = rawType ? rawType.toUpperCase() : "";
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
    const isAdmin = user && isAdminRole(user.role);

    // Only allow published courses for non-admin students
    if (!isAdmin && course.published === false) {
      return NextResponse.json({ error: "Course is currently not available" }, { status: 404 });
    }

    let isEnrolled = false;
    let progressPercentage = 0;
    let completedLessonIds: number[] = [];

    const isFreeCourse = Number(course.final_price ?? course.price ?? 0) === 0;

    if (isAdmin || isFreeCourse) {
      isEnrolled = true;
    }

    let progressMap: Record<number, any> = {};
    if (user) {
      const enrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: user.id,
            course_id: BigInt(courseId),
          },
        },
        include: {
          lesson_progress: true,
        },
      });

      if (enrollment) {
        isEnrolled = enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED";
        progressPercentage = enrollment.progress_percentage || 0;
        completedLessonIds = (enrollment.lesson_progress || [])
          .filter((lp) => lp.completed || (lp.watched_percentage && lp.watched_percentage >= 90))
          .map((lp) => Number(lp.lesson_id));

        (enrollment.lesson_progress || []).forEach((lp) => {
          progressMap[Number(lp.lesson_id)] = lp;
        });
      }
    }

    const sections = (course.course_sections || [])
      .map((sec: any) => {
        const rawLessons = (sec.course_lessons || []).filter((les: any) => {
          if (!filterType) return true;
          const lt = (les.lesson_type || "VIDEO").toUpperCase();
          if (filterType === "PROJECT") return lt === "PROJECT" || lt === "ASSIGNMENT";
          if (filterType === "LIVE" || filterType === "LIVE_CLASS") return lt === "LIVE_CLASS" || lt === "LIVE";
          return lt === filterType;
        });

        const lessons = rawLessons.map((les: any) => {
          const rawContent = les.content_url || "";
          const cleanContent =
            les.lesson_type === "VIDEO" &&
            (!rawContent ||
              rawContent.includes("commondatastorage.googleapis.com") ||
              rawContent.includes("localhost:8080"))
              ? "/uploads/videos/video.mp4"
              : rawContent;
          const isLessonLocked = !(isAdmin || isEnrolled || Boolean(les.free_preview));
          const effectiveContent = isLessonLocked ? null : (cleanContent || null);
          const prog = progressMap[Number(les.id)];
          const attemptCount = prog?.last_position_seconds || (completedLessonIds.includes(Number(les.id)) ? 1 : 0);
          const hasNetworkIssue = Boolean(prog?.total_duration_seconds && prog.total_duration_seconds > 0);

          return {
            id: Number(les.id),
            title: les.title,
            description: les.description || "",
            lessonType: les.lesson_type || "VIDEO",
            contentUrl: effectiveContent,
            videoUrl: effectiveContent,
            content_url: effectiveContent,
            duration: les.duration || "15m",
            durationSeconds: les.duration_seconds || 900,
            freePreview: Boolean(les.free_preview),
            locked: isLessonLocked,
            displayOrder: les.display_order ?? 0,
            required: Boolean(les.required),
            completed: completedLessonIds.includes(Number(les.id)),
            isCompleted: completedLessonIds.includes(Number(les.id)),
            attemptCount,
            attemptsUsed: attemptCount,
            networkIssue: hasNetworkIssue,
            hasNetworkIssue,
            networkIssuesCount: prog?.total_duration_seconds || 0,
            lastScore: prog?.watched_percentage ?? null,
          };
        });

        return {
          id: Number(sec.id),
          title: sec.title,
          description: sec.description || "",
          displayOrder: sec.display_order ?? 0,
          lessons,
          // Legacy snake_case compatibility
          course_lessons: lessons.map((l: any) => ({
            ...l,
            duration_seconds: l.durationSeconds,
            free_preview: l.freePreview,
            lesson_type: l.lessonType,
            content_url: l.contentUrl,
            video_url: l.videoUrl,
            display_order: l.displayOrder,
          })),
        };
      })
      .filter((sec: any) => !filterType || sec.lessons.length > 0);

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
