import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const lessonId = BigInt(resolvedParams.lessonId);

    // Fetch quiz questions for this lesson
    const questions = await prisma.quiz_questions.findMany({
      where: { lesson_id: lessonId },
      orderBy: { display_order: "asc" },
      include: {
        quiz_question_options: {
          orderBy: { option_order: "asc" },
        },
      },
    });

    // Map questions for student view (do not expose correct_option_index)
    const mapped = questions.map((q) => ({
      id: Number(q.id),
      lessonId: Number(q.lesson_id),
      questionText: q.question_text,
      options: (q.quiz_question_options || []).map((o) => o.option_text),
      displayOrder: q.display_order,
    }));

    return NextResponse.json(serializeData(mapped));
  } catch (error: any) {
    console.error("Fetch quiz error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz questions" }, { status: 500 });
  }
}
