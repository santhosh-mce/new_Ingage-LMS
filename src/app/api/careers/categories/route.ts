import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const careers = await prisma.careers.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    const categories = careers
      .map((c) => c.category)
      .filter((c): c is string => Boolean(c));
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json([], { status: 200 });
  }
}
