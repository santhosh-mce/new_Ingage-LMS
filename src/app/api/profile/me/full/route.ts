import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const p = body.personalInfo || {};
    const c = body.careerGoal || {};
    const l = body.links || {};

    const fullName = p.fullName || (p.firstName || p.lastName ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : undefined);

    await prisma.users.update({
      where: { id: sessionUser.id },
      data: {
        name: fullName || undefined,
        first_name: p.firstName !== undefined ? p.firstName : undefined,
        last_name: p.lastName !== undefined ? p.lastName : undefined,
        phone: p.phone !== undefined ? p.phone : undefined,
        location: p.location !== undefined ? p.location : undefined,
        date_of_birth: p.dateOfBirth !== undefined ? String(p.dateOfBirth) : undefined,
        gender: p.gender !== undefined ? p.gender : undefined,
        bio: p.bio !== undefined ? p.bio : undefined,
        target_job_role: c.targetJobRole !== undefined ? c.targetJobRole : undefined,
        preferred_industry: c.preferredIndustry !== undefined ? c.preferredIndustry : undefined,
        experience_level: c.experienceLevel !== undefined ? c.experienceLevel : undefined,
        preferred_location: c.preferredLocation !== undefined ? c.preferredLocation : undefined,
        career_goal: c.careerGoal !== undefined ? c.careerGoal : undefined,
        open_to_work: c.openToWork !== undefined ? Boolean(c.openToWork) : undefined,
        linkedin_url: l.linkedinUrl !== undefined ? l.linkedinUrl : undefined,
        github_url: l.githubUrl !== undefined ? l.githubUrl : undefined,
        portfolio_url: l.portfolioUrl !== undefined ? l.portfolioUrl : undefined,
        other_website_url: l.otherWebsiteUrl !== undefined ? l.otherWebsiteUrl : undefined,
      },
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("Full profile update error:", error);
    return NextResponse.json({ error: "Failed to update full profile" }, { status: 500 });
  }
}
