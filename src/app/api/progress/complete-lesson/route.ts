import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { courseId, lessonId } = body;

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }

    let lId: bigint;
    try {
      lId = BigInt(lessonId);
    } catch {
      return NextResponse.json({ error: "Invalid lessonId format" }, { status: 400 });
    }

    let cId: bigint | null = null;
    if (courseId) {
      try {
        cId = BigInt(courseId);
      } catch {}
    }

    // Auto-resolve courseId from lesson if not provided in payload
    if (!cId) {
      const lesson = await prisma.course_lessons.findUnique({
        where: { id: lId },
        include: { course_sections: true },
      });
      if (lesson?.course_sections?.course_id) {
        cId = lesson.course_sections.course_id;
      }
    }

    if (!cId) {
      return NextResponse.json({ error: "courseId and lessonId required" }, { status: 400 });
    }

    let enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: cId,
        },
      },
    });

    if (!enrollment) {
      const course = await prisma.courses.findUnique({ where: { id: cId } });
      const isFree = course?.price === 0 || (course?.final_price !== null && course?.final_price === 0);
      if (isAdminRole(user.role) || isFree) {
        enrollment = await prisma.enrollments.create({
          data: {
            user_id: user.id,
            course_id: cId,
            status: "ACTIVE",
            progress_percentage: 0,
            enrolled_at: new Date(),
            last_accessed_at: new Date(),
          },
        });
      } else {
        return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
      }
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

    const totalVideoLessons = await prisma.course_lessons.count({
      where: {
        course_sections: { course_id: cId },
        lesson_type: "VIDEO",
      },
    });

    const completedVideoLessons = await prisma.lesson_progress.count({
      where: {
        enrollment_id: enrollment.id,
        completed: true,
        course_lessons: { lesson_type: "VIDEO" },
      },
    });

    const videoPercentage = totalVideoLessons > 0 ? Math.min(100, Math.round((completedVideoLessons / totalVideoLessons) * 100)) : 0;
    const isVideoSectionCompleted = totalVideoLessons > 0 && completedVideoLessons >= totalVideoLessons;
    const overallPercentage = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
    const newPercentage = Math.max(overallPercentage, videoPercentage);
    const isCompleted = newPercentage >= 100 || isVideoSectionCompleted;

    await prisma.enrollments.update({
      where: { id: enrollment.id },
      data: {
        progress_percentage: newPercentage,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
        completed_at: isCompleted ? (enrollment.completed_at || new Date()) : enrollment.completed_at,
        last_accessed_at: new Date(),
      },
    });

    return NextResponse.json(serializeData({
      success: true,
      progressPercentage: newPercentage,
      videoPercentage,
      isVideoSectionCompleted,
      totalVideoLessons,
      completedVideoLessons,
      isCompleted,
    }));
  } catch (error: any) {
    console.error("Complete lesson error:", error);
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 });
  }
}
