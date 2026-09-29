import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { formatSalaryLPA } from "@/lib/careerFormatter";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const category = searchParams.get("category");
    const level = searchParams.get("level");

    const where: any = { published: true, active: true };
    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }
    if (level && level !== "All") {
      where.level = { equals: level, mode: "insensitive" };
    }

    const careerList = await prisma.careers.findMany({
      where,
      orderBy: { display_order: "asc" },
      include: {
        career_skills: { orderBy: { display_order: "asc" } },
        career_courses: {
          include: {
            courses: {
              select: { id: true, title: true, duration: true, level: true, thumbnail: true },
            },
          },
        },
      },
    });

    let filtered = careerList;
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.category.toLowerCase().includes(search) ||
          (c.description || "").toLowerCase().includes(search)
      );
    }

    const defaultImages: Record<string, string> = {
      "data-analyst": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
      "data-scientist": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      "digital-marketing-specialist": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      "machine-learning-engineer": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "business-intelligence-analyst": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    };

    const mapped = filtered.map((c: any) => {
      const min = c.salary_min != null ? Number(c.salary_min) : 0;
      const max = c.salary_max != null ? Number(c.salary_max) : 0;
      const formattedSalary = formatSalaryLPA(c.salary_min, c.salary_max);

      const skillsList = (c.career_skills || []).map((s: any) => s.skill_name || s.skillName || "");

      const resolvedImage = c.image_url || defaultImages[c.slug] || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80";

      return {
        id: Number(c.id),
        title: c.title,
        slug: c.slug,
        category: c.category,
        description: c.description,
        shortDescription: c.short_description || (c.description ? c.description.slice(0, 140) : ""),
        level: c.level,
        duration: c.duration,
        salary: {
          min,
          max,
          currency: c.salary_currency || "INR",
          formatted: formattedSalary,
        },
        imageUrl: resolvedImage,
        icon: c.icon || "BarChart3",
        featured: Boolean(c.featured),
        popular: Boolean(c.popular),
        active: Boolean(c.active),
        displayOrder: c.display_order || 0,
        jobOpenings: c.job_openings || "15,000+",
        modulesCount: c.modules_count || 10,
        certificationName: c.certification_name || ("Certified " + c.title + " Professional"),
        skills: skillsList.length > 0 ? skillsList : ["Problem Solving", "Data Structures", "System Architecture"],
        // Compatibility properties
        image_url: resolvedImage,
        job_openings: c.job_openings || "15,000+",
        modules_count: c.modules_count || 10,
        short_description: c.short_description,
        salary_min: min,
        salary_max: max,
        salary_currency: c.salary_currency || "INR",
      };
    });

    const response = {
      content: mapped,
      totalElements: mapped.length,
      totalPages: 1,
      size: mapped.length,
      number: 0,
    };

    return NextResponse.json(serializeData(response));
  } catch (error: any) {
    console.error("Careers error:", error);
    return NextResponse.json({ error: "Failed to fetch careers" }, { status: 500 });
  }
}
