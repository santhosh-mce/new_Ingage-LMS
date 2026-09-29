import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const created = await prisma.user_skills.create({
      data: {
        user_id: sessionUser.id,
        name: body.name || "",
        category: body.category || "General",
        level: body.level || "Intermediate",
        created_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(created));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}
