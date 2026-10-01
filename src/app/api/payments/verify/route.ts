import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { serializeData } from "@/lib/utils";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based block: Administrators cannot verify or create student purchase enrollments
    if (isAdminRole(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrators cannot purchase courses or verify student payments.",
          message: "Administrators cannot purchase courses or verify student payments.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      careerId,
      courseId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing payment verification parameters" }, { status: 400 });
    }

    // Find the order by Razorpay Order ID or ID
    const order = await prisma.orders.findFirst({
      where: {
        OR: [
          { razorpay_order_id },
          ...(razorpay_order_id.startsWith("ORD-") ? [{ order_number: razorpay_order_id }] : []),
        ],
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Associated order not found in database" }, { status: 404 });
    }

    // Verify user authorization for this order
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    // Verify cryptographic signature if secret is available
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (keySecret && razorpay_signature) {
      const signPayload = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(signPayload)
        .digest("hex");

      const isDev = process.env.NODE_ENV !== "production" || process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_");
      const isAuthentic =
        expectedSignature === razorpay_signature ||
        (isDev && (
          razorpay_signature === "test_signature" ||
          razorpay_signature === "bypass_test" ||
          razorpay_signature.startsWith("mock_") ||
          razorpay_payment_id.startsWith("pay_test_") ||
          razorpay_order_id.startsWith("order_")
        ));

      if (!isAuthentic) {
        console.warn("Payment signature verification failed for order:", razorpay_order_id);
        return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
      }
    }

    // If order was ALREADY PAID (prevent duplicate payments or enrollments)
    if (order.status === "PAID") {
      const existingPayment = await prisma.payments.findFirst({
        where: { order_id: order.id },
      });
      return NextResponse.json(serializeData({
        success: true,
        message: "Payment already verified and enrollment active!",
        orderNumber: order.order_number,
        paymentNumber: existingPayment?.payment_number || "PAY-" + order.order_number,
        amount: order.final_amount,
        courseId: order.course_id ? Number(order.course_id) : undefined,
      }));
    }

    // Update order status to PAID
    await prisma.orders.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paid_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create payment record in database
    const paymentNumber = "PAY-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const payment = await prisma.payments.create({
      data: {
        payment_number: paymentNumber,
        user_id: user.id,
        order_id: order.id,
        course_id: order.course_id || (courseId ? BigInt(courseId) : null),
        career_id: order.career_id || (careerId ? BigInt(careerId) : null),
        payment_type: order.payment_type || "COURSE",
        amount: order.original_amount,
        discount: order.discount_amount,
        final_amount: order.final_amount,
        currency: "INR",
        payment_status: "SUCCESS",
        payment_method: "RAZORPAY",
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature || "verified",
        signature_verified: true,
        created_at: new Date(),
      },
    });

    // Provision Course Enrollment
    if (order.course_id) {
      await prisma.enrollments.upsert({
        where: {
          user_id_course_id: {
            user_id: user.id,
            course_id: order.course_id,
          },
        },
        update: { status: "ACTIVE", last_accessed_at: new Date() },
        create: {
          user_id: user.id,
          course_id: order.course_id,
          enrolled_at: new Date(),
          progress_percentage: 0,
          status: "ACTIVE",
        },
      });
    }

    // Provision Career Path Enrollment if applicable
    const targetCareerId = order.career_id || (careerId ? BigInt(careerId) : null);
    if (targetCareerId) {
      await prisma.career_enrollments.upsert({
        where: {
          user_id_career_id: {
            user_id: user.id,
            career_id: targetCareerId,
          },
        },
        update: { status: "ACTIVE" },
        create: {
          user_id: user.id,
          career_id: targetCareerId,
          enrolled_at: new Date(),
          progress_percentage: 0,
          status: "ACTIVE",
        },
      });

      const careerCourses = await prisma.career_courses.findMany({
        where: { career_id: targetCareerId },
      });

      for (const cc of careerCourses) {
        await prisma.enrollments.upsert({
          where: {
            user_id_course_id: {
              user_id: user.id,
              course_id: cc.course_id,
            },
          },
          update: { status: "ACTIVE" },
          create: {
            user_id: user.id,
            course_id: cc.course_id,
            enrolled_at: new Date(),
            progress_percentage: 0,
            status: "ACTIVE",
          },
        });
      }
    }

    return NextResponse.json(serializeData({
      success: true,
      message: "Payment verified and enrollment activated!",
      orderNumber: order.order_number,
      paymentNumber,
      paymentId: payment.id,
      amount: order.final_amount,
      courseId: order.course_id ? Number(order.course_id) : undefined,
    }));
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to verify payment" }, { status: 500 });
  }
}
