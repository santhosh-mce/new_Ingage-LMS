import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await prisma.users.update({
      where: { id: sessionUser.id },
      data: {
        target_job_role: body.targetJobRole !== undefined ? body.targetJobRole : undefined,
        preferred_industry: body.preferredIndustry !== undefined ? body.preferredIndustry : undefined,
        experience_level: body.experienceLevel !== undefined ? body.experienceLevel : undefined,
        preferred_location: body.preferredLocation !== undefined ? body.preferredLocation : undefined,
        career_goal: body.careerGoal !== undefined ? body.careerGoal : undefined,
        open_to_work: body.openToWork !== undefined ? Boolean(body.openToWork) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update career goal" }, { status: 500 });
  }
}
