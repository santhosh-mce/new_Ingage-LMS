import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.userId) {
      return NextResponse.json([]);
    }

    const enrollments = await prisma.career_enrollments.findMany({
      where: { user_id: String(authUser.userId) },
      include: { careers: true },
    });

    const result = enrollments.map((en: any) => {
      const c = en.careers || {};
      const isCompleted = en.status === "COMPLETED";
      return {
        id: Number(en.id),
        careerId: Number(c.id || 0),
        title: c.title || "Career Path",
        slug: c.slug || "",
        category: c.category || "General",
        level: c.level || "Beginner",
        duration: c.duration || "4 months",
        imageUrl: c.image_url || "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        enrolledAt: en.enrolled_at,
        completedAt: en.completed_at,
        status: en.status || "ACTIVE",
        progressPercentage: en.progress_percentage || 0,
        certificateIssued: isCompleted,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Career my-enrollments error:", err);
    return NextResponse.json([]);
  }
}
