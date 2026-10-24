import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const sectionId = BigInt(resolvedParams.id);
    const body = await req.json();

    const data: any = {
      updated_at: new Date(),
    };

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.displayOrder !== undefined) data.display_order = Number(body.displayOrder);

    const updated = await prisma.course_sections.update({
      where: { id: sectionId },
      data,
    });

    return NextResponse.json(
      serializeData({
        id: Number(updated.id),
        title: updated.title,
        description: updated.description || "",
        displayOrder: updated.display_order,
        courseId: Number(updated.course_id),
      })
    );
  } catch (error: any) {
    console.error("Update section error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const sectionId = BigInt(resolvedParams.id);

    // Get section to know its course_id for duration recalculation
    const existingSection = await prisma.course_sections.findUnique({
      where: { id: sectionId },
      select: { course_id: true },
    });

    // 1. Find all lesson IDs belonging exclusively to this section
    const lessons = await prisma.course_lessons.findMany({
      where: { section_id: sectionId },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    if (lessonIds.length > 0) {
      // Delete lesson progress for lessons in this section
      await prisma.lesson_progress.deleteMany({
        where: { lesson_id: { in: lessonIds } },
      });

      // Delete quiz question options and questions for lessons in this section
      const questions = await prisma.quiz_questions.findMany({
        where: { lesson_id: { in: lessonIds } },
        select: { id: true },
      });
      const questionIds = questions.map((q) => q.id);
      if (questionIds.length > 0) {
        await prisma.quiz_question_options.deleteMany({
          where: { question_id: { in: questionIds } },
        });
        await prisma.quiz_questions.deleteMany({
          where: { id: { in: questionIds } },
        });
      }

      // Delete lessons belonging strictly to this section
      await prisma.course_lessons.deleteMany({
        where: { section_id: sectionId },
      });
    }

    // 2. Delete the section itself
    await prisma.course_sections.delete({
      where: { id: sectionId },
    });

    // 3. Recalculate parent course duration if section existed
    if (existingSection?.course_id) {
      try {
        const remainingLessons = await prisma.course_lessons.findMany({
          where: { course_sections: { course_id: existingSection.course_id } },
          select: { duration_seconds: true, duration: true },
        });
        const totalSec = remainingLessons.reduce((acc, l) => {
          if (l.duration_seconds) return acc + l.duration_seconds;
          const match = (l.duration || "").match(/(\d+)/);
          return acc + (match ? parseInt(match[1], 10) * 60 : 0);
        }, 0);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const courseDurText = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
        await prisma.courses.update({
          where: { id: existingSection.course_id },
          data: { duration: courseDurText },
        });
      } catch (e) {
        console.warn("Could not recalculate course duration:", e);
      }
    }

    return NextResponse.json({ success: true, message: "Section deleted successfully" });
  } catch (error: any) {
    console.error("Delete section error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
