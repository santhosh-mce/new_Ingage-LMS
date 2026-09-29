import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseId = Number(resolvedParams.id);

    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: BigInt(courseId),
        },
      },
    });

    if (!enrollment && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        course_sections: {
          orderBy: { display_order: "asc" },
          include: {
            course_lessons: {
              orderBy: { display_order: "asc" },
            },
          },
        },
      },
    });

    const progressRecords = enrollment
      ? await prisma.lesson_progress.findMany({
          where: { enrollment_id: enrollment.id },
        })
      : [];

    return NextResponse.json(serializeData({
      course,
      enrollment,
      progress: progressRecords,
      userWatermark: {
        email: user.email,
        userId: user.id,
      },
    }));
  } catch (error: any) {
    console.error("Course learn error:", error);
    return NextResponse.json({ error: "Failed to load learning environment" }, { status: 500 });
  }
}
