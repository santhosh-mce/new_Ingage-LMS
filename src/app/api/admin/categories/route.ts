import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status")?.toUpperCase().trim();

    const categories = await prisma.course_categories.findMany({
      orderBy: { display_order: "asc" },
    });

    const coursesCounts = await prisma.courses.groupBy({
      by: ["category"],
      _count: { id: true },
    });
    const countMap = new Map<string, number>();
    for (const c of coursesCounts) {
      if (c.category) countMap.set(c.category.toLowerCase(), c._count.id);
    }

    let result = categories.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      active: c.active ?? true,
      displayOrder: c.display_order,
      coursesCount: countMap.get(c.name.toLowerCase()) || 0,
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at ? c.updated_at.toISOString() : null,
    }));

    if (status === "ACTIVE") {
      result = result.filter((c) => c.active);
    } else if (status === "INACTIVE") {
      result = result.filter((c) => !c.active);
    }

    if (search) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const created = await prisma.course_categories.create({
      data: {
        name: body.name,
        slug,
        description: body.description || "",
        display_order: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
        active: body.active !== undefined ? Boolean(body.active) : true,
        created_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(created), { status: 201 });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
