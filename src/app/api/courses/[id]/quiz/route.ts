import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser, isAdminRole } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(req.url);
    const lessonIdParam = url.searchParams.get("lessonId");
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const numericId = Number(rawId);

    let course: any = null;
    if (!isNaN(numericId) && numericId > 0) {
      course = await prisma.courses.findUnique({
        where: { id: BigInt(numericId) },
        select: { id: true, price: true, final_price: true },
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
        select: { id: true, price: true, final_price: true },
      });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseId = Number(course.id);

    // 1. Authorization & Enrollment verification
    const user = await getSessionUser(req);
    const isAdmin = user && isAdminRole(user.role);

    const isFree = Number(course.final_price ?? course.price ?? 0) === 0;

    let enrollment: any = null;
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

    const isEnrolled = enrollment && (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED");

    if (!isAdmin && !isFree && !isEnrolled) {
      return NextResponse.json(
        { error: "Unauthorized: You must be enrolled in this course to access quiz assessments." },
        { status: 403 }
      );
    }

    // 2. Course isolation: Ensure the quiz lesson belongs strictly to this course
    let quizLesson: any = null;
    if (lessonIdParam) {
      const targetLessonId = BigInt(lessonIdParam);
      quizLesson = await prisma.course_lessons.findFirst({
        where: {
          id: targetLessonId,
          course_sections: { course_id: BigInt(courseId) },
          lesson_type: "QUIZ",
        },
      });
    } else {
      quizLesson = await prisma.course_lessons.findFirst({
        where: {
          course_sections: { course_id: BigInt(courseId) },
          lesson_type: "QUIZ",
        },
        orderBy: { display_order: "asc" },
      });
    }

    if (!quizLesson) {
      return NextResponse.json(
        { error: "Quiz not found for this course" },
        { status: 404 }
      );
    }

    // 3. Parse Admin Quiz Metadata
    let quizMeta: any = {
      passingScore: 70,
      timeLimit: 15,
      maxAttempts: 1,
      status: "Active",
      totalMarks: 100,
      quizDescription: "",
    };

    if (quizLesson.description) {
      try {
        if (typeof quizLesson.description === "string" && quizLesson.description.trim().startsWith("{")) {
          const parsed = JSON.parse(quizLesson.description);
          quizMeta = { ...quizMeta, ...parsed };
        } else if (typeof quizLesson.description === "string") {
          quizMeta.quizDescription = quizLesson.description.trim();
        }
      } catch {}
    }

    const isInactive = quizMeta.status === "Inactive" || quizMeta.status === "INACTIVE";
    if (isInactive && !isAdmin) {
      return NextResponse.json(
        {
          error: "This quiz is currently inactive.",
          status: "Inactive",
          quizTitle: quizLesson.title,
        },
        { status: 403 }
      );
    }

    // 4. Fetch dynamic questions and options stored by Admin (DO NOT expose correct answer or explanation)
    const questions = await prisma.quiz_questions.findMany({
      where: { lesson_id: quizLesson.id },
      orderBy: { display_order: "asc" },
      include: {
        quiz_question_options: {
          orderBy: { option_order: "asc" },
        },
      },
    });

    const mappedQuestions = questions.map((q) => ({
      id: Number(q.id),
      lessonId: Number(q.lesson_id),
      questionText: q.question_text,
      options: (q.quiz_question_options || []).map((o) => o.option_text),
      displayOrder: q.display_order,
    }));

    // 5. Track attempt status for student
    let attemptCount = 0;
    let isCompleted = false;
    let lastScorePercentage: number | null = null;
    let hasNetworkIssue = false;

    if (enrollment) {
      const progress = await prisma.lesson_progress.findUnique({
        where: {
          enrollment_id_lesson_id: {
            enrollment_id: enrollment.id,
            lesson_id: quizLesson.id,
          },
        },
      });
      if (progress) {
        attemptCount = progress.last_position_seconds || 0;
        isCompleted = Boolean(progress.completed);
        lastScorePercentage = progress.watched_percentage;
        hasNetworkIssue = Boolean(progress.total_duration_seconds && progress.total_duration_seconds > 0);
      }
    }

    const maxAttemptsAllowed = quizMeta.maxAttempts > 0 ? quizMeta.maxAttempts : 1;
    const attemptLimitReached = !isAdmin && attemptCount >= maxAttemptsAllowed;

    const payload = {
      id: Number(quizLesson.id),
      lessonId: Number(quizLesson.id),
      title: quizLesson.title,
      description: quizMeta.quizDescription || quizMeta.description || "",
      quizDescription: quizMeta.quizDescription || quizMeta.description || "",
      timeLimit: quizMeta.timeLimit > 0 ? quizMeta.timeLimit : (quizLesson.duration_seconds ? Math.round(quizLesson.duration_seconds / 60) : 15),
      totalMarks: quizMeta.totalMarks > 0 ? quizMeta.totalMarks : (mappedQuestions.length || 1),
      passingScore: quizMeta.passingScore > 0 ? quizMeta.passingScore : 70,
      maxAttempts: maxAttemptsAllowed,
      attemptCount,
      attemptLimitReached,
      completed: isCompleted,
      lastScore: lastScorePercentage,
      networkIssue: hasNetworkIssue,
      hasNetworkIssue,
      completionReason: hasNetworkIssue ? "NETWORK_ISSUE" : "NORMAL_COMPLETION",
      status: quizMeta.status || "Active",
      questionsCount: mappedQuestions.length,
      questions: mappedQuestions,
    };

    return NextResponse.json(serializeData(payload));
  } catch (error: any) {
    console.error("Fetch quiz error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 });
  }
}
