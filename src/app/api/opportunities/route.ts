import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");

    const where: any = { published: true, active: true };
    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }
    if (location && location !== "All") {
      where.location = { contains: location, mode: "insensitive" };
    }

    const opps = await prisma.opportunities.findMany({
      where,
      orderBy: { display_order: "asc" },
    });

    return NextResponse.json(serializeData(opps));
  } catch (error: any) {
    console.error("Opportunities error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}
