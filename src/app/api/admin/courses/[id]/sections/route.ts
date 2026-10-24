import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);
    const { searchParams } = new URL(req.url);
    const typeFilter = (searchParams.get("type") || searchParams.get("lessonType") || "").toUpperCase();

    const sections = await prisma.course_sections.findMany({
      where: { course_id: courseId },
      orderBy: { display_order: "asc" },
      include: {
        course_lessons: {
          orderBy: { display_order: "asc" },
          include: {
            quiz_questions: {
              orderBy: { display_order: "asc" },
              include: {
                quiz_question_options: {
                  orderBy: { option_order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    let formatted = sections.map((sec) => ({
      id: Number(sec.id),
      title: sec.title,
      description: sec.description || "",
      displayOrder: sec.display_order,
      courseId: Number(sec.course_id),
      lessons: (sec.course_lessons || []).map((les) => ({
        id: Number(les.id),
        title: les.title,
        description: les.description || "",
        lessonType: les.lesson_type || "VIDEO",
        contentUrl: les.content_url || "",
        duration: les.duration || "0:00",
        durationSeconds: les.duration_seconds || 0,
        freePreview: Boolean(les.free_preview),
        required: les.required !== false,
        displayOrder: les.display_order,
        sectionId: Number(les.section_id),
        videoKey: les.video_key || "",
        quizQuestions: (les.quiz_questions || []).map((q: any) => ({
          id: Number(q.id),
          questionText: q.question_text,
          correctAnswer: q.correct_option_index,
          explanation: q.explanation || "",
          displayOrder: q.display_order,
          options: (q.quiz_question_options || []).map((o: any) => o.option_text),
        })),
      })),
    }));

    // Video Curriculum Filtering:
    // When typeFilter is "VIDEO" or unspecified (default for Video Curriculum API):
    // 1. Filter each section's lessons to only valid VIDEO lessons (lessonType = "VIDEO" and valid contentUrl)
    // 2. Keep section ONLY if videoLessons.length > 0
    // 3. Do NOT return modules that contain only QUIZ, PROJECT, LIVE_CLASS, ASSIGNMENT, or empty lessons
    if (typeFilter === "VIDEO" || !typeFilter) {
      formatted = formatted
        .map((sec) => {
          const videoLessons = sec.lessons.filter(
            (les) =>
              (les.lessonType || "").toUpperCase() === "VIDEO" &&
              les.contentUrl &&
              String(les.contentUrl).trim().length > 0
          );
          return {
            ...sec,
            lessons: videoLessons,
          };
        })
        .filter((sec) => sec.lessons.length > 0);
    } else if (typeFilter === "QUIZ") {
      formatted = formatted
        .map((sec) => ({
          ...sec,
          lessons: sec.lessons.filter((les) => (les.lessonType || "").toUpperCase() === "QUIZ"),
        }))
        .filter((sec) => sec.lessons.length > 0);
    } else if (typeFilter === "PROJECT") {
      formatted = formatted
        .map((sec) => ({
          ...sec,
          lessons: sec.lessons.filter((les) =>
            ["PROJECT", "ASSIGNMENT"].includes((les.lessonType || "").toUpperCase())
          ),
        }))
        .filter((sec) => sec.lessons.length > 0);
    } else if (typeFilter === "LIVE_CLASS") {
      formatted = formatted
        .map((sec) => ({
          ...sec,
          lessons: sec.lessons.filter((les) => (les.lessonType || "").toUpperCase() === "LIVE_CLASS"),
        }))
        .filter((sec) => sec.lessons.length > 0);
    }
    // If typeFilter === "ALL", formatted is returned as-is with all sections and all lessons

    return NextResponse.json(serializeData(formatted));
  } catch (error: any) {
    console.error("Get course sections error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);
    const body = await req.json();

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Section title is required" }, { status: 400 });
    }

    const count = await prisma.course_sections.count({
      where: { course_id: courseId },
    });

    const newSection = await prisma.course_sections.create({
      data: {
        course_id: courseId,
        title,
        description: (body.description || "").trim(),
        display_order: body.displayOrder !== undefined ? Number(body.displayOrder) : count,
        created_at: new Date(),
      },
    });

    return NextResponse.json(
      serializeData({
        id: Number(newSection.id),
        title: newSection.title,
        description: newSection.description || "",
        displayOrder: newSection.display_order,
        courseId: Number(newSection.course_id),
        lessons: [],
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create course section error:", error);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}
