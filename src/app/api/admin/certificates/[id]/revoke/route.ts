import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const certId = BigInt(resolvedParams.id);

    const updated = await prisma.certificates.update({
      where: { id: certId },
      data: { status: "REVOKED" },
    });

    return NextResponse.json(
      serializeData({
        success: true,
        message: "Certificate has been revoked successfully.",
        certificate: updated,
      })
    );
  } catch (error: any) {
    console.error("Revoke certificate error:", error);
    return NextResponse.json({ error: "Failed to revoke certificate" }, { status: 500 });
  }
}
