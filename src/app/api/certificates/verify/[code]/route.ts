import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const resolvedParams = await params;
    const { code } = resolvedParams;

    const cert = await prisma.certificates.findFirst({
      where: { verification_code: code },
      include: {
        users: { select: { name: true, email: true } },
        courses: { select: { title: true, duration: true, instructor: true } },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found or invalid" }, { status: 404 });
    }

    return NextResponse.json(serializeData({
      valid: true,
      certificateNumber: cert.certificate_number,
      verificationCode: cert.verification_code,
      studentName: cert.student_name || cert.users?.name,
      courseName: cert.course_name || cert.courses?.title,
      instructorName: cert.instructor_name || cert.courses?.instructor || "Ingage LMS Academic Board",
      issueDate: cert.issued_at,
      status: cert.status,
    }));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to verify certificate" }, { status: 500 });
  }
}
