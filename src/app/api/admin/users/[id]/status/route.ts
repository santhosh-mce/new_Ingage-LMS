import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    const { active } = await req.json();

    const updated = await prisma.users.update({
      where: { id: targetUserId },
      data: { active: !!active },
    });

    return NextResponse.json({ success: true, active: updated.active });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
