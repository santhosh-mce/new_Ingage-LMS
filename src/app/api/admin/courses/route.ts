import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const status = searchParams.get("status")?.toUpperCase().trim();
    const category = searchParams.get("category")?.trim();

    const where: any = {};

    if (status && status !== "ALL") {
      if (status === "PUBLISHED") {
        where.published = true;
      } else if (status === "DRAFT" || status === "UNPUBLISHED") {
        where.published = false;
      } else {
        where.status = status;
      }
    }

    if (category && category !== "ALL") {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { instructor: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const coursesList = await prisma.courses.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        enrollments: { select: { id: true } },
      },
    });

    const formatted = coursesList.map((c) => {
      const studentsCount = c.enrollments?.length || 0;
      const numPrice = Number(c.price) || 0;
      const finalPrice = c.final_price !== null && c.final_price !== undefined ? Number(c.final_price) : numPrice;
      const courseStatus = c.status || (c.published ? "PUBLISHED" : "DRAFT");

      return {
        ...c,
        id: Number(c.id),
        price: numPrice,
        finalPrice,
        final_price: finalPrice,
        status: courseStatus,
        students: studentsCount,
        studentsCount,
        completionRate: c.published ? 85 : 0,
        revenue: studentsCount * finalPrice,
      };
    });

    return NextResponse.json(serializeData(formatted));
  } catch (error: any) {
    console.error("Failed to fetch admin courses:", error);
    return NextResponse.json({ error: "Failed to fetch admin courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const slug = (body.title || "course-" + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newCourse = await prisma.courses.create({
      data: {
        title: body.title || "Untitled Course",
        slug,
        category: body.category || "Development",
        level: body.level || "Beginner",
        price: Number(body.price) || 0,
        final_price: body.finalPrice !== undefined ? Number(body.finalPrice) : (Number(body.price) || 0),
        description: body.description || "",
        short_description: body.shortDescription || body.short_description || "",
        thumbnail: body.thumbnail || "",
        duration: body.duration || "10 Hours",
        instructor: body.instructor || user?.name || "Admin Ingage",
        language: body.language || "English",
        published: body.published ?? false,
        status: body.published ? "PUBLISHED" : "DRAFT",
        created_at: new Date(),
      },
    });

    if (user) {
      try {
        await prisma.admin_activity_logs.create({
          data: {
            action: "CREATE_COURSE",
            admin_email: user.email,
            admin_id: user.id,
            created_at: new Date(),
            details: "Created course: " + newCourse.title,
            entity_id: newCourse.id.toString(),
            entity_type: "COURSE",
          },
        });
      } catch (logErr) {
        console.warn("Could not log activity:", logErr);
      }
    }

    return NextResponse.json(serializeData(newCourse), { status: 201 });
  } catch (error: any) {
    console.error("Create course error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
