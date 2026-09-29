import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const active = Boolean(body.active);

    await prisma.opportunities.update({
      where: { id: BigInt(id) },
      data: { active, updated_at: new Date() },
    });

    return NextResponse.json({ success: true, active });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to toggle status" }, { status: 500 });
  }
}
