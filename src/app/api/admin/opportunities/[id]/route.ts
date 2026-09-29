import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.opportunities.update({
      where: { id: BigInt(id) },
      data: {
        title: body.title,
        company: body.company,
        company_logo: body.companyLogo,
        location: body.location,
        type: body.type,
        work_mode: body.workMode,
        salary: body.salary,
        experience_level: body.experienceLevel,
        category: body.category,
        description: body.description,
        about_company: body.aboutCompany,
        deadline: body.deadline !== undefined ? String(body.deadline) : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
        published: body.published !== undefined ? Boolean(body.published) : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(updated));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await prisma.opportunities.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}
