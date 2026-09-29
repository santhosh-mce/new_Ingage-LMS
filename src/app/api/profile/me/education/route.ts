import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const created = await prisma.user_education.create({
      data: {
        user_id: sessionUser.id,
        degree: body.degree || "",
        institution: body.institution || "",
        qualification: body.qualification || "B.Tech / B.E.",
        department: body.department || "",
        graduation_year: body.graduationYear || "",
        cgpa: body.cgpa || "",
        created_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(created));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add education" }, { status: 500 });
  }
}
