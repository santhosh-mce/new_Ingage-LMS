import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const sectionId = BigInt(resolvedParams.id);
    const body = await req.json();

    const data: any = {
      updated_at: new Date(),
    };

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.displayOrder !== undefined) data.display_order = Number(body.displayOrder);

    const updated = await prisma.course_sections.update({
      where: { id: sectionId },
      data,
    });

    return NextResponse.json(
      serializeData({
        id: Number(updated.id),
        title: updated.title,
        description: updated.description || "",
        displayOrder: updated.display_order,
        courseId: Number(updated.course_id),
      })
    );
  } catch (error: any) {
    console.error("Update section error:", error);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const sectionId = BigInt(resolvedParams.id);

    // Delete lessons belonging to this section first
    await prisma.course_lessons.deleteMany({
      where: { section_id: sectionId },
    });

    await prisma.course_sections.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({ success: true, message: "Section deleted successfully" });
  } catch (error: any) {
    console.error("Delete section error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
