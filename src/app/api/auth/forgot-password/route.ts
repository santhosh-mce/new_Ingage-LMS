import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Don't reveal account existence
      return NextResponse.json({
        success: true,
        message: "If an account exists, password has been updated",
      });
    }

    if (newPassword) {
      const passwordHash = await hashPassword(newPassword);
      await prisma.users.update({
        where: { id: user.id },
        data: { password_hash: passwordHash },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
