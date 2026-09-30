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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const sectionId = BigInt(resolvedParams.id);
    const body = await req.json();

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Lesson title is required" }, { status: 400 });
    }

    const count = await prisma.course_lessons.count({
      where: { section_id: sectionId },
    });

    let durationSec = body.durationSeconds !== undefined ? Number(body.durationSeconds) : parseDuration(body.duration);
    let durationStr = body.duration ? String(body.duration).trim() : formatDurationSeconds(durationSec);

    const newLesson = await prisma.course_lessons.create({
      data: {
        section_id: sectionId,
        title,
        description: (body.description || "").trim(),
        lesson_type: (body.lessonType || body.lesson_type || "VIDEO").toUpperCase(),
        content_url: (body.contentUrl || body.content_url || "").trim(),
        duration: durationStr,
        duration_seconds: durationSec,
        free_preview: Boolean(body.freePreview || body.free_preview),
        required: body.required !== false,
        display_order: body.displayOrder !== undefined ? Number(body.displayOrder) : count,
        video_key: body.videoKey || body.video_key || body.youtubeVideoId || null,
        created_at: new Date(),
      },
    });

    if (Array.isArray(body.quizQuestions) && body.quizQuestions.length > 0) {
      for (let qIdx = 0; qIdx < body.quizQuestions.length; qIdx++) {
        const q = body.quizQuestions[qIdx];
        const correctIndex = typeof q.correctAnswer === 'number'
          ? q.correctAnswer
          : (typeof q.correctAnswer === 'string' && ['A','B','C','D'].includes(q.correctAnswer.toUpperCase())
              ? ['A','B','C','D'].indexOf(q.correctAnswer.toUpperCase())
              : 0);

        const createdQ = await prisma.quiz_questions.create({
          data: {
            lesson_id: newLesson.id,
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

    // Update parent course total duration if course exists
    try {
      const section = await prisma.course_sections.findUnique({
        where: { id: sectionId },
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
        id: Number(newLesson.id),
        title: newLesson.title,
        description: newLesson.description || "",
        lessonType: newLesson.lesson_type,
        contentUrl: newLesson.content_url || "",
        duration: newLesson.duration || "0:00",
        durationSeconds: newLesson.duration_seconds || 0,
        freePreview: Boolean(newLesson.free_preview),
        required: newLesson.required !== false,
        displayOrder: newLesson.display_order,
        sectionId: Number(newLesson.section_id),
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create lesson error:", error);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
