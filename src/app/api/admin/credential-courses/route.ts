import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const courses = await prisma.credential_courses.findMany({
      orderBy: { id: "asc" },
      include: {
        credential_modules: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    const result = courses.map((c) => ({
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
      learnersCount: c.learners_count || 0,
      careerSlug: c.career_slug || "",
      modules: (c.credential_modules || []).map((m: any) => ({
        id: Number(m.id),
        title: m.title,
        description: m.description || "",
        duration: m.duration || "4 weeks",
        orderIndex: m.order_index,
      })),
      createdAt: c.created_at ? c.created_at.toISOString() : new Date().toISOString(),
      updatedAt: c.updated_at ? c.updated_at.toISOString() : null,
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin credential courses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch credential courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const created = await prisma.credential_courses.create({
      data: {
        title: body.title,
        slug,
        provider: body.provider || "Google",
        category: body.category || "Data & Analytics",
        level: body.level || "Beginner",
        duration: body.duration || "Approx. 6 months",
        description: body.description || "",
        short_description: body.shortDescription || "",
        thumbnail: body.thumbnail || "",
        credential_name: body.credentialName || "",
        credential_type: body.credentialType || "Professional Certificate",
        credential_url: body.credentialUrl || "",
        price: typeof body.price === "number" ? body.price : 0,
        discount: typeof body.discount === "number" ? body.discount : 0,
        is_free: body.free !== undefined ? Boolean(body.free) : true,
        published: body.published !== undefined ? Boolean(body.published) : true,
        featured: body.featured !== undefined ? Boolean(body.featured) : false,
        rating: body.rating || 4.8,
        learners_count: body.learnersCount || 0,
        career_slug: body.careerSlug || "",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (body.modules && Array.isArray(body.modules)) {
      for (let i = 0; i < body.modules.length; i++) {
        const m = body.modules[i];
        await prisma.credential_modules.create({
          data: {
            credential_course_id: created.id,
            title: m.title || `Module ${i + 1}`,
            description: m.description || "",
            duration: m.duration || "3 weeks",
            order_index: m.orderIndex !== undefined ? m.orderIndex : i + 1,
          },
        });
      }
    }

    const complete = await prisma.credential_courses.findUnique({
      where: { id: created.id },
      include: {
        credential_modules: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return NextResponse.json(serializeData({
      id: Number(complete!.id),
      title: complete!.title,
      slug: complete!.slug,
      provider: complete!.provider,
      category: complete!.category,
      level: complete!.level,
      duration: complete!.duration,
      description: complete!.description,
      shortDescription: complete!.short_description,
      thumbnail: complete!.thumbnail,
      credentialName: complete!.credential_name,
      credentialType: complete!.credential_type,
      credentialUrl: complete!.credential_url,
      price: complete!.price,
      free: complete!.is_free,
      published: complete!.published,
      featured: complete!.featured,
      rating: complete!.rating,
      learnersCount: complete!.learners_count,
      careerSlug: complete!.career_slug,
      modules: (complete!.credential_modules || []).map((m: any) => ({
        id: Number(m.id),
        title: m.title,
        description: m.description,
        duration: m.duration,
        orderIndex: m.order_index,
      })),
    }), { status: 201 });
  } catch (error: any) {
    console.error("Admin credential course create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
  }
}
