import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
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

    const pending = await prisma.pending_registrations.findUnique({
      where: { email: cleanEmail },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending registration found for this email. Please sign up again." },
        { status: 400 }
      );
    }

    // Expiration check
    if (new Date() > new Date(pending.otp_expires_at)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Attempts limit (max 5)
    if (pending.otp_attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // OTP verification
    const inputHash = hashOtp(cleanOtp);
    if (inputHash !== pending.otp_hash) {
      await prisma.pending_registrations.update({
        where: { email: cleanEmail },
        data: { otp_attempts: { increment: 1 } },
      });

      const remaining = 5 - (pending.otp_attempts + 1);
      return NextResponse.json(
        {
          error: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new OTP."}`,
        },
        { status: 400 }
      );
    }

    // Create active, verified user
    const userId = crypto.randomUUID();
    const user = await prisma.users.create({
      data: {
        id: userId,
        name: pending.name,
        email: pending.email,
        password_hash: pending.password_hash,
        role: pending.role || "STUDENT",
        provider: "LOCAL",
        active: true,
        email_verified: true,
        welcome_email_sent: true,
        created_at: new Date(),
      },
    });

    // Mark audit trail OTPs as used
    await prisma.otp_verifications.updateMany({
      where: { email: cleanEmail, purpose: "SIGNUP", used: false },
      data: { used: true },
    });

    // Clean up pending registration
    await prisma.pending_registrations.delete({
      where: { email: cleanEmail },
    });

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account verified successfully! Welcome to InGage LMS.",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    response.cookies.set("AUTH_TOKEN", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Verify signup OTP error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
