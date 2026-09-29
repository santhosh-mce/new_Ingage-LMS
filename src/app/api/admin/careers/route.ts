import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const careers = await prisma.careers.findMany({
      orderBy: { display_order: "asc" },
    });

    return NextResponse.json(serializeData(careers));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch admin careers" }, { status: 500 });
  }
}
