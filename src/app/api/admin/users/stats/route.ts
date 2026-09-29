import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const [totalUsers, activeUsers, verifiedUsers, totalInstructors, totalAdmins, totalLearners] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { active: true } }),
      prisma.users.count({ where: { email_verified: true } }),
      prisma.users.count({ where: { role: "INSTRUCTOR" } }),
      prisma.users.count({ where: { role: "ADMIN" } }),
      prisma.users.count({
        where: {
          OR: [
            { role: "LEARNER" },
            { role: "STUDENT" }
          ]
        }
      }),
    ]);

    const inactiveUsers = Math.max(0, totalUsers - activeUsers);
    const unverifiedUsers = Math.max(0, totalUsers - verifiedUsers);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      instructors: totalInstructors,
      administrators: totalAdmins,
      learners: totalLearners,
    });
  } catch (error: any) {
    console.error("Admin user stats error:", error);
    return NextResponse.json({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      instructors: 0,
      administrators: 0,
      learners: 0,
    });
  }
}
