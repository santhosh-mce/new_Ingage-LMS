import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const where: any = { published: true };
    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }
    if (level && level !== "All") {
      where.level = { equals: level, mode: "insensitive" };
    }

    const courses = await prisma.credential_courses.findMany({
      where,
      orderBy: { id: "asc" },
      include: {
        credential_modules: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    let result = courses.map((c) => ({
      id: Number(c.id),
      title: c.title,
      slug: c.slug,
      provider: c.provider || "Google",
      category: c.category,
      level: c.level || "Beginner",
      duration: c.duration || "Approx. 6 months",
      description: c.description || "",
      shortDescription: c.short_description || "",
      thumbnail: c.thumbnail || "",
      credentialName: c.credential_name || "",
      credentialType: c.credential_type || "Professional Certificate",
      credentialUrl: c.credential_url || "",
      price: c.price || 0,
      discount: c.discount || 0,
      free: c.is_free ?? true,
      published: c.published ?? true,
      featured: c.featured ?? false,
      rating: c.rating || 4.8,
      learnersCount: c.learners_count || 12000,
      careerSlug: c.career_slug || "",
      modules: (c.credential_modules || []).map((m: any) => ({
        id: Number(m.id),
        title: m.title,
        description: m.description || "",
        duration: m.duration || "4 weeks",
        orderIndex: m.order_index,
      })),
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at ? c.updated_at.toISOString() : null,
    }));

    if (search) {
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.category.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.credentialName.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Credential courses error:", error);
    return NextResponse.json({ error: "Failed to fetch credential courses" }, { status: 500 });
  }
}
