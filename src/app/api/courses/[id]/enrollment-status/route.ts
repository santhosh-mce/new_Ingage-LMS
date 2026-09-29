import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json({ enrolled: false, completed: false, progress: 0 });
    }

    const numericId = Number(rawId);
    let targetCourseId: bigint | null = null;

    if (!isNaN(numericId)) {
      targetCourseId = BigInt(numericId);
    } else {
      const idFromPrefix = rawId.startsWith("course-") ? Number(rawId.replace("course-", "")) : NaN;
      const course = await prisma.courses.findFirst({
        where: {
          OR: [
            { slug: rawId },
            ...(!isNaN(idFromPrefix) ? [{ id: BigInt(idFromPrefix) }] : []),
          ],
        },
        select: { id: true },
      });
      if (course) {
        targetCourseId = BigInt(course.id);
      }
    }

    if (!targetCourseId) {
      return NextResponse.json({ enrolled: false, completed: false, progress: 0 });
    }

    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: targetCourseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ enrolled: false, completed: false, progress: 0 });
    }

    return NextResponse.json({
      enrolled: enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED",
      completed: enrollment.status === "COMPLETED",
      progress: enrollment.progress_percentage || 0,
      enrolledAt: enrollment.enrolled_at,
    });
  } catch (error: any) {
    return NextResponse.json({ enrolled: false, completed: false, progress: 0 });
  }
}
