import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, lessonId } = await req.json();
    if (!courseId || !lessonId) {
      return NextResponse.json({ error: "courseId and lessonId required" }, { status: 400 });
    }

    const cId = BigInt(courseId);
    const lId = BigInt(lessonId);

    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: cId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const existingProgress = await prisma.lesson_progress.findFirst({
      where: {
        enrollment_id: enrollment.id,
        lesson_id: lId,
      },
    });

    if (!existingProgress) {
      await prisma.lesson_progress.create({
        data: {
          enrollment_id: enrollment.id,
          lesson_id: lId,
          completed: true,
          completed_at: new Date(),
        },
      });
    } else if (!existingProgress.completed) {
      await prisma.lesson_progress.update({
        where: { id: existingProgress.id },
        data: {
          completed: true,
          completed_at: new Date(),
        },
      });
    }

    const totalLessons = await prisma.course_lessons.count({
      where: {
        course_sections: {
          course_id: cId,
        },
      },
    });

    const completedLessons = await prisma.lesson_progress.count({
      where: {
        enrollment_id: enrollment.id,
        completed: true,
      },
    });

    const newPercentage = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
    const isCompleted = newPercentage === 100;

    await prisma.enrollments.update({
      where: { id: enrollment.id },
      data: {
        progress_percentage: newPercentage,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        completed_at: isCompleted ? new Date() : enrollment.completed_at,
        last_accessed_at: new Date(),
      },
    });

    return NextResponse.json(serializeData({
      success: true,
      progressPercentage: newPercentage,
      isCompleted,
    }));
  } catch (error: any) {
    console.error("Complete lesson error:", error);
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 });
  }
}
