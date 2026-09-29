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
        linkedin_url: body.linkedinUrl !== undefined ? body.linkedinUrl : undefined,
        github_url: body.githubUrl !== undefined ? body.githubUrl : undefined,
        portfolio_url: body.portfolioUrl !== undefined ? body.portfolioUrl : undefined,
        other_website_url: body.otherWebsiteUrl !== undefined ? body.otherWebsiteUrl : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update links" }, { status: 500 });
  }
}
