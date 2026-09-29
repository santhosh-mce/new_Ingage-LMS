import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await prisma.course_categories.update({
      where: { id: BigInt(id) },
      data: {
        active: Boolean(body.active),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, active: Boolean(body.active) });
  } catch (error: any) {
    console.error("Patch category status error:", error);
    return NextResponse.json({ error: "Failed to update category status" }, { status: 500 });
  }
}
