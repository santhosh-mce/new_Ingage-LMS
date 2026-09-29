import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const certs = await prisma.certificates.findMany({
      where: { user_id: user.id },
      include: {
        courses: { select: { title: true, slug: true, thumbnail: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData(certs));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
