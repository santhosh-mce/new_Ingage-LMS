import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { careerId, couponCode } = body;

    const career = await prisma.careers.findUnique({
      where: { id: BigInt(careerId) },
    });

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    const orderNumber = "ORD-CAR-" + Date.now();
    const finalAmount = career.price != null ? Number(career.price) : 4999;

    return NextResponse.json({
      orderId: Number(career.id),
      orderNumber,
      amount: finalAmount,
      currency: "INR",
      itemType: "CAREER_PATH",
      careerId: Number(career.id),
      careerTitle: career.title,
      free: finalAmount === 0,
      message: "Order created successfully",
    });
  } catch (err: any) {
    console.error("Career order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
