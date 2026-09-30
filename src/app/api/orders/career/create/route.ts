import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { careerId, couponCode } = body;

    if (!careerId) {
      return NextResponse.json({ error: "careerId is required" }, { status: 400 });
    }

    const career = await prisma.careers.findUnique({
      where: { id: BigInt(careerId) },
    });

    if (!career) {
      return NextResponse.json({ error: "Career not found" }, { status: 404 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.career_enrollments.findFirst({
      where: {
        user_id: String(authUser.userId),
        career_id: career.id,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          alreadyEnrolled: true,
          enrolled: true,
          error: "You are already enrolled in this Career Path",
          message: "You are already enrolled in this Career Path",
        },
        { status: 400 }
      );
    }

    let amount = career.price != null ? Number(career.price) : 14999;
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
    const orderNumber = "ORD-CAR-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    // Free Career Path flow
    if (finalAmount === 0) {
      await prisma.career_enrollments.upsert({
        where: {
          user_id_career_id: {
            user_id: String(authUser.userId),
            career_id: career.id,
          },
        },
        update: { status: "ACTIVE" },
        create: {
          user_id: String(authUser.userId),
          career_id: career.id,
          enrolled_at: new Date(),
          progress_percentage: 0,
          status: "ACTIVE",
        },
      });

      const careerCourses = await prisma.career_courses.findMany({
        where: { career_id: career.id },
      });

      for (const cc of careerCourses) {
        await prisma.enrollments.upsert({
          where: {
            user_id_course_id: {
              user_id: String(authUser.userId),
              course_id: cc.course_id,
            },
          },
          update: { status: "ACTIVE" },
          create: {
            user_id: String(authUser.userId),
            course_id: cc.course_id,
            enrolled_at: new Date(),
            progress_percentage: 0,
            status: "ACTIVE",
          },
        });
      }

      return NextResponse.json({
        orderId: Number(career.id),
        orderNumber,
        amount: 0,
        amountInPaise: 0,
        currency: "INR",
        itemType: "CAREER_PATH",
        careerId: Number(career.id),
        careerTitle: career.title,
        free: true,
        message: "Enrolled in Career Path successfully!",
      });
    }

    // Paid Career Path flow - create Razorpay order
    let rzpOrderId = "";
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || "",
        key_secret: process.env.RAZORPAY_KEY_SECRET || "",
      });

      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100),
        currency: "INR",
        receipt: orderNumber,
        notes: {
          userId: String(authUser.userId),
          careerId: career.id.toString(),
          itemType: "CAREER_PATH",
        },
      });
      rzpOrderId = rzpOrder.id;
    } catch (rzpErr: any) {
      console.warn("Razorpay API order creation warning, using fallback ID:", rzpErr?.message);
      rzpOrderId = "order_rzp_" + Date.now();
    }

    await prisma.orders.create({
      data: {
        order_number: orderNumber,
        user_id: String(authUser.userId),
        career_id: career.id,
        payment_type: "CAREER_PATH",
        original_amount: Number(career.original_price || career.price || finalAmount),
        discount_amount: discountAmount,
        final_amount: finalAmount,
        coupon_code: couponCode || null,
        status: "PENDING",
        razorpay_order_id: rzpOrderId,
        created_at: new Date(),
        email_sent: false,
      },
    });

    return NextResponse.json({
      orderId: Number(career.id),
      orderNumber,
      razorpayOrderId: rzpOrderId,
      amount: finalAmount,
      amountInPaise: Math.round(finalAmount * 100),
      currency: "INR",
      itemType: "CAREER_PATH",
      careerId: Number(career.id),
      careerTitle: career.title,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TccoJ6A0ra1dCg",
      free: false,
      message: "Order created successfully",
    });
  } catch (err: any) {
    console.error("Career order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
