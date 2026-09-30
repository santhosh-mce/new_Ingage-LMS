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

    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, final_price: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { course_id: courseId },
      select: {
        id: true,
        status: true,
        progress_percentage: true,
        completed_at: true,
      },
    });

    const totalEnrolled = enrollments.length;
    const completedLearners = enrollments.filter(
      (e) => e.status === "COMPLETED" || Boolean(e.completed_at) || (e.progress_percentage || 0) >= 100
    ).length;
    const activeLearners = enrollments.filter(
      (e) => e.status === "ACTIVE" || ((e.progress_percentage || 0) > 0 && (e.progress_percentage || 0) < 100)
    ).length;
    const completionRate = totalEnrolled > 0 ? Math.round((completedLearners / totalEnrolled) * 100) : 0;
    const averageProgress =
      totalEnrolled > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalEnrolled)
        : 0;

    const payments = await prisma.payments.findMany({
      where: {
        course_id: courseId,
        payment_status: { in: ["COMPLETED", "PAID", "SUCCESS", "captured"] },
      },
      select: { final_amount: true, amount: true },
    });

    const directRev = payments.reduce((sum, p) => sum + (p.final_amount || p.amount || 0), 0);
    const totalPayments = payments.length;

    let finalRevenue = directRev;
    if (finalRevenue === 0) {
      const orders = await prisma.orders.findMany({
        where: {
          course_id: courseId,
          status: { in: ["COMPLETED", "PAID", "SUCCESS"] },
        },
        select: { final_amount: true },
      });
      const orderRev = orders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
      finalRevenue = orderRev > 0 ? orderRev : totalEnrolled * (course.final_price || course.price || 0);
    }

    const certificatesIssued = await prisma.certificates.count({
      where: { course_id: courseId },
    });

    return NextResponse.json({
      courseId: Number(course.id),
      courseTitle: course.title,
      totalEnrolled,
      activeLearners,
      completedLearners,
      completionRate,
      averageProgress,
      totalRevenue: finalRevenue,
      totalPayments: totalPayments > 0 ? totalPayments : totalEnrolled,
      certificatesIssued,
    });
  } catch (error: any) {
    console.error("Course analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics: " + (error?.message || error) }, { status: 500 });
  }
}
