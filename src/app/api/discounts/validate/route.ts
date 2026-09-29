import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { code, amount } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    const discount = await prisma.discounts.findFirst({
      where: { coupon_code: code.toUpperCase().trim(), active: true },
    });

    if (!discount) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    const orderAmount = Number(amount) || 0;
    let discountAmount = 0;

    if (discount.discount_type === "PERCENT") {
      discountAmount = (orderAmount * discount.discount_value) / 100;
    } else {
      discountAmount = discount.discount_value;
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return NextResponse.json(serializeData({
      valid: true,
      code: discount.coupon_code,
      discountAmount,
      finalAmount,
    }));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
