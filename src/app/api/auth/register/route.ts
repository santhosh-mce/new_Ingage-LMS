import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
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

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user directly without OTP
    const user = await prisma.users.create({
      data: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: "STUDENT",
        provider: "LOCAL",
        active: true,
        email_verified: true, // No OTP verification required
        welcome_email_sent: false,
        created_at: new Date(),
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
