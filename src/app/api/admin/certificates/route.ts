import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const certs = await prisma.certificates.findMany({
      orderBy: { issued_at: "desc" },
      include: {
        users: { select: { id: true, name: true, email: true } },
        courses: { select: { id: true, title: true } },
      },
    });

    const result = certs.map((c) => ({
      id: c.id.toString(),
      certificateNumber: c.certificate_number,
      verificationCode: c.verification_code,
      userId: c.users ? c.users.id : "",
      userName: c.student_name || (c.users ? c.users.name : "Learner"),
      userEmail: c.users ? c.users.email : "",
      courseId: c.courses ? c.courses.id.toString() : null,
      courseTitle: c.course_name || (c.courses ? c.courses.title : "Program"),
      issueDate: c.issued_at.toISOString(),
      status: c.status,
      verificationUrl: "/certificate/verify/" + c.verification_code,
      downloadUrl: "/api/certificates/verify/" + c.verification_code + "/download",
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
