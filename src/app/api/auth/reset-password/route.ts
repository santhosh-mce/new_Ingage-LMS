import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword, confirmPassword } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!resetToken || !resetToken.trim()) {
      return NextResponse.json({ error: "Reset authorization token is required" }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify token
    const tokenRecord = await prisma.password_reset_tokens.findFirst({
      where: { token: resetToken.trim(), used: false },
      include: { users: true },
    });

    if (!tokenRecord || !tokenRecord.users || tokenRecord.users.email !== cleanEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset session. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(tokenRecord.expires_at)) {
      return NextResponse.json(
        { error: "Reset session has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Hash new password using existing bcrypt implementation
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.users.update({
      where: { id: tokenRecord.user_id },
      data: {
        password_hash: passwordHash,
      },
    });

    // Invalidate reset token (single-use)
    await prisma.password_reset_tokens.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Invalidate any remaining OTPs
    await prisma.otp_verifications.updateMany({
      where: { email: cleanEmail, purpose: "PASSWORD_RESET", used: false },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
