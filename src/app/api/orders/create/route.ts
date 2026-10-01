import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { serializeData } from "@/lib/utils";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim(),
  key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim(),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to continue." }, { status: 401 });
    }

    // Role-based block: Administrators MUST NOT purchase courses
    if (isAdminRole(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrators cannot purchase courses.",
          message: "Administrators cannot purchase courses.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, careerId, couponCode } = body;

    let baseAmount = 0;
    let finalCalculatedPrice = 0;
    let title = "";
    let itemType = "COURSE";

    // --- 1. SINGLE SOURCE OF TRUTH: FETCH FROM DATABASE ONLY ---
    if (courseId) {
      const course = await prisma.courses.findUnique({
        where: { id: BigInt(courseId) },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found." }, { status: 404 });
      }

      // Check if user is already enrolled
      const existingEnrollment = await prisma.enrollments.findFirst({
        where: {
          user_id: user.id,
          course_id: BigInt(courseId),
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
      });

      if (existingEnrollment) {
        return NextResponse.json({
          alreadyEnrolled: true,
          error: "You are already enrolled in this course.",
          message: "You are already enrolled in this course.",
        }, { status: 400 });
      }

      baseAmount = Math.max(0, Number(course.price) || 0);
      finalCalculatedPrice = baseAmount;

      // Handle course-level discount
      if (course.discount_type && course.discount_value && course.discount_value > 0) {
        if (course.discount_type === "PERCENTAGE" || course.discount_type === "PERCENT") {
          const pct = Math.min(100, Math.max(0, Number(course.discount_value)));
          finalCalculatedPrice = Math.max(0, Math.round((baseAmount - (baseAmount * pct) / 100) * 100) / 100);
        } else if (course.discount_type === "FLAT" || course.discount_type === "FIXED_AMOUNT") {
          const flat = Math.max(0, Number(course.discount_value));
          finalCalculatedPrice = Math.max(0, baseAmount - flat);
        }
      } else if (course.final_price !== null && course.final_price !== undefined) {
        const fp = Number(course.final_price);
        if (!isNaN(fp) && fp >= 0 && fp <= baseAmount) {
          finalCalculatedPrice = fp;
        }
      }

      title = course.title;
      itemType = "COURSE";
    } else if (careerId) {
      const career = await prisma.careers.findUnique({
        where: { id: BigInt(careerId) },
      });

      if (!career) {
        return NextResponse.json({ error: "Career path not found." }, { status: 404 });
      }

      baseAmount = career.original_price != null ? Number(career.original_price) : (career.price != null ? Number(career.price) : 14999);
      finalCalculatedPrice = career.price != null ? Number(career.price) : baseAmount;
      title = career.title;
      itemType = "CAREER_PATH";
    } else {
      return NextResponse.json({ error: "courseId or careerId is required." }, { status: 400 });
    }

    // --- 2. HANDLE COUPON DISCOUNT ON THE CALCULATED PRICE ---
    let couponDiscountAmount = 0;
    if (couponCode) {
      const discount = await prisma.discounts.findFirst({
        where: { coupon_code: couponCode.toUpperCase().trim(), active: true },
      });
      if (discount) {
        if (discount.discount_type === "PERCENT" || discount.discount_type === "PERCENTAGE") {
          const val = Math.min(100, Math.max(0, Number(discount.discount_value)));
          couponDiscountAmount = Math.round(((finalCalculatedPrice * val) / 100) * 100) / 100;
        } else {
          couponDiscountAmount = Math.max(0, Number(discount.discount_value));
        }
      }
    }

    const finalPayableRupees = Math.max(0, Math.round((finalCalculatedPrice - couponDiscountAmount) * 100) / 100);
    const totalDiscountAmount = Math.max(0, Math.round((baseAmount - finalPayableRupees) * 100) / 100);
    const orderNumber = "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

    // --- 3. FREE COURSE ENROLLMENT (0 RUPEES) ---
    if (finalPayableRupees === 0) {
      if (courseId) {
        await prisma.enrollments.upsert({
          where: {
            user_id_course_id: {
              user_id: user.id,
              course_id: BigInt(courseId),
            },
          },
          update: { status: "ACTIVE", last_accessed_at: new Date() },
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
        orderNumber,
        amount: 0,
        amountInPaise: 0,
        currency: "INR",
        message: "Enrolled in course successfully!",
      });
    }

    // --- 4. EXACT RUPEES TO PAISE CONVERSION (1 RUPEE = 100 PAISE) ---
    const amountInPaise = Math.round(finalPayableRupees * 100);
    let rzpOrderId = "";

    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderNumber,
        notes: {
          userId: user.id,
          itemType,
          itemId: (courseId || careerId).toString(),
        },
      });
      rzpOrderId = rzpOrder.id;
    } catch (rzpErr: any) {
      console.warn("Razorpay API order creation warning, using fallback ID:", rzpErr?.message);
      rzpOrderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    }

    // --- 5. PERSIST PENDING ORDER IN DATABASE ---
    const createdOrder = await prisma.orders.create({
      data: {
        order_number: orderNumber,
        user_id: user.id,
        course_id: courseId ? BigInt(courseId) : null,
        career_id: careerId ? BigInt(careerId) : null,
        payment_type: itemType,
        original_amount: baseAmount,
        discount_amount: totalDiscountAmount,
        final_amount: finalPayableRupees,
        coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
        status: "PENDING",
        razorpay_order_id: rzpOrderId,
        created_at: new Date(),
        email_sent: false,
      },
    });

    const activeKeyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TccoJ6A0ra1dCg").trim();

    return NextResponse.json(serializeData({
      orderId: Number(createdOrder.id),
      orderNumber,
      razorpayOrderId: rzpOrderId,
      amount: finalPayableRupees,
      amountInPaise,
      currency: "INR",
      keyId: activeKeyId,
      name: user.name,
      email: user.email,
      phone: user.phone || "9999999999",
      courseTitle: title,
      courseId: courseId ? Number(courseId) : undefined,
      careerId: careerId ? Number(careerId) : undefined,
      free: false,
    }));
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create payment order" }, { status: 500 });
  }
}
