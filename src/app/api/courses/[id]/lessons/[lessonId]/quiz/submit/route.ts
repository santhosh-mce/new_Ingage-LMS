import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser, isAdminRole } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const numericId = Number(rawId);
    const lessonId = BigInt(resolvedParams.lessonId);
    const body = await req.json().catch(() => ({}));

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

    // 1. Authorization
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in to submit quiz" }, { status: 401 });
    }
    const isAdmin = isAdminRole(user.role);

    // 2. Course isolation: Ensure quiz lesson belongs strictly to this course
    const quizLesson = await prisma.course_lessons.findFirst({
      where: {
        id: lessonId,
        course_sections: { course_id: BigInt(courseId) },
        lesson_type: "QUIZ",
      },
    });

    if (!quizLesson) {
      return NextResponse.json({ error: "Quiz not found for this course" }, { status: 404 });
    }

    // 3. Verify enrollment
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

      // Ensure active enrollment for user accessing the course
      if (!enrollment) {
        enrollment = await prisma.enrollments.create({
          data: {
            user_id: user.id,
            course_id: BigInt(courseId),
            status: "ACTIVE",
            progress_percentage: 0,
            enrolled_at: new Date(),
            last_accessed_at: new Date(),
          },
        });
      }
    }

    // 4. Parse Admin Quiz Metadata
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

    // 5. Check Inactive Status (log if inactive but allow active submissions to complete)
    const isInactive = quizMeta.status === "Inactive" || quizMeta.status === "INACTIVE";

    // 6. Check Existing Progress and Attempts
    let currentAttempts = 0;
    let existingProgress: any = null;
    if (enrollment) {
      existingProgress = await prisma.lesson_progress.findUnique({
        where: {
          enrollment_id_lesson_id: {
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
          },
        },
      });
      if (existingProgress) {
        currentAttempts = existingProgress.watch_duration_seconds || (existingProgress.completed ? 1 : 0);
      }
    }

    const maxAttemptsAllowed = quizMeta.maxAttempts > 0 ? quizMeta.maxAttempts : 1;

    // 7. Fetch actual database questions
    const questions = await prisma.quiz_questions.findMany({
      where: { lesson_id: lessonId },
      orderBy: { display_order: "asc" },
      include: {
        quiz_question_options: {
          orderBy: { option_order: "asc" },
        },
      },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No quiz questions found in this assessment" }, { status: 404 });
    }

    // 8. Extract student's submitted answers
    let rawAnswers: Record<string, any> = {};
    if (body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)) {
      rawAnswers = body.answers;
    } else if (Array.isArray(body.answers)) {
      for (const item of body.answers) {
        if (item && item.questionId !== undefined) {
          rawAnswers[item.questionId] = item.selectedOptionIndex;
        }
      }
    } else if (body && typeof body === "object" && !Array.isArray(body)) {
      rawAnswers = body;
    }

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionResults = questions.map((q) => {
      const options = (q.quiz_question_options || []).map((o) => o.option_text);
      let correctIndex = q.correct_option_index;
      let cleanExplanation = q.explanation || "";

      if (cleanExplanation) {
        try {
          if (cleanExplanation.startsWith("{") && cleanExplanation.endsWith("}")) {
            const parsed = JSON.parse(cleanExplanation);
            if (typeof parsed.correctAnswer === "number") {
              correctIndex = parsed.correctAnswer;
            } else if (typeof parsed.correctAnswer === "string") {
              const upper = parsed.correctAnswer.trim().toUpperCase();
              if (["A", "B", "C", "D"].includes(upper)) {
                correctIndex = ["A", "B", "C", "D"].indexOf(upper);
              } else {
                const idx = options.findIndex((opt) => opt.trim().toLowerCase() === parsed.correctAnswer.trim().toLowerCase());
                if (idx !== -1) correctIndex = idx;
              }
            }
            if (parsed.explanation) cleanExplanation = parsed.explanation;
          } else {
            const upper = cleanExplanation.trim().toUpperCase();
            if (["A", "B", "C", "D"].includes(upper)) {
              correctIndex = ["A", "B", "C", "D"].indexOf(upper);
              cleanExplanation = `${options[correctIndex] || upper} is the correct answer.`;
            }
          }
        } catch {}
      }

      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      let rawVal = rawAnswers[String(q.id)] !== undefined ? rawAnswers[String(q.id)] : rawAnswers[Number(q.id)];
      if (Array.isArray(rawVal) && rawVal.length > 0) {
        rawVal = rawVal[0];
      }

      let selectedIndex: number | null = null;
      if (typeof rawVal === "number" && rawVal >= 0 && rawVal < options.length) {
        selectedIndex = rawVal;
      } else if (typeof rawVal === "string") {
        const upper = rawVal.trim().toUpperCase();
        if (["A", "B", "C", "D"].includes(upper)) {
          selectedIndex = ["A", "B", "C", "D"].indexOf(upper);
        } else {
          const optIdx = options.findIndex((opt) => opt.trim().toLowerCase() === rawVal.trim().toLowerCase());
          if (optIdx !== -1) {
            selectedIndex = optIdx;
          } else if (!isNaN(Number(rawVal)) && Number(rawVal) >= 0 && Number(rawVal) < options.length) {
            selectedIndex = Number(rawVal);
          }
        }
      }

      const isCorrect = selectedIndex !== null && selectedIndex === correctIndex;
      if (isCorrect) {
        correctCount++;
      } else if (selectedIndex === null || selectedIndex < 0) {
        unansweredCount++;
      } else {
        wrongCount++;
      }

      const selectedAnswerText = selectedIndex !== null && options[selectedIndex] ? options[selectedIndex] : null;
      const correctAnswerText = options[correctIndex] || `Option ${String.fromCharCode(65 + correctIndex)}`;

      return {
        questionId: Number(q.id),
        questionText: q.question_text,
        options,
        selectedOptionIndex: selectedIndex,
        selectedAnswerText,
        correctOptionIndex: correctIndex,
        correctAnswerText,
        isCorrect,
        explanation: cleanExplanation || `${correctAnswerText} is the correct answer.`,
      };
    });

    // 9. Official Backend Calculation of Marks and Percentage
    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passingScore = quizMeta.passingScore > 0 ? quizMeta.passingScore : 70;
    const passed = scorePercentage >= passingScore;

    const totalMarks = quizMeta.totalMarks > 0 ? quizMeta.totalMarks : (totalQuestions * 1);
    const earnedMarks = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * totalMarks) : 0;

    // 10. Record Attempt and Update Progress
    const isNetworkIssue = Boolean(
      body.networkIssue === true ||
      body.hasNetworkIssue === true ||
      body.completionReason === "NETWORK_ISSUE" ||
      body.isNetworkIssueFinalize === true
    );
    const newAttemptCount = currentAttempts + 1;
    const prevNetworkIssues = existingProgress?.total_duration_seconds || 0;
    const newNetworkIssues = isNetworkIssue ? (prevNetworkIssues + 1) : prevNetworkIssues;

    if (enrollment) {
      try {
        await prisma.lesson_progress.upsert({
          where: {
            enrollment_id_lesson_id: {
              enrollment_id: enrollment.id,
              lesson_id: lessonId,
            },
          },
          update: {
            last_position_seconds: newAttemptCount,
            total_duration_seconds: newNetworkIssues,
            watched_percentage: Math.max(existingProgress?.watched_percentage || 0, scorePercentage),
            completed: passed || (existingProgress?.completed ?? false),
            completed_at: (passed && !existingProgress?.completed) ? new Date() : existingProgress?.completed_at,
            last_accessed_at: new Date(),
          },
          create: {
            enrollment_id: enrollment.id,
            lesson_id: lessonId,
            last_position_seconds: newAttemptCount,
            total_duration_seconds: newNetworkIssues,
            watched_percentage: scorePercentage,
            completed: passed,
            completed_at: passed ? new Date() : null,
            last_accessed_at: new Date(),
          },
        });

        if (passed) {
          const allLessons = await prisma.course_lessons.findMany({
            where: { course_sections: { course_id: BigInt(courseId) } },
            select: { id: true },
          });
          const completedLessons = await prisma.lesson_progress.findMany({
            where: { enrollment_id: enrollment.id, completed: true },
            select: { lesson_id: true },
          });
          const totalCount = allLessons.length;
          const completedCount = completedLessons.length;
          const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          await prisma.enrollments.update({
            where: { id: enrollment.id },
            data: {
              progress_percentage: overallPct,
              status: overallPct >= 100 ? "COMPLETED" : "ACTIVE",
              completed_at: overallPct >= 100 ? new Date() : null,
            },
          });
        }
      } catch (err) {
        console.warn("Failed to persist quiz progress:", err);
      }
    }

    return NextResponse.json(
      serializeData({
        score: scorePercentage,
        scorePercentage,
        percentage: scorePercentage,
        earnedMarks,
        totalMarks,
        passed,
        passingScore,
        totalQuestions,
        correctCount,
        correctAnswers: correctCount,
        wrongCount,
        wrongAnswers: wrongCount,
        unansweredCount,
        unansweredQuestions: unansweredCount,
        attemptCount: newAttemptCount,
        maxAttempts: maxAttemptsAllowed,
        remainingAttempts: Math.max(0, maxAttemptsAllowed - newAttemptCount),
        networkIssue: newNetworkIssues > 0,
        hasNetworkIssue: newNetworkIssues > 0,
        networkIssuesCount: newNetworkIssues,
        completionReason: isNetworkIssue ? "NETWORK_ISSUE" : "NORMAL_COMPLETION",
        questionResults,
        results: questionResults,
      })
    );
  } catch (error: any) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Failed to evaluate quiz" }, { status: 500 });
  }
}
