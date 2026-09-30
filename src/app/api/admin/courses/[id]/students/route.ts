import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const courseId = BigInt(resolvedParams.id);

    const enrollments = await prisma.enrollments.findMany({
      where: { course_id: courseId },
      orderBy: { enrolled_at: "desc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, profile_image: true },
        },
      },
    });

    const certificates = await prisma.certificates.findMany({
      where: { course_id: courseId },
      select: {
        id: true,
        user_id: true,
        certificate_number: true,
        verification_code: true,
        certificate_url: true,
      },
    });

    const certMap = new Map();
    certificates.forEach((c) => certMap.set(c.user_id, c));

    const students = enrollments.map((e) => {
      const cert = certMap.get(e.user_id);
      const isCompleted = e.status === "COMPLETED" || Boolean(e.completed_at) || (e.progress_percentage || 0) >= 100;
      return {
        enrollmentId: Number(e.id),
        userId: e.user_id,
        userName: e.users?.name || "Learner",
        userEmail: e.users?.email || "learner@ingage.com",
        enrollmentDate: e.enrolled_at ? e.enrolled_at.toISOString() : new Date().toISOString(),
        progress: e.progress_percentage ?? 0,
        lastAccessed: e.last_accessed_at ? e.last_accessed_at.toISOString() : null,
        completed: isCompleted,
        hasCertificate: Boolean(cert),
        certificateId: cert ? Number(cert.id) : undefined,
        certificateNumber: cert?.certificate_number || null,
        verificationCode: cert?.verification_code || null,
        certificateUrl: cert?.certificate_url || null,
      };
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error("Course students API error:", error);
    return NextResponse.json({ error: "Failed to fetch course students: " + (error?.message || error) }, { status: 500 });
  }
}
