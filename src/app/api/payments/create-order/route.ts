import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, careerId, couponCode } = await req.json();

    let amount = 0;
    let title = "";
    let itemType = "COURSE";

    if (courseId) {
      const course = await prisma.courses.findUnique({
        where: { id: BigInt(courseId) },
      });
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
      amount = course.final_price || course.price;
      title = course.title;
      itemType = "COURSE";
    } else if (careerId) {
      const career = await prisma.careers.findUnique({
        where: { id: BigInt(careerId) },
      });
      if (!career) {
        return NextResponse.json({ error: "Career not found" }, { status: 404 });
      }
      amount = 4999;
      title = career.title;
      itemType = "CAREER";
    } else {
      return NextResponse.json({ error: "courseId or careerId required" }, { status: 400 });
    }

    let discountAmount = 0;
    if (couponCode) {
      const discount = await prisma.discounts.findFirst({
        where: { coupon_code: couponCode.toUpperCase().trim(), active: true },
      });
      if (discount) {
        if (discount.discount_type === "PERCENT") {
          discountAmount = (amount * discount.discount_value) / 100;
        } else {
          discountAmount = discount.discount_value;
        }
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);
    const orderNumber = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    if (finalAmount === 0) {
      if (courseId) {
        await prisma.enrollments.upsert({
          where: {
            user_id_course_id: {
              user_id: user.id,
              course_id: BigInt(courseId),
            },
          },
          update: { status: "ACTIVE" },
          create: {
            user_id: user.id,
            course_id: BigInt(courseId),
            enrolled_at: new Date(),
            progress_percentage: 0,
            status: "ACTIVE",
          },
        });
      }

      return NextResponse.json({
        free: true,
        message: "Enrolled in course successfully!",
      });
    }

    const options = {
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: orderNumber,
      notes: {
        userId: user.id,
        itemType,
        itemId: (courseId || careerId).toString(),
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    await prisma.orders.create({
      data: {
        order_number: orderNumber,
        user_id: user.id,
        course_id: courseId ? BigInt(courseId) : null,
        career_id: careerId ? BigInt(careerId) : null,
        payment_type: itemType,
        original_amount: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        coupon_code: couponCode || null,
        status: "PENDING",
        razorpay_order_id: rzpOrder.id,
        created_at: new Date(),
        email_sent: false,
      },
    });

    return NextResponse.json(serializeData({
      orderId: rzpOrder.id,
      amount: finalAmount,
      currency: "INR",
      orderNumber,
      keyId: process.env.RAZORPAY_KEY_ID || "",
      name: user.name,
      email: user.email,
      phone: user.phone || "9999999999",
      courseTitle: title,
    }));
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create payment order" }, { status: 500 });
  }
}
