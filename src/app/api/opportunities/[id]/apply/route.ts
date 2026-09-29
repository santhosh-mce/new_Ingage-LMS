import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const oppId = Number(resolvedParams.id);
    const body = await req.json();

    await prisma.opportunity_applications.create({
      data: {
        opportunity_id: BigInt(oppId),
        user_id: user.id,
        applied_at: new Date(),
        status: "SUBMITTED",
        notes: body.notes || "",
      },
    });

    return NextResponse.json({ success: true, message: "Application submitted successfully" });
  } catch (error: any) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
