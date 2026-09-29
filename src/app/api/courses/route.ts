import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";

    const where: any = {
      published: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { short_description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (level && level !== "All") {
      where.level = { equals: level, mode: "insensitive" };
    }

    const coursesList = await prisma.courses.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        course_sections: {
          select: {
            id: true,
            title: true,
            course_lessons: {
              select: { id: true, title: true, duration: true, lesson_type: true },
            },
          },
        },
      },
    });

    return NextResponse.json(serializeData(coursesList));
  } catch (error: any) {
    console.error("Courses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
