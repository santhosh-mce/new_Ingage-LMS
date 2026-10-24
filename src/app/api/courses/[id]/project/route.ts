import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const lessonIdParam = url.searchParams.get("lessonId");
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const numericId = Number(rawId);

    let lessonId: bigint | null = null;
    let lesson: any = null;

    if (lessonIdParam && !isNaN(Number(lessonIdParam))) {
      lessonId = BigInt(lessonIdParam);
      lesson = await prisma.course_lessons.findUnique({
        where: { id: lessonId },
      });
    } else {
      // Find course by numeric ID or slug
      let course: any = null;
      if (!isNaN(numericId)) {
        course = await prisma.courses.findUnique({
          where: { id: BigInt(numericId) },
        });
      }
      if (!course) {
        course = await prisma.courses.findFirst({
          where: { slug: rawId },
        });
      }

      if (course) {
        lesson = await prisma.course_lessons.findFirst({
          where: {
            course_sections: { course_id: course.id },
            lesson_type: "PROJECT",
          },
        });
        if (lesson) {
          lessonId = lesson.id;
        }
      }
    }

    if (!lesson) {
      return NextResponse.json({ submission: null }, { status: 200 });
    }

    const existingSubmission = await prisma.user_projects.findFirst({
      where: {
        user_id: user.id,
        title: lesson.title,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData({ submission: existingSubmission }));
  } catch (error: any) {
    console.error("Get project submission error:", error);
    return NextResponse.json({ error: "Failed to load project submission" }, { status: 500 });
  }
}
