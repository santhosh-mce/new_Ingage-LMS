import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.credential_courses.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Credential course not found" }, { status: 404 });
    }

    const updated = await prisma.credential_courses.update({
      where: { id: BigInt(id) },
      data: {
        published: !existing.published,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(serializeData({
      id: Number(updated.id),
      published: updated.published,
    }));
  } catch (error: any) {
    console.error("Admin credential course toggle publish error:", error);
    return NextResponse.json({ error: error.message || "Failed to toggle status" }, { status: 500 });
  }
}
