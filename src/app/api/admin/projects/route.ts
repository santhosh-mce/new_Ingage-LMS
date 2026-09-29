import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const projects = await prisma.projects.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData(projects));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch admin projects" }, { status: 500 });
  }
}
