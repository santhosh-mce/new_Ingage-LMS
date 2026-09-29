import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCareerDetailResponse } from "@/lib/careerFormatter";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const career = await prisma.careers.findFirst({
      where: { slug },
      include: {
        career_courses: {
          include: { courses: true },
          orderBy: { display_order: "asc" },
        },
        career_skills: { orderBy: { display_order: "asc" } },
        career_opportunities: { orderBy: { display_order: "asc" } },
        career_projects: { orderBy: { display_order: "asc" } },
        career_responsibilities: { orderBy: { display_order: "asc" } },
        career_roadmaps: { orderBy: { display_order: "asc" } },
      },
    });

    if (!career) {
      return NextResponse.json({ error: "Career roadmap not found" }, { status: 404 });
    }

    return NextResponse.json(formatCareerDetailResponse(career));
  } catch (error: any) {
    console.error("Career slug error:", error);
    return NextResponse.json({ error: "Failed to fetch career roadmap" }, { status: 500 });
  }
}
