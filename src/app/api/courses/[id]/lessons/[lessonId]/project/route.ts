import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const rawLessonId = resolvedParams.lessonId;
    const numLessonId = Number(rawLessonId);
    if (isNaN(numLessonId)) {
      return NextResponse.json({ submission: null }, { status: 200 });
    }
    const lessonId = BigInt(numLessonId);

    const lesson = await prisma.course_lessons.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ submission: null, message: "Lesson not found" }, { status: 200 });
    }

    // Lookup existing user_project by user and lesson title
    const existingSubmission = await prisma.user_projects.findFirst({
      where: {
        user_id: user.id,
        title: lesson.title,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData({ submission: existingSubmission }));
  } catch (error: any) {
    console.error("Get project submission error:", error);
    return NextResponse.json({ error: "Failed to load project submission" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const rawLessonId = resolvedParams.lessonId;
    const numLessonId = Number(rawLessonId);
    if (isNaN(numLessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }
    const lessonId = BigInt(numLessonId);
    const body = await req.json().catch(() => ({}));
    const { githubUrl, liveUrl, notes, attachmentUrl } = body;

    const lesson = await prisma.course_lessons.findUnique({
      where: { id: lessonId },
      include: {
        course_sections: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.course_sections.course_id;

    // Create or update user_projects
    let submission = await prisma.user_projects.findFirst({
      where: {
        user_id: user.id,
        title: lesson.title,
      },
    });

    if (!submission) {
      submission = await prisma.user_projects.create({
        data: {
          user_id: user.id,
          title: lesson.title,
          github_url: githubUrl || null,
          live_url: liveUrl || null,
          description: notes || null,
          image_url: attachmentUrl || null,
          status: "COMPLETED",
          category: "Course Project",
          created_at: new Date(),
        },
      });
    } else {
      submission = await prisma.user_projects.update({
        where: { id: submission.id },
        data: {
          github_url: githubUrl || submission.github_url,
          live_url: liveUrl || submission.live_url,
          description: notes || submission.description,
          image_url: attachmentUrl || submission.image_url,
          status: "COMPLETED",
        },
      });
    }

    // Update lesson_progress for enrollment
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: courseId,
        },
      },
    });

    if (enrollment) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO lesson_progress (
          enrollment_id, lesson_id, completed, completed_at, last_accessed_at,
          watch_duration_seconds, watched_percentage
        )
        VALUES ($1, $2, true, NOW(), NOW(), 0, 100)
        ON CONFLICT (enrollment_id, lesson_id)
        DO UPDATE SET
          completed = true,
          completed_at = COALESCE(lesson_progress.completed_at, NOW()),
          last_accessed_at = NOW(),
          watched_percentage = 100;`,
        enrollment.id,
        lessonId
      );

      // Recalculate course completion percentage
      const totalLessons = await prisma.course_lessons.count({
        where: {
          course_sections: {
            course_id: courseId,
          },
        },
      });

      const completedLessons = await prisma.lesson_progress.count({
        where: {
          enrollment_id: enrollment.id,
          completed: true,
        },
      });

      const progPct = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
      await prisma.enrollments.update({
        where: { id: enrollment.id },
        data: {
          progress_percentage: progPct,
          last_accessed_at: new Date(),
          status: progPct >= 100 ? "COMPLETED" : "ACTIVE",
          completed_at: progPct >= 100 ? new Date() : enrollment.completed_at,
        },
      });
    }

    return NextResponse.json(
      serializeData({
        success: true,
        submission,
        completed: true,
      })
    );
  } catch (error: any) {
    console.error("Submit project error:", error);
    return NextResponse.json({ error: "Failed to submit project" }, { status: 500 });
  }
}
