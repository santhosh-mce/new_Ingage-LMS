import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCareerDetailResponse } from "@/lib/careerFormatter";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNum = !isNaN(Number(id));

    let career: any = null;
    if (isNum) {
      career = await prisma.careers.findUnique({
        where: { id: BigInt(id) },
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
    }

    if (!career) {
      career = await prisma.careers.findFirst({
        where: { slug: id },
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
    }

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    return NextResponse.json(formatCareerDetailResponse(career));
  } catch (error: any) {
    console.error("Career detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch career details" }, { status: 500 });
  }
}
