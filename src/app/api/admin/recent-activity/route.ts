import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET() {
  try {
    // 1. Fetch latest user registrations
    const recentUsers = await prisma.users.findMany({
      take: 8,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    // 2. Fetch latest course enrollments
    const recentEnrollments = await prisma.enrollments.findMany({
      take: 8,
      orderBy: { enrolled_at: "desc" },
      include: {
        users: { select: { name: true, email: true } },
        courses: { select: { title: true } },
      },
    });

    // 3. Fetch latest career enrollments
    let recentCareerEnrollments: any[] = [];
    try {
      recentCareerEnrollments = await prisma.career_enrollments.findMany({
        take: 5,
        orderBy: { enrolled_at: "desc" },
        include: {
          users: { select: { name: true, email: true } },
          careers: { select: { title: true } },
        },
      });
    } catch {
      // ignore if table structure differs
    }

    // Map user activities
    const userActivities = recentUsers.map((u) => ({
      id: `user-${u.id}`,
      type: "user",
      title: "New user registered",
      description: u.name || u.email || "New Student",
      timestamp: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
    }));

    // Map course enrollment activities
    const enrollmentActivities = recentEnrollments.map((e) => ({
      id: `enr-${e.id}`,
      type: "enrollment",
      title: "New enrollment",
      description: `${e.users?.name || "Student"} – ${e.courses?.title || "Course"}`,
      timestamp: e.enrolled_at ? e.enrolled_at.toISOString() : new Date().toISOString(),
    }));

    // Map career enrollment activities
    const careerActivities = recentCareerEnrollments.map((ce) => ({
      id: `career-enr-${ce.id}`,
      type: "enrollment",
      title: "New enrollment",
      description: `${ce.users?.name || "Student"} – ${ce.careers?.title || "Career Track"}`,
      timestamp: ce.enrolled_at ? ce.enrolled_at.toISOString() : new Date().toISOString(),
    }));

    // Combine and sort by timestamp descending
    const combined = [...userActivities, ...enrollmentActivities, ...careerActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return NextResponse.json(serializeData(combined));
  } catch (error: any) {
    console.error("Recent activity error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
