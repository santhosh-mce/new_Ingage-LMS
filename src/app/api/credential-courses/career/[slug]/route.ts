import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let courses = await prisma.credential_courses.findMany({
      where: { career_slug: slug, published: true },
      include: {
        credential_modules: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (courses.length === 0) {
      courses = await prisma.credential_courses.findMany({
        where: { published: true },
        take: 3,
        include: {
          credential_modules: {
            orderBy: { order_index: "asc" },
          },
        },
      });
    }

    const mapped = courses.map((c) => ({
      id: Number(c.id),
      slug: c.slug,
      title: c.title,
      description: c.description || "",
      shortDescription: c.short_description || "",
      thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      provider: c.provider,
      category: c.category,
      level: c.level || "Beginner",
      duration: c.duration || "3-6 Months",
      price: c.price,
      discount: c.discount || 0,
      isFree: c.is_free,
      rating: c.rating || 4.8,
      learnersCount: c.learners_count || 10000,
      featured: c.featured,
      published: c.published,
      totalSkills: c.total_skills || 10,
      credentialName: c.credential_name || c.title,
      credentialType: c.credential_type || "Professional Certificate",
      credentialUrl: c.credential_url,
      careerSlug: c.career_slug,
      releaseMode: c.release_mode || "IMMEDIATE",
      modulesCount: c.credential_modules?.length || 0,
      modules: (c.credential_modules || []).map((m) => ({
        id: Number(m.id),
        orderIndex: m.order_index,
        title: m.title,
        description: m.description,
        duration: m.duration,
        lessonsCount: 5,
        externalUrl: undefined,
      })),
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error("Credential courses by career error:", err);
    return NextResponse.json([]);
  }
}
