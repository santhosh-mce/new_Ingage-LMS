import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    const resolvedParams = await params;
    const lessonId = BigInt(resolvedParams.lessonId);
    const body = await req.json();

    const questionId = Number(body.questionId);
    const selectedOptionIndex = Number(body.selectedOptionIndex);

    if (isNaN(questionId) || isNaN(selectedOptionIndex)) {
      return NextResponse.json({ error: "Invalid question submission payload" }, { status: 400 });
    }

    const question = await prisma.quiz_questions.findUnique({
      where: { id: BigInt(questionId) },
    });

    if (!question || question.lesson_id !== lessonId) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = question.correct_option_index === selectedOptionIndex;

    const totalQuestions = await prisma.quiz_questions.count({
      where: { lesson_id: lessonId },
    });

    return NextResponse.json({
      correct: isCorrect,
      correctOptionIndex: question.correct_option_index,
      explanation: question.explanation || (isCorrect ? "Correct answer!" : "Incorrect option selected."),
      totalQuestions,
      quizCompleted: false,
    });
  } catch (error: any) {
    console.error("Submit quiz answer error:", error);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
