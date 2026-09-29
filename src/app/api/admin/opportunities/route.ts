import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const opps = await prisma.opportunities.findMany({
      orderBy: { created_at: "desc" },
    });

    const result = opps.map((o) => ({
      id: o.id.toString(),
      title: o.title,
      company: o.company,
      companyLogo: o.company_logo || "",
      location: o.location || "Remote",
      type: o.type,
      workMode: o.work_mode,
      salary: o.salary || "Competitive",
      experienceLevel: o.experience_level || "Entry Level",
      category: o.category || "General",
      matchScore: o.match_score || 85,
      requiredSkills: [],
      description: o.description || "",
      aboutCompany: o.about_company || "",
      responsibilities: [],
      qualifications: [],
      benefits: [],
      deadline: o.deadline || "",
      postedDate: o.created_at ? o.created_at.toISOString() : "",
      roleTrackId: o.role_track_id || "",
      active: o.active ?? true,
      published: o.published ?? true,
      displayOrder: o.display_order,
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin opportunities error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const created = await prisma.opportunities.create({
      data: {
        title: body.title,
        company: body.company,
        company_logo: body.companyLogo || "",
        location: body.location || "Remote",
        type: body.type || "Job",
        work_mode: body.workMode || "Remote",
        salary: body.salary || "Competitive",
        experience_level: body.experienceLevel || "Entry Level",
        category: body.category || "General",
        match_score: Number(body.matchScore) || 85,
        description: body.description || "",
        about_company: body.aboutCompany || "",
        deadline: body.deadline ? String(body.deadline) : null,
        role_track_id: body.roleTrackId || "",
        active: body.active !== undefined ? Boolean(body.active) : true,
        published: body.published !== undefined ? Boolean(body.published) : true,
        display_order: Number(body.displayOrder) || 0,
        featured: Boolean(body.featured),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(created), { status: 201 });
  } catch (error: any) {
    console.error("Create opportunity error:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
