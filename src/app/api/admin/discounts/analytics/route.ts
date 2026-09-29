import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allDiscounts = await prisma.discounts.findMany();
    const totalDiscounts = allDiscounts.length;
    const activeDiscounts = allDiscounts.filter((d) => d.active).length;
    const totalUses = allDiscounts.reduce((acc, d) => acc + (d.used_count || 0), 0);

    const ordersWithDiscounts = await prisma.orders.aggregate({
      where: { discount_amount: { gt: 0 }, status: "PAID" },
      _sum: { discount_amount: true },
      _count: true,
    });

    return NextResponse.json({
      totalDiscounts,
      activeDiscounts,
      totalUses,
      totalSavingsGiven: ordersWithDiscounts._sum.discount_amount || 0,
      discountOrdersCount: ordersWithDiscounts._count,
    });
  } catch (error: any) {
    console.error("Discount analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch discount analytics" }, { status: 500 });
  }
}
