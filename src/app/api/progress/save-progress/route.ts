import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      lessonId,
      courseId,
      currentTime = 0,
      duration = 0,
      watchDurationSeconds = 0,
      watchedPercentage = 0,
      completed = false,
    } = body;

    if (!lessonId) {
      return NextResponse.json(
        { success: false, message: "lessonId is required" },
        { status: 400 }
      );
    }

    let lId: bigint;
    try {
      lId = BigInt(lessonId);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid lessonId format" },
        { status: 400 }
      );
    }

    // Lookup lesson and associated course
    const lesson = await prisma.course_lessons.findUnique({
      where: { id: lId },
      include: {
        course_sections: {
          include: {
            courses: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, message: "Lesson not found" },
        { status: 404 }
      );
    }

    const section = lesson.course_sections;
    const course = section?.courses;
    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course associated with lesson not found" },
        { status: 404 }
      );
    }

    const resolvedCourseId = course.id;
    const isAdmin = isAdminRole(user.role);

    // Find enrollment for user
    let enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: resolvedCourseId,
        },
      },
    });

    const isFree = course.price === 0 || (course.final_price !== null && course.final_price === 0);

    if (!enrollment) {
      if (isAdmin || isFree) {
        enrollment = await prisma.enrollments.create({
          data: {
            user_id: user.id,
            course_id: resolvedCourseId,
            status: "ACTIVE",
            progress_percentage: 0,
            enrolled_at: new Date(),
            last_accessed_at: new Date(),
          },
        });
      } else {
        return NextResponse.json(
          { success: false, message: "Active enrollment required to track course progress" },
          { status: 403 }
        );
      }
    }

    // Lookup existing progress
    const existingProgress = await prisma.lesson_progress.findFirst({
      where: {
        enrollment_id: enrollment.id,
        lesson_id: lId,
      },
    });

    const numCurTime = Math.max(0, Math.round(Number(currentTime) || 0));
    const numDuration = Math.max(0, Math.round(Number(duration) || 0));
    const numWatchSec = Math.max(
      existingProgress?.watch_duration_seconds || 0,
      Math.round(Number(watchDurationSeconds) || 0)
    );
    const numPercent = Math.max(
      existingProgress?.watched_percentage || 0,
      Math.min(100, Math.round(Number(watchedPercentage) || (numDuration > 0 ? (numWatchSec / numDuration) * 100 : 0)))
    );

    // Threshold completion check: >= 90% watched OR explicit completed flag
    const shouldMarkComplete =
      Boolean(existingProgress?.completed) ||
      Boolean(completed) ||
      numPercent >= 90 ||
      (numDuration > 0 && numWatchSec >= numDuration * 0.9);

    // Upsert directly into PostgreSQL lesson_progress table to ensure atomic persistence & bypass client caching
    await prisma.$executeRawUnsafe(
      `INSERT INTO lesson_progress (
        enrollment_id, lesson_id, completed, completed_at, last_accessed_at,
        watch_duration_seconds, last_position_seconds, total_duration_seconds, watched_percentage
      )
      VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
      ON CONFLICT (enrollment_id, lesson_id)
      DO UPDATE SET
        completed = CASE WHEN EXCLUDED.completed = true THEN true ELSE lesson_progress.completed END,
        completed_at = CASE WHEN EXCLUDED.completed = true AND lesson_progress.completed_at IS NULL THEN NOW() ELSE lesson_progress.completed_at END,
        last_accessed_at = NOW(),
        watch_duration_seconds = GREATEST(COALESCE(lesson_progress.watch_duration_seconds, 0), EXCLUDED.watch_duration_seconds),
        last_position_seconds = EXCLUDED.last_position_seconds,
        total_duration_seconds = CASE WHEN EXCLUDED.total_duration_seconds > 0 THEN EXCLUDED.total_duration_seconds ELSE lesson_progress.total_duration_seconds END,
        watched_percentage = GREATEST(COALESCE(lesson_progress.watched_percentage, 0), EXCLUDED.watched_percentage);`,
      enrollment.id,
      lId,
      shouldMarkComplete,
      shouldMarkComplete ? new Date() : null,
      numWatchSec,
      numCurTime,
      numDuration,
      numPercent
    );

    // Calculate real course completion percentage
    let courseProgressPercentage = enrollment.progress_percentage || 0;
    if (shouldMarkComplete) {
      const totalLessons = await prisma.course_lessons.count({
        where: {
          course_sections: {
            course_id: resolvedCourseId,
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
          course_sections: { course_id: resolvedCourseId },
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

      courseProgressPercentage = Math.max(overallPercentage, videoPercentage);
      const isCourseCompleted = courseProgressPercentage >= 100 || isVideoSectionCompleted;

      await prisma.enrollments.update({
        where: { id: enrollment.id },
        data: {
          progress_percentage: courseProgressPercentage,
          last_accessed_at: new Date(),
          status: isCourseCompleted ? "COMPLETED" : "ACTIVE",
          completed_at: isCourseCompleted ? (enrollment.completed_at || new Date()) : enrollment.completed_at,
        },
      });
    }

    return NextResponse.json(
      serializeData({
        success: true,
        completed: shouldMarkComplete,
        watchedPercentage: numPercent,
        watchDurationSeconds: numWatchSec,
        lastPositionSeconds: numCurTime,
        totalDurationSeconds: numDuration,
        courseProgressPercentage,
      })
    );
  } catch (error: any) {
    console.error("Save lesson progress error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save progress" },
      { status: 500 }
    );
  }
}
