import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const course = await prisma.credential_courses.findFirst({
      where: {
        OR: [{ slug }, { id: !isNaN(Number(slug)) ? BigInt(slug) : undefined }],
      },
      include: {
        credential_modules: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Credential course not found" }, { status: 404 });
    }

    const result = {
      id: Number(course.id),
      title: course.title,
      slug: course.slug,
      provider: course.provider || "Google",
      category: course.category,
      level: course.level || "Beginner",
      duration: course.duration || "Approx. 6 months",
      description: course.description || "",
      shortDescription: course.short_description || "",
      thumbnail: course.thumbnail || "",
      credentialName: course.credential_name || "",
      credentialType: course.credential_type || "Professional Certificate",
      credentialUrl: course.credential_url || "",
      price: course.price || 0,
      discount: course.discount || 0,
      free: course.is_free ?? true,
      published: course.published ?? true,
      featured: course.featured ?? false,
      rating: course.rating || 4.8,
      learnersCount: course.learners_count || 12000,
      careerSlug: course.career_slug || "",
      modules: (course.credential_modules || []).map((m: any) => ({
        id: Number(m.id),
        title: m.title,
        description: m.description || "",
        duration: m.duration || "4 weeks",
        orderIndex: m.order_index,
      })),
      createdAt: course.created_at.toISOString(),
      updatedAt: course.updated_at ? course.updated_at.toISOString() : null,
    };

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Get credential course error:", error);
    return NextResponse.json({ error: "Failed to fetch credential course" }, { status: 500 });
  }
}
