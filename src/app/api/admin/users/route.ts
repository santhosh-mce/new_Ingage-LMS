import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && user.role !== "ADMIN" && user.role !== "ROLE_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const usersList = await prisma.users.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        email_verified: true,
        created_at: true,
        last_login: true,
        profile_image: true,
      },
    });

    const mapped = usersList.map((u) => {
      const createdAtIso = u.created_at ? u.created_at.toISOString() : "";
      const lastLoginIso = u.last_login ? u.last_login.toISOString() : null;

      return {
        id: u.id,
        name: u.name || "Learner",
        email: u.email,
        phone: u.phone || "",
        role: u.role || "LEARNER",
        active: u.active ?? true,
        status: u.active !== false ? "ACTIVE" : "INACTIVE",
        emailVerified: u.email_verified ?? true,
        email_verified: u.email_verified ?? true,
        profileImage: u.profile_image || "",
        profile_image: u.profile_image || "",
        registrationDate: createdAtIso,
        createdAt: createdAtIso,
        created_at: createdAtIso,
        lastLogin: lastLoginIso,
        last_login: lastLoginIso,
      };
    });

    return NextResponse.json(serializeData(mapped));
  } catch (error: any) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
