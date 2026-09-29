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
      career = await prisma.careers.findUnique({
        where: { id: BigInt(id) },
        include: {
          career_skills: true,
          career_roadmaps: { orderBy: { display_order: "asc" } },
        },
      });
    }
    if (!career) {
      career = await prisma.careers.findFirst({
        where: { slug: id },
        include: {
          career_skills: true,
          career_roadmaps: { orderBy: { display_order: "asc" } },
        },
      });
    }

    if (!career) {
      return new Response("Career curriculum not found", { status: 404 });
    }

    let text = `============================================================\n`;
    text += `           INGAGE LMS - CAREER CURRICULUM SYLLABUS\n`;
    text += `============================================================\n\n`;
    text += `Role: ${career.title}\n`;
    text += `Category: ${career.category}\n`;
    text += `Level: ${career.level}\n`;
    text += `Duration: ${career.duration}\n`;
    text += `Certification: ${career.certification_name || "Certified " + career.title + " Professional"}\n\n`;
    text += `Overview:\n${career.description}\n\n`;

    text += `Key Skills:\n`;
    if (career.career_skills && career.career_skills.length > 0) {
      career.career_skills.forEach((s: any, idx: number) => {
        text += `  ${idx + 1}. ${s.skill_name}\n`;
      });
    } else {
      text += `  - SQL, Data Structures, System Architecture, Version Control\n`;
    }
    text += `\n`;

    text += `Learning Roadmap & Modules:\n`;
    if (career.career_roadmaps && career.career_roadmaps.length > 0) {
      career.career_roadmaps.forEach((rm: any, idx: number) => {
        text += `  Module ${idx + 1}: ${rm.title} (${rm.duration || "4 weeks"})\n`;
        if (rm.description) text += `    ${rm.description}\n`;
      });
    } else {
      text += `  Module 1: Foundations of ${career.title} (3 weeks)\n`;
      text += `  Module 2: Applied Skills & Workflows (4 weeks)\n`;
      text += `  Module 3: Enterprise Architecture & Projects (4 weeks)\n`;
      text += `  Module 4: Capstone & Certification Defense (3 weeks)\n`;
    }

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${career.slug}-curriculum.txt"`,
      },
    });
  } catch (err: any) {
    return new Response("Failed to generate curriculum", { status: 500 });
  }
}
