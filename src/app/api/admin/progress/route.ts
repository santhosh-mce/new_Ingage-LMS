import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    // Allow admin access
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status")?.toUpperCase().trim();

    let rows: any[] = [];
    try {
      const query = `
        SELECT 
          e.id as enrollment_id,
          e.user_id,
          e.course_id,
          e.progress_percentage,
          e.status,
          e.enrolled_at,
          e.completed_at,
          e.last_accessed_at,
          u.name as user_name,
          u.email as user_email,
          c.title as course_title,
          COALESCE(cl_count.total_lessons, 0) as lessons_total,
          COALESCE(lp_count.completed_lessons, 0) as lessons_completed,
          cert.certificate_number,
          cert.verification_code
        FROM enrollments e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN courses c ON e.course_id = c.id
        LEFT JOIN (
          SELECT cs.course_id, COUNT(cl.id) as total_lessons
          FROM course_sections cs
          JOIN course_lessons cl ON cs.id = cl.section_id
          GROUP BY cs.course_id
        ) cl_count ON e.course_id = cl_count.course_id
        LEFT JOIN (
          SELECT enrollment_id, COUNT(id) as completed_lessons
          FROM lesson_progress
          WHERE completed = true
          GROUP BY enrollment_id
        ) lp_count ON e.id = lp_count.enrollment_id
        LEFT JOIN certificates cert ON e.user_id = cert.user_id AND e.course_id = cert.course_id
        ORDER BY e.enrolled_at DESC
      `;
      rows = await prisma.$queryRawUnsafe<any[]>(query);
    } catch (err) {
      console.error("Raw progress query failed, falling back to prisma findMany:", err);
      const enrollments = await prisma.enrollments.findMany({
        orderBy: { enrolled_at: "desc" },
        include: {
          users: { select: { id: true, name: true, email: true } },
          courses: { select: { id: true, title: true } },
        },
      });
      rows = enrollments.map((enr: any) => ({
        enrollment_id: enr.id,
        user_id: enr.user_id,
        course_id: enr.course_id,
        progress_percentage: enr.progress_percentage || 0,
        status: enr.status,
        enrolled_at: enr.enrolled_at,
        completed_at: enr.completed_at,
        last_accessed_at: enr.last_accessed_at,
        user_name: enr.users?.name,
        user_email: enr.users?.email,
        course_title: enr.courses?.title,
        lessons_total: 0,
        lessons_completed: 0,
        certificate_number: null,
        verification_code: null,
      }));
    }

    let result = rows.map((r: any) => {
      const totalLessons = parseInt(r.lessons_total || '0', 10);
      const completedLessons = parseInt(r.lessons_completed || '0', 10);
      let progress = typeof r.progress_percentage === 'number' 
        ? r.progress_percentage 
        : (parseInt(r.progress_percentage, 10) || 0);
      
      if (progress === 0 && totalLessons > 0 && completedLessons > 0) {
        progress = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
      }
      
      const isCompleted = r.status === 'COMPLETED' || progress >= 100 || !!r.completed_at;
      const displayStatus = isCompleted ? 'COMPLETED' : (progress > 0 ? 'IN_PROGRESS' : (r.status || 'ACTIVE'));

      return {
        enrollmentId: r.enrollment_id?.toString() || '',
        id: r.enrollment_id?.toString() || '',
        userId: r.user_id || '',
        userName: r.user_name || 'Learner',
        userEmail: r.user_email || '',
        courseId: r.course_id?.toString() || '',
        courseTitle: r.course_title || 'Course',
        progress,
        progressPercentage: progress,
        lessonsCompleted: completedLessons,
        lessonsTotal: totalLessons,
        status: displayStatus,
        rawStatus: r.status,
        enrolledAt: r.enrolled_at ? new Date(r.enrolled_at).toISOString() : '',
        enrollmentDate: r.enrolled_at ? new Date(r.enrolled_at).toISOString() : '',
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
        completionDate: r.completed_at ? new Date(r.completed_at).toISOString() : null,
        lastWatched: r.last_accessed_at ? new Date(r.last_accessed_at).toISOString() : '',
        lastAccessedAt: r.last_accessed_at ? new Date(r.last_accessed_at).toISOString() : null,
        certificateNumber: r.certificate_number || null,
        verificationCode: r.verification_code || null,
      };
    });

    if (courseId) {
      result = result.filter((r) => r.courseId === courseId);
    }

    if (status && status !== "ALL") {
      if (status === "COMPLETED") {
        result = result.filter((r) => r.status === "COMPLETED" || r.progress >= 100 || !!r.completedAt);
      } else if (status === "IN_PROGRESS") {
        result = result.filter((r) => r.status !== "COMPLETED" && r.progress < 100);
      } else {
        result = result.filter((r) => r.status.toUpperCase() === status || r.rawStatus?.toUpperCase() === status);
      }
    }

    if (search) {
      result = result.filter(
        (r) =>
          r.userName.toLowerCase().includes(search) ||
          r.userEmail.toLowerCase().includes(search) ||
          r.courseTitle.toLowerCase().includes(search) ||
          (r.certificateNumber && r.certificateNumber.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin progress error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
