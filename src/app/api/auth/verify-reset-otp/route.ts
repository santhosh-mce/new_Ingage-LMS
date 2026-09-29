import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json({ error: "A valid 6-digit OTP code is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const record = await prisma.otp_verifications.findFirst({
      where: { email: cleanEmail, purpose: "PASSWORD_RESET", used: false },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No active password reset request found. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (record.attempt_count >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    const inputHash = hashOtp(cleanOtp);
    if (inputHash !== record.otp_hash) {
      await prisma.otp_verifications.update({
        where: { id: record.id },
        data: { attempt_count: { increment: 1 } },
      });

      const remaining = 5 - (record.attempt_count + 1);
      return NextResponse.json(
        {
          error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new OTP."}`,
        },
        { status: 400 }
      );
    }

    // Mark OTP used
    await prisma.otp_verifications.update({
      where: { id: record.id },
      data: { used: true },
    });

    // Create reset token for the user
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    // Invalidate old tokens for this user
    await prisma.password_reset_tokens.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // Create new single-use token (valid for 15 mins)
    await prisma.password_reset_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. You can now set your new password.",
      resetToken,
    });
  } catch (error: any) {
    console.error("Verify forgot password OTP error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
