import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.credential_courses.groupBy({
      by: ["category"],
      where: { published: true },
      _count: { id: true },
    });

    const result = categories.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
