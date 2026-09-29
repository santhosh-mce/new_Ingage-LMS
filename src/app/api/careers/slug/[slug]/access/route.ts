import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const career = await prisma.careers.findFirst({ where: { slug } });

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    const authUser = await getAuthUser(req);
    let enrolled = false;
    let progressPercentage = 0;
    let completed = false;

    if (authUser && authUser.userId) {
      const enrollment = await prisma.career_enrollments.findFirst({
        where: {
          user_id: String(authUser.userId),
          career_id: career.id,
        },
      });

      if (enrollment) {
        enrolled = true;
        progressPercentage = enrollment.progress_percentage || 0;
        completed = enrollment.status === "COMPLETED";
      }
    }

    return NextResponse.json({
      careerId: Number(career.id),
      careerTitle: career.title,
      careerSlug: career.slug,
      enrolled,
      status: enrolled ? (completed ? "COMPLETED" : "ACTIVE") : "NOT_ENROLLED",
      progressPercentage,
      completed,
      certificateAvailable: completed,
    });
  } catch (err: any) {
    console.error("Career access error:", err);
    return NextResponse.json({ error: "Failed to fetch career access" }, { status: 500 });
  }
}
