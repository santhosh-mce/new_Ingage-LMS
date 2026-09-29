import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.credential_courses.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credential course not found" }, { status: 404 });
    }

    const updated = await prisma.credential_courses.update({
      where: { id: BigInt(id) },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        slug: body.slug !== undefined ? body.slug : existing.slug,
        provider: body.provider !== undefined ? body.provider : existing.provider,
        category: body.category !== undefined ? body.category : existing.category,
        level: body.level !== undefined ? body.level : existing.level,
        duration: body.duration !== undefined ? body.duration : existing.duration,
        description: body.description !== undefined ? body.description : existing.description,
        short_description: body.shortDescription !== undefined ? body.shortDescription : existing.short_description,
        thumbnail: body.thumbnail !== undefined ? body.thumbnail : existing.thumbnail,
        credential_name: body.credentialName !== undefined ? body.credentialName : existing.credential_name,
        credential_type: body.credentialType !== undefined ? body.credentialType : existing.credential_type,
        credential_url: body.credentialUrl !== undefined ? body.credentialUrl : existing.credential_url,
        price: typeof body.price === "number" ? body.price : existing.price,
        discount: typeof body.discount === "number" ? body.discount : existing.discount,
        is_free: body.free !== undefined ? Boolean(body.free) : existing.is_free,
        published: body.published !== undefined ? Boolean(body.published) : existing.published,
        featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
        rating: body.rating !== undefined ? body.rating : existing.rating,
        learners_count: body.learnersCount !== undefined ? body.learnersCount : existing.learners_count,
        career_slug: body.careerSlug !== undefined ? body.careerSlug : existing.career_slug,
        updated_at: new Date(),
      },
    });

    if (body.modules && Array.isArray(body.modules)) {
      await prisma.credential_modules.deleteMany({
        where: { credential_course_id: BigInt(id) },
      });
      for (let i = 0; i < body.modules.length; i++) {
        const m = body.modules[i];
        await prisma.credential_modules.create({
          data: {
            credential_course_id: BigInt(id),
            title: m.title || `Module ${i + 1}`,
            description: m.description || "",
            duration: m.duration || "3 weeks",
            order_index: m.orderIndex !== undefined ? m.orderIndex : i + 1,
          },
        });
      }
    }

    const complete = await prisma.credential_courses.findUnique({
      where: { id: BigInt(id) },
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
    }));
  } catch (error: any) {
    console.error("Admin credential course update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.credential_modules.deleteMany({
      where: { credential_course_id: BigInt(id) },
    });
    await prisma.credential_courses.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ message: "Google credential course deleted successfully", id });
  } catch (error: any) {
    console.error("Admin credential course delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
  }
}
