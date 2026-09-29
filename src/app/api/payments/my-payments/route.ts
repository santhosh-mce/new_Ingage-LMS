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

    const paymentsList = await prisma.payments.findMany({
      where: { user_id: user.id },
      include: {
        courses: { select: { title: true, slug: true, thumbnail: true } },
        careers: { select: { title: true, slug: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(serializeData(paymentsList));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
