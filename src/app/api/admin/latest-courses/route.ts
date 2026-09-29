import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET() {
  try {
    const courses = await prisma.courses.findMany({
      take: 6,
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const mapped = courses.map((c) => ({
      ...c,
      id: Number(c.id),
      enrollments_count: c._count?.enrollments || 0,
    }));

    return NextResponse.json(serializeData(mapped));
  } catch (error: any) {
    console.error("Latest courses error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
