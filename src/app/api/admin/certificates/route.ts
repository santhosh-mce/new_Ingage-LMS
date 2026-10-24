import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";
import { issueCourseCertificate } from "@/lib/certificateService";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch all certificates in the system
    const certs = await prisma.certificates.findMany({
      orderBy: { issued_at: "desc" },
      include: {
        users: { select: { id: true, name: true, email: true, profile_image: true } },
        courses: { select: { id: true, title: true } },
      },
    });

    // 2. Fetch all enrollments to detect students who are eligible or in-progress
    const enrollments = await prisma.enrollments.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, profile_image: true } },
        courses: {
          select: {
            id: true,
            title: true,
            course_sections: {
              include: {
                course_lessons: { select: { id: true, lesson_type: true, title: true } },
              },
            },
          },
        },
      },
    });

    const issuedMap = new Map<string, any>();
    const result: any[] = [];

    // Process issued certificates first
    for (const c of certs) {
      const key = `${c.user_id}_${c.course_id}`;
      issuedMap.set(key, c);

      let snapshot: any = {};
      if (c.pdf_path && c.pdf_path.startsWith("{")) {
        try {
          snapshot = JSON.parse(c.pdf_path);
        } catch {}
      }

      result.push({
        id: c.id.toString(),
        certificateNumber: c.certificate_number,
        verificationCode: c.verification_code,
        userId: c.users ? c.users.id : "",
        userName: c.student_name || (c.users ? c.users.name : "Learner"),
        userEmail: c.users ? c.users.email : "",
        userAvatar: c.users?.profile_image || null,
        courseId: c.courses ? c.courses.id.toString() : null,
        courseTitle: c.course_name || (c.courses ? c.courses.title : "Course"),
        completionPercentage: 100,
        projectStatus: snapshot.projectName ? "Completed" : "Completed",
        projectName: snapshot.projectName || "Course Capstone Project",
        projectScore: snapshot.projectScore ?? 95,
        isEligible: true,
        status: c.status, // "ISSUED", "REVOKED", "PENDING"
        issueDate: c.issued_at.toISOString(),
        verificationUrl: `/certificate/verify/${c.verification_code}`,
        downloadUrl: `/api/certificates/${c.id}/download`,
      });
    }

    // Process enrollments not yet certificated
    for (const enr of enrollments) {
      if (!enr.users || !enr.courses) continue;
      const key = `${enr.user_id}_${enr.course_id}`;
      if (issuedMap.has(key)) continue; // Already counted as issued

      const progressPct = Number(enr.progress_percentage || 0);
      const allLessons = (enr.courses.course_sections || []).flatMap((s: any) => s.course_lessons || []);
      const projectLessons = allLessons.filter((l: any) => (l.lesson_type || "").toUpperCase() === "PROJECT");
      const isComplete = progressPct >= 100 || enr.status === "COMPLETED";

      result.push({
        id: `pending-${enr.id}`,
        certificateNumber: "—",
        verificationCode: "",
        userId: enr.users.id,
        userName: enr.users.name || "Student",
        userEmail: enr.users.email || "",
        userAvatar: enr.users.profile_image || null,
        courseId: enr.courses.id.toString(),
        courseTitle: enr.courses.title,
        completionPercentage: progressPct,
        projectStatus: isComplete ? "Completed" : (projectLessons.length > 0 ? "Pending Review" : "In Progress"),
        projectName: projectLessons[0]?.title || "Course Project",
        projectScore: isComplete ? 90 : null,
        isEligible: isComplete,
        status: "PENDING",
        issueDate: enr.completed_at?.toISOString() || enr.enrolled_at.toISOString(),
        verificationUrl: "",
        downloadUrl: "",
      });
    }

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin certificates error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
