import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await prisma.admin_activity_logs.findMany({
      take: 50,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData(logs));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
