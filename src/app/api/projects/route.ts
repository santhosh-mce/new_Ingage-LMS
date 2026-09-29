import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry");

    const where: any = { published: true, active: true };
    if (industry && industry !== "All") {
      where.industry = { equals: industry, mode: "insensitive" };
    }

    const projectsList = await prisma.projects.findMany({
      where,
      orderBy: { display_order: "asc" },
    });

    const result = projectsList.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      slug: p.slug,
      industry: p.industry,
      category: p.category || p.industry,
      difficulty: p.difficulty || "Intermediate",
      duration: p.duration || "4 Weeks",
      description: p.description || "",
      imageUrl: p.image_url || "",
      learnersCount: p.learners_count || 500,
      skillsCount: p.skills_count || 8,
      prerequisites: p.prerequisites || "",
      techStack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      whatYouWillBuild: [
        "Full-stack production architecture",
        "Responsive user interface",
        "Secure REST API endpoints",
        "Deployment ready code"
      ],
      learningOutcomes: [
        "Master real-world development workflows",
        "Implement production-ready security",
        "Optimize database query performance"
      ],
      skillsLearned: ["System Design", "API Development", "Database Architecture", "Deployment"],
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
