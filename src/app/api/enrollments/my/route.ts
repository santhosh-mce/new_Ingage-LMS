import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      // Return empty array for unauthenticated visitors so UI displays clean empty state without crashing
      return NextResponse.json([]);
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: user.id },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            category: true,
            level: true,
            duration: true,
            instructor: true,
          },
        },
      },
      orderBy: { enrolled_at: "desc" },
    });

    const result = enrollments.map((e) => ({
      id: Number(e.id),
      courseId: Number(e.courses?.id || e.course_id),
      courseTitle: e.courses?.title || "Course",
      courseSlug: e.courses?.slug || "",
      thumbnail: e.courses?.thumbnail || "",
      category: e.courses?.category || "Development",
      level: e.courses?.level || "Beginner",
      duration: e.courses?.duration || "10 Hours",
      instructor: e.courses?.instructor || "Ingage Faculty",
      status: e.status || "ACTIVE",
      progressPercentage: e.progress_percentage || 0,
      enrolledAt: e.enrolled_at ? e.enrolled_at.toISOString() : "",
      lastAccessedAt: e.last_accessed_at ? e.last_accessed_at.toISOString() : null,
      accessType: "DIRECT_COURSE",
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("My enrollments error:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}
