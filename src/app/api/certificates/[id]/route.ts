import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const certId = BigInt(resolvedParams.id);

    const cert = await prisma.certificates.findUnique({
      where: { id: certId },
      include: {
        courses: { select: { title: true, instructor: true } },
        users: { select: { name: true, email: true } },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    if (cert.user_id !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let snapshot: any = {};
    if (cert.pdf_path && cert.pdf_path.startsWith("{")) {
      try {
        snapshot = JSON.parse(cert.pdf_path);
      } catch {}
    }

    return NextResponse.json(
      serializeData({
        id: Number(cert.id),
        certificateNumber: cert.certificate_number,
        verificationCode: cert.verification_code,
        studentName: cert.student_name || cert.users?.name,
        courseTitle: cert.course_name || cert.courses?.title,
        instructor: cert.instructor_name || cert.courses?.instructor || "Alex Rivera",
        completionDate: cert.completion_date?.toISOString() || cert.issued_at.toISOString(),
        issuedAt: cert.issued_at.toISOString(),
        status: cert.status,
        verificationUrl: `/certificate/verify/${cert.verification_code}`,
        downloadUrl: `/api/certificates/${cert.id}/download`,
        projectName: snapshot.projectName || "Course Capstone Project",
        projectScore: snapshot.projectScore ?? 95,
        institution: snapshot.institution || "Sathyabama Institute of Science and Technology",
      })
    );
  } catch (error: any) {
    console.error("Get certificate by id error:", error);
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 });
  }
}
