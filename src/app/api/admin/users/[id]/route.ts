import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await prisma.users.findUnique({
      where: { id },
      include: {
        enrollments: {
          orderBy: { enrolled_at: "desc" },
          include: {
            courses: { select: { id: true, title: true } },
          },
        },
        certificates: {
          orderBy: { issued_at: "desc" },
        },
        payments: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const createdIso = targetUser.created_at ? targetUser.created_at.toISOString() : "";
    const lastLoginIso = targetUser.last_login ? targetUser.last_login.toISOString() : null;

    const profile = {
      id: targetUser.id,
      name: targetUser.name || "Learner",
      email: targetUser.email,
      phone: targetUser.phone || "",
      role: targetUser.role || "LEARNER",
      active: targetUser.active ?? true,
      status: targetUser.active !== false ? "ACTIVE" : "INACTIVE",
      emailVerified: targetUser.email_verified ?? true,
      profileImage: targetUser.profile_image || "",
      createdDate: createdIso,
      registrationDate: createdIso,
      createdAt: createdIso,
      lastLogin: lastLoginIso,
    };

    const enrollmentsList = (targetUser.enrollments || []).map((e: any) => ({
      enrollmentId: e.id.toString(),
      courseId: e.course_id ? e.course_id.toString() : "",
      courseTitle: e.courses?.title || "Course",
      status: e.status || "ACTIVE",
      progress: e.progress_percentage || 0,
      enrolledAt: e.enrolled_at ? e.enrolled_at.toISOString() : "",
      completedAt: e.completed_at ? e.completed_at.toISOString() : null,
      lastAccessedAt: e.last_accessed_at ? e.last_accessed_at.toISOString() : null,
    }));

    const certsList = (targetUser.certificates || []).map((c: any) => ({
      id: c.id.toString(),
      certificateNumber: c.certificate_number,
      verificationCode: c.verification_code,
      issuedAt: c.issued_at ? c.issued_at.toISOString() : "",
    }));

    const paymentsList = (targetUser.payments || []).map((p: any) => ({
      id: p.id.toString(),
      amount: p.final_amount ?? p.amount ?? 0,
      paymentStatus: p.payment_status || "SUCCESS",
      createdAt: p.created_at ? p.created_at.toISOString() : "",
      paymentMethod: p.payment_method || "RAZORPAY",
    }));

    const details = {
      profile,
      learning: {
        coursesEnrolled: enrollmentsList.length,
        coursesCompleted: enrollmentsList.filter((e) => e.status === "COMPLETED" || e.progress >= 100).length,
        enrollments: enrollmentsList,
      },
      certificates: certsList,
      payments: paymentsList,
    };

    return NextResponse.json(serializeData(details));
  } catch (error: any) {
    console.error("Admin user details error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.role !== undefined) data.role = body.role;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.emailVerified !== undefined) data.email_verified = Boolean(body.emailVerified);

    const updated = await prisma.users.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeData({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      active: updated.active,
    }));
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.users.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, message: "User deactivated successfully" });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to deactivate user" }, { status: 500 });
  }
}
