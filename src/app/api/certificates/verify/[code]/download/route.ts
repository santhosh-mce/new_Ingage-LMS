import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cert = await prisma.certificates.findFirst({
      where: {
        OR: [
          { verification_code: code },
          { certificate_number: code },
        ],
      },
      include: { users: true, courses: true },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      code: cert.verification_code || cert.certificate_number,
      studentName: cert.student_name || cert.users?.name,
      courseTitle: cert.course_name || cert.courses?.title,
      issuedAt: cert.issued_at,
      pdfPath: cert.pdf_path || cert.certificate_url,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to download certificate" }, { status: 500 });
  }
}
