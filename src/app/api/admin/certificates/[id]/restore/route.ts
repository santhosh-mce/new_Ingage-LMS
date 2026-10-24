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
      data: { status: "ISSUED" },
    });

    return NextResponse.json(
      serializeData({
        success: true,
        message: "Certificate has been restored successfully.",
        certificate: updated,
      })
    );
  } catch (error: any) {
    console.error("Restore certificate error:", error);
    return NextResponse.json({ error: "Failed to restore certificate" }, { status: 500 });
  }
}
