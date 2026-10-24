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
    const courseIdentifier = resolvedParams.id;
    const numericId = Number(courseIdentifier);

    let course: any = null;
    if (!isNaN(numericId)) {
      course = await prisma.courses.findUnique({
        where: { id: BigInt(numericId) },
      });
    }
    if (!course) {
      course = await prisma.courses.findFirst({
        where: { slug: courseIdentifier },
      });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const cert = await prisma.certificates.findFirst({
      where: {
        user_id: user.id,
        course_id: course.id,
      },
      include: {
        courses: { select: { title: true, duration: true, instructor: true } },
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "No certificate found for this course" }, { status: 404 });
    }

    // Parse snapshot if available in pdf_path
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
        studentName: cert.student_name || user.name,
        courseId: Number(course.id),
        courseTitle: cert.course_name || course.title,
        instructor: cert.instructor_name || course.instructor || "Alex Rivera",
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
    console.error("Get course certificate error:", error);
    return NextResponse.json({ error: "Failed to fetch course certificate" }, { status: 500 });
  }
}
