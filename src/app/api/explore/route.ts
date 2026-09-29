import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET() {
  try {
    const [careers, projects] = await Promise.all([
      prisma.careers.findMany({
        orderBy: { id: "asc" },
      }),
      prisma.projects.findMany({
        orderBy: { id: "asc" },
      }),
    ]);

    const careerItems = careers.map((c) => ({
      id: Number(c.id),
      title: c.title,
      slug: c.slug,
      category: c.category || "General",
      trending: true,
      icon: "Code",
    }));

    const projectItems = projects.map((p) => ({
      id: Number(p.id),
      title: p.title,
      slug: p.slug,
      category: p.category || p.difficulty || "Intermediate",
      industry: p.industry || "Technology",
    }));

    return NextResponse.json(serializeData({
      careers: careerItems,
      projects: projectItems,
    }));
  } catch (error: any) {
    console.error("Explore API error:", error);
    return NextResponse.json({ careers: [], projects: [] });
  }
}
