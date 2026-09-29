import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.discounts.update({
      where: { id: BigInt(id) },
      data: {
        coupon_code: body.couponCode ? body.couponCode.toUpperCase().trim() : undefined,
        discount_type: body.discountType,
        discount_value: body.discountValue !== undefined ? Number(body.discountValue) : undefined,
        min_purchase_amount: body.minPurchaseAmount !== undefined ? Number(body.minPurchaseAmount) : undefined,
        max_discount: body.maxDiscount !== undefined ? Number(body.maxDiscount) : undefined,
        start_date: body.startDate ? new Date(body.startDate) : undefined,
        end_date: body.endDate ? new Date(body.endDate) : undefined,
        usage_limit: body.usageLimit !== undefined ? Number(body.usageLimit) : undefined,
        per_user_limit: body.perUserLimit !== undefined ? Number(body.perUserLimit) : undefined,
        active: body.active !== undefined ? Boolean(body.active) : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(serializeData(updated));
  } catch (error: any) {
    console.error("Update discount error:", error);
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.discounts.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete discount error:", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
