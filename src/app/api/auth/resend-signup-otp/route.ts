import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const pending = await prisma.pending_registrations.findUnique({
      where: { email: cleanEmail },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending registration found for this email. Please sign up again." },
        { status: 404 }
      );
    }

    // 60-second cooldown
    if (pending.last_resent_at) {
      const elapsed = Math.floor((Date.now() - new Date(pending.last_resent_at).getTime()) / 1000);
      if (elapsed < 60) {
        return NextResponse.json(
          { error: `Please wait ${60 - elapsed} seconds before requesting a new OTP` },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.pending_registrations.update({
      where: { email: cleanEmail },
      data: {
        otp_hash: hashedOtp,
        otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_resent_at: new Date(),
      },
    });

    await prisma.otp_verifications.create({
      data: {
        id: crypto.randomUUID(),
        email: cleanEmail,
        purpose: "SIGNUP",
        otp_hash: hashedOtp,
        expires_at: expiresAt,
        attempt_count: 0,
        last_resent_at: new Date(),
        used: false,
        created_at: new Date(),
      },
    });

    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: "SIGNUP",
      userName: pending.name,
    });

    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent to your email.",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Resend signup OTP error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
