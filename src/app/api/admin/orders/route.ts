import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ordersList = await prisma.orders.findMany({
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, name: true, email: true } },
        courses: { select: { id: true, title: true } },
        careers: { select: { id: true, title: true } },
      },
    });

    const result = ordersList.map((o) => ({
      id: o.id.toString(),
      orderNumber: o.order_number,
      razorpayOrderId: o.razorpay_order_id || "",
      userName: o.users ? o.users.name : "Unknown",
      userEmail: o.users ? o.users.email : "",
      courseName: o.courses ? o.courses.title : (o.careers ? o.careers.title : ""),
      itemType: o.payment_type || (o.careers ? "CAREER_PATH" : "COURSE"),
      originalAmount: o.original_amount,
      discountAmount: o.discount_amount,
      finalAmount: o.final_amount,
      currency: o.currency || "INR",
      couponCode: o.coupon_code || "",
      status: o.status,
      createdAt: o.created_at ? o.created_at.toISOString() : "",
      paidAt: o.paid_at ? o.paid_at.toISOString() : null,
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
