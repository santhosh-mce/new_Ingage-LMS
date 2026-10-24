import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    const resolvedParams = await params;
    const certId = BigInt(resolvedParams.id);

    const cert = await prisma.certificates.findUnique({
      where: { id: certId },
      include: {
        courses: { select: { title: true } },
        users: { select: { name: true } },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Return JSON download info so the client can trigger client-side ultra-resolution PDF generation with IngageCertificate and jsPDF
    return NextResponse.json({
      success: true,
      id: Number(cert.id),
      certificateNumber: cert.certificate_number,
      studentName: cert.student_name || cert.users?.name,
      courseTitle: cert.course_name || cert.courses?.title,
      issuedAt: cert.issued_at.toISOString(),
      downloadUrl: `/certificate/verify/${cert.verification_code}`,
    });
  } catch (error: any) {
    console.error("Certificate download error:", error);
    return NextResponse.json({ error: "Failed to download certificate" }, { status: 500 });
  }
}
