import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET() {
  try {
    const roles = await prisma.job_roles.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
    });

    const mapped = roles.map((r: any) => ({
      id: Number(r.id),
      title: r.title,
      slug: r.slug,
      description: r.description || "",
      imageUrl: r.image_url || "",
      image_url: r.image_url || "",
      iconName: r.icon_name || "Code",
      icon_name: r.icon_name || "Code",
      difficultyLevel: r.difficulty_level || "Intermediate",
      difficulty_level: r.difficulty_level || "Intermediate",
      durationMonths: r.duration_months || 6,
      duration_months: r.duration_months || 6,
      minimumSalary: r.minimum_salary || 400000,
      minimum_salary: r.minimum_salary || 400000,
      maximumSalary: r.maximum_salary || 1200000,
      maximum_salary: r.maximum_salary || 1200000,
      jobOpenings: r.job_openings || 10000,
      job_openings: r.job_openings || 10000,
      moduleCount: r.module_count || 12,
      module_count: r.module_count || 12,
      trending: Boolean(r.trending),
      active: Boolean(r.active),
    }));

    return NextResponse.json(serializeData(mapped));
  } catch (error: any) {
    console.error("Fetch job roles error:", error);
    return NextResponse.json({ error: "Failed to fetch job roles" }, { status: 500 });
  }
}
