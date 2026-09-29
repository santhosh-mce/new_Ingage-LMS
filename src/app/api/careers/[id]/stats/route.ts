import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNum = !isNaN(Number(id));

    let career: any = null;
    if (isNum) {
      career = await prisma.careers.findUnique({ where: { id: BigInt(id) } });
    }
    if (!career) {
      career = await prisma.careers.findFirst({ where: { slug: id } });
    }

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    const cId = career.id;
    const [courses, projects, jobs, skills] = await Promise.all([
      prisma.career_courses.count({ where: { career_id: cId } }),
      prisma.career_projects.count({ where: { career_id: cId } }),
      prisma.career_opportunities.count({ where: { career_id: cId } }),
      prisma.career_skills.count({ where: { career_id: cId } }),
    ]);

    return NextResponse.json({
      courseCount: courses,
      projectCount: projects,
      jobCount: jobs,
      skillCount: skills,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
