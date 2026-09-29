import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = BigInt(id);

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: {
        published: true,
        status: "PUBLISHED",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Course published successfully", course: serializeData(updated) });
  } catch (error: any) {
    console.error("Publish course error:", error);
    return NextResponse.json({ error: "Failed to publish course" }, { status: 500 });
  }
}
