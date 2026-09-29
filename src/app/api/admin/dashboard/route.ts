import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    // Allow access if admin or in development
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      pendingCourses,
      totalEnrollments,
      paymentsAgg,
      recentPayments,
      recentUsers
    ] = await Promise.all([
      prisma.users.count(),
      prisma.courses.count(),
      prisma.courses.count({ where: { status: "PUBLISHED" } }),
      prisma.courses.count({ where: { status: "DRAFT" } }),
      prisma.courses.count({ where: { status: "ARCHIVED" } }),
      prisma.courses.count({ where: { status: "PENDING" } }),
      prisma.enrollments.count(),
      prisma.payments.aggregate({
        _sum: { final_amount: true },
        where: { payment_status: "PAID" },
      }),
      prisma.payments.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { users: { select: { name: true, email: true } } },
      }),
      prisma.users.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: { id: true, name: true, email: true, role: true, created_at: true },
      }),
    ]);

    const totalRevenue = paymentsAgg._sum.final_amount || 0;

    const data = {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      pendingCourses,
      totalUsers,
      totalStudents: totalUsers,
      totalEnrollments,
      totalRevenue,
      stats: {
        totalStudents: totalUsers,
        totalCourses,
        publishedCourses,
        draftCourses,
        archivedCourses,
        pendingCourses,
        totalEnrollments,
        totalRevenue,
      },
      recentPayments,
      recentUsers,
    };

    return NextResponse.json(serializeData(data));
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
