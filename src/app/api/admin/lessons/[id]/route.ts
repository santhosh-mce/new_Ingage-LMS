import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

function formatDurationSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function parseDuration(duration: any): number {
  if (typeof duration === "number") return duration;
  if (!duration) return 0;
  const str = String(duration).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  const parts = str.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !parts.some(isNaN)) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const lessonId = BigInt(resolvedParams.id);
    const body = await req.json();

    const data: any = {
      updated_at: new Date(),
    };

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.lessonType !== undefined || body.lesson_type !== undefined) {
      data.lesson_type = (body.lessonType || body.lesson_type).toUpperCase();
    }
    if (body.contentUrl !== undefined || body.content_url !== undefined) {
      data.content_url = (body.contentUrl || body.content_url).trim();
    }
    if (body.durationSeconds !== undefined) {
      data.duration_seconds = Number(body.durationSeconds);
      if (body.duration === undefined) {
        data.duration = formatDurationSeconds(data.duration_seconds);
      }
    }
    if (body.duration !== undefined) {
      data.duration = String(body.duration).trim();
      if (data.duration_seconds === undefined) {
        data.duration_seconds = parseDuration(data.duration);
      }
    }
    if (body.freePreview !== undefined || body.free_preview !== undefined) {
      data.free_preview = Boolean(body.freePreview ?? body.free_preview);
    }
    if (body.required !== undefined) data.required = Boolean(body.required);
    if (body.displayOrder !== undefined || body.display_order !== undefined) {
      data.display_order = Number(body.displayOrder ?? body.display_order);
    }

    if (body.videoKey !== undefined || body.video_key !== undefined || body.youtubeVideoId !== undefined) {
      data.video_key = body.videoKey || body.video_key || body.youtubeVideoId || null;
    }

    const updated = await prisma.course_lessons.update({
      where: { id: lessonId },
      data,
    });

    // If quiz questions are supplied, sync them
    if (Array.isArray(body.quizQuestions)) {
      const existingQs = await prisma.quiz_questions.findMany({
        where: { lesson_id: lessonId },
        select: { id: true },
      });
      for (const eq of existingQs) {
        await prisma.quiz_question_options.deleteMany({
          where: { question_id: eq.id },
        });
      }
      await prisma.quiz_questions.deleteMany({
        where: { lesson_id: lessonId },
      });

      for (let qIdx = 0; qIdx < body.quizQuestions.length; qIdx++) {
        const q = body.quizQuestions[qIdx];
        const correctIndex = typeof q.correctAnswer === 'number'
          ? q.correctAnswer
          : (typeof q.correctAnswer === 'string' && ['A','B','C','D'].includes(q.correctAnswer.toUpperCase())
              ? ['A','B','C','D'].indexOf(q.correctAnswer.toUpperCase())
              : 0);

        const createdQ = await prisma.quiz_questions.create({
          data: {
            lesson_id: lessonId,
            question_text: q.questionText || q.question || `Question ${qIdx + 1}`,
            display_order: qIdx,
            correct_option_index: correctIndex,
            explanation: q.explanation || null,
          },
        });

        const options = Array.isArray(q.options) && q.options.length > 0
          ? q.options
          : ['Option A', 'Option B', 'Option C', 'Option D'];
        for (let optIdx = 0; optIdx < options.length; optIdx++) {
          await prisma.quiz_question_options.create({
            data: {
              question_id: createdQ.id,
              option_text: String(options[optIdx] || `Option ${optIdx + 1}`),
              option_order: optIdx,
            },
          });
        }
      }
    }

    // Recalculate course total duration
    try {
      const section = await prisma.course_sections.findUnique({
        where: { id: updated.section_id },
        select: { course_id: true },
      });
      if (section?.course_id) {
        const allLessons = await prisma.course_lessons.findMany({
          where: { course_sections: { course_id: section.course_id } },
          select: { duration_seconds: true, duration: true },
        });
        const totalSec = allLessons.reduce((acc, l) => acc + (l.duration_seconds || parseDuration(l.duration)), 0);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const courseDurText = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
        await prisma.courses.update({
          where: { id: section.course_id },
          data: { duration: courseDurText },
        });
      }
    } catch (e) {
      console.warn("Could not recalculate course duration:", e);
    }

    return NextResponse.json(
      serializeData({
        id: Number(updated.id),
        title: updated.title,
        description: updated.description || "",
        lessonType: updated.lesson_type,
        contentUrl: updated.content_url || "",
        duration: updated.duration || "0:00",
        durationSeconds: updated.duration_seconds || 0,
        freePreview: Boolean(updated.free_preview),
        required: updated.required !== false,
        displayOrder: updated.display_order,
        sectionId: Number(updated.section_id),
      })
    );
  } catch (error: any) {
    console.error("Update lesson error:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const lessonId = BigInt(resolvedParams.id);

    const lesson = await prisma.course_lessons.findUnique({
      where: { id: lessonId },
      select: { section_id: true },
    });

    await prisma.lesson_progress.deleteMany({
      where: { lesson_id: lessonId },
    });

    await prisma.quiz_questions.deleteMany({
      where: { lesson_id: lessonId },
    });

    await prisma.course_lessons.delete({
      where: { id: lessonId },
    });

    // Recalculate parent course duration
    if (lesson?.section_id) {
      try {
        const section = await prisma.course_sections.findUnique({
          where: { id: lesson.section_id },
          select: { course_id: true },
        });
        if (section?.course_id) {
          const allLessons = await prisma.course_lessons.findMany({
            where: { course_sections: { course_id: section.course_id } },
            select: { duration_seconds: true, duration: true },
          });
          const totalSec = allLessons.reduce((acc, l) => acc + (l.duration_seconds || parseDuration(l.duration)), 0);
          const hrs = Math.floor(totalSec / 3600);
          const mins = Math.floor((totalSec % 3600) / 60);
          const courseDurText = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
          await prisma.courses.update({
            where: { id: section.course_id },
            data: { duration: courseDurText },
          });
        }
      } catch (e) {
        console.warn("Could not recalculate course duration:", e);
      }
    }

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error: any) {
    console.error("Delete lesson error:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
