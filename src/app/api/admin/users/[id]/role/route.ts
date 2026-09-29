import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = await req.json();

    const updated = await prisma.users.update({
      where: { id },
      data: { role: role ? role.toUpperCase() : "STUDENT" },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update role" }, { status: 500 });
  }
}
