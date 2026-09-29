import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    for (const [key, val] of Object.entries(body)) {
      await prisma.platform_settings.upsert({
        where: { setting_key: key },
        create: {
          category: "GENERAL",
          setting_key: key,
          setting_value: String(val),
          updated_at: new Date(),
          updated_by: user?.email || "admin@ingage.com",
        },
        update: {
          setting_value: String(val),
          updated_at: new Date(),
          updated_by: user?.email || "admin@ingage.com",
        },
      });
    }

    return NextResponse.json({ success: true, message: "General settings updated" });
  } catch (error: any) {
    console.error("Save general settings error:", error);
    return NextResponse.json({ error: "Failed to update general settings" }, { status: 500 });
  }
}
