import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = BigInt(id);

    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        course_sections: {
          orderBy: { display_order: "asc" },
          include: {
            course_lessons: {
              orderBy: { display_order: "asc" },
            },
          },
        },
        enrollments: {
          take: 10,
          orderBy: { enrolled_at: "desc" },
          include: {
            users: {
              select: { id: true, name: true, email: true, profile_image: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

        const serialized: any = serializeData(course);
    if (serialized.course_sections) {
      serialized.sections = serialized.course_sections.map((sec: any) => ({
        id: Number(sec.id),
        courseId: Number(sec.course_id),
        title: sec.title,
        description: sec.description || '',
        displayOrder: sec.display_order ?? 0,
        lessons: (sec.course_lessons || []).map((les: any) => ({
          id: Number(les.id),
          sectionId: Number(les.section_id),
          title: les.title,
          description: les.description || '',
          lessonType: les.lesson_type || 'VIDEO',
          contentUrl: les.content_url || null,
          duration: les.duration || '10m',
          durationSeconds: les.duration_seconds || 600,
          displayOrder: les.display_order ?? 0,
          freePreview: Boolean(les.free_preview),
          required: Boolean(les.required),
        })),
      }));
    }
    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("Get course error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);
    const body = await req.json();

    const data: any = {
      updated_at: new Date(),
    };

    if (body.title !== undefined) data.title = body.title;
    if (body.category !== undefined) data.category = body.category;
    if (body.level !== undefined) data.level = body.level;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.final_price !== undefined) data.final_price = Number(body.final_price);
    if (body.finalPrice !== undefined) data.final_price = Number(body.finalPrice);
    if (body.description !== undefined) data.description = body.description;
    if (body.short_description !== undefined) data.short_description = body.short_description;
    if (body.shortDescription !== undefined) data.short_description = body.shortDescription;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.instructor !== undefined) data.instructor = body.instructor;
    if (body.published !== undefined) {
      data.published = body.published;
      data.status = body.published ? "PUBLISHED" : "DRAFT";
    }
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data,
    });

    return NextResponse.json(serializeData(updated));
  } catch (error: any) {
    console.error("Update course error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);

    await prisma.courses.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Delete course error:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
