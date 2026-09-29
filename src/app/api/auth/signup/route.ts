import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { generateOtp, hashOtp, sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Cooldown check on pending registration
    const existingPending = await prisma.pending_registrations.findUnique({
      where: { email: cleanEmail },
    });

    if (existingPending && existingPending.last_resent_at) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingPending.last_resent_at).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        return NextResponse.json(
          { error: `Please wait ${60 - elapsedSeconds} seconds before requesting a new OTP` },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);
    const passwordHash = await hashPassword(password);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in pending_registrations
    await prisma.pending_registrations.upsert({
      where: { email: cleanEmail },
      create: {
        id: crypto.randomUUID(),
        email: cleanEmail,
        name: name.trim(),
        password_hash: passwordHash,
        role: "STUDENT",
        otp_hash: hashedOtp,
        otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_resent_at: new Date(),
        created_at: new Date(),
      },
      update: {
        name: name.trim(),
        password_hash: passwordHash,
        otp_hash: hashedOtp,
        otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_resent_at: new Date(),
      },
    });

    // Also record in otp_verifications for audit trail
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

    // Send OTP via SMTP
    try {
      await sendOtpEmail({
        to: cleanEmail,
        otp,
        purpose: "SIGNUP",
        userName: name.trim(),
      });
    } catch (mailErr) {
      console.error("Mail send error:", mailErr);
      return NextResponse.json(
        { error: "Unable to send verification email. Please verify SMTP settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification OTP sent to your email",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initiate signup" },
      { status: 500 }
    );
  }
}
