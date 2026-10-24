import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);

    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, duration: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch all lessons for this course across all sections
    const lessons = await prisma.course_lessons.findMany({
      where: {
        course_sections: {
          course_id: courseId,
        },
      },
      select: {
        id: true,
        title: true,
        lesson_type: true,
        section_id: true,
        duration_seconds: true,
      },
    });

    const videoLessons = lessons.filter((l) => (l.lesson_type || "").toUpperCase() === "VIDEO");
    const quizLessons = lessons.filter((l) => (l.lesson_type || "").toUpperCase() === "QUIZ");
    const projectLessons = lessons.filter((l) => {
      const t = (l.lesson_type || "").toUpperCase();
      return t === "PROJECT" || t === "ASSIGNMENT";
    });
    const liveLessons = lessons.filter((l) => {
      const t = (l.lesson_type || "").toUpperCase();
      return t === "LIVE_CLASS" || t === "LIVE";
    });

    const totalLessons = lessons.length;
    const totalVideos = videoLessons.length;
    const totalQuizzes = quizLessons.length;
    const totalProjects = projectLessons.length;
    const totalLiveClasses = liveLessons.length;

    // Fetch enrollments and student progress
    const enrollments = await prisma.enrollments.findMany({
      where: { course_id: courseId },
      orderBy: { enrolled_at: "desc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, profile_image: true },
        },
        lesson_progress: {
          select: {
            lesson_id: true,
            completed: true,
            completed_at: true,
            watched_percentage: true,
            watch_duration_seconds: true,
            last_accessed_at: true,
          },
        },
      },
    });

    const totalLearners = enrollments.length;

    let sumCompletedVideos = 0;
    let sumCompletedQuizzes = 0;
    let sumCompletedProjects = 0;
    let sumAttendedLive = 0;
    let sumProgressPct = 0;
    let totalCompletedLearners = 0;

    const learners = enrollments.map((enr) => {
      const completedMap = new Set(
        enr.lesson_progress
          .filter((lp) => lp.completed || (lp.watched_percentage && lp.watched_percentage >= 90))
          .map((lp) => lp.lesson_id.toString())
      );

      const completedVideosCount = videoLessons.filter((vl) => completedMap.has(vl.id.toString())).length;
      const completedQuizzesCount = quizLessons.filter((ql) => completedMap.has(ql.id.toString())).length;
      const completedProjectsCount = projectLessons.filter((pl) => completedMap.has(pl.id.toString())).length;
      const completedLiveCount = liveLessons.filter((ll) => completedMap.has(ll.id.toString())).length;

      sumCompletedVideos += completedVideosCount;
      sumCompletedQuizzes += completedQuizzesCount;
      sumCompletedProjects += completedProjectsCount;
      sumAttendedLive += completedLiveCount;

      let learnerProgress = enr.progress_percentage || 0;
      if (totalLessons > 0) {
        const computed = Math.round((completedMap.size / totalLessons) * 100);
        if (computed > learnerProgress) learnerProgress = Math.min(100, computed);
      }
      sumProgressPct += learnerProgress;

      const isCompleted = learnerProgress >= 100 || enr.status === "COMPLETED" || Boolean(enr.completed_at);
      if (isCompleted) totalCompletedLearners++;

      return {
        id: enr.users?.id || enr.user_id,
        enrollmentId: Number(enr.id),
        name: enr.users?.name || "Learner",
        email: enr.users?.email || "",
        avatar: enr.users?.profile_image || null,
        enrolledAt: enr.enrolled_at ? enr.enrolled_at.toISOString() : null,
        lastAccessedAt: enr.last_accessed_at ? enr.last_accessed_at.toISOString() : null,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        progressPercentage: learnerProgress,
        completedVideos: completedVideosCount,
        totalVideos,
        completedQuizzes: completedQuizzesCount,
        totalQuizzes,
        completedProjects: completedProjectsCount,
        totalProjects,
        completedLiveClasses: completedLiveCount,
        totalLiveClasses,
      };
    });

    const averageProgress = totalLearners > 0 ? Math.round(sumProgressPct / totalLearners) : 0;

    return NextResponse.json(
      serializeData({
        course: {
          id: Number(course.id),
          title: course.title,
          totalLessons,
          totalVideos,
          totalQuizzes,
          totalProjects,
          totalLiveClasses,
        },
        summary: {
          totalLearners,
          completedLearners: totalCompletedLearners,
          overallCourseProgress: averageProgress,
          totalVideos,
          completedVideosCount: sumCompletedVideos,
          totalQuizzes,
          completedQuizzesCount: sumCompletedQuizzes,
          totalProjects,
          completedProjectsCount: sumCompletedProjects,
          totalLiveClasses,
          liveClassAttendanceCount: sumAttendedLive,
        },
        learners,
      })
    );
  } catch (error: any) {
    console.error("Course reports API error:", error);
    return NextResponse.json({ error: "Failed to generate course reports" }, { status: 500 });
  }
}
