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

    const paymentsList = await prisma.payments.findMany({
      orderBy: { created_at: "desc" },
      include: {
        users: { select: { id: true, name: true, email: true } },
        courses: { select: { id: true, title: true } },
        careers: { select: { id: true, title: true } },
        orders: { select: { id: true, order_number: true } },
      },
    });

    const result = paymentsList.map((p) => ({
      id: p.id.toString(),
      paymentNumber: p.payment_number,
      orderNumber: p.orders ? p.orders.order_number : "",
      razorpayPaymentId: p.razorpay_payment_id || "",
      razorpayOrderId: p.razorpay_order_id || "",
      userName: p.users ? p.users.name : "Unknown",
      userEmail: p.users ? p.users.email : "",
      courseName: p.courses ? p.courses.title : (p.careers ? p.careers.title : ""),
      itemType: p.payment_type || (p.careers ? "CAREER_PATH" : "COURSE"),
      amount: p.amount,
      discount: p.discount,
      finalAmount: p.final_amount,
      currency: p.currency || "INR",
      paymentMethod: p.payment_method || "RAZORPAY",
      paymentStatus: p.payment_status,
      paymentDate: p.created_at ? p.created_at.toISOString() : "",
    }));

    return NextResponse.json(serializeData(result));
  } catch (error: any) {
    console.error("Admin payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
