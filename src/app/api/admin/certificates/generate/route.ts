import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { issueCourseCertificate } from "@/lib/certificateService";
import { serializeData } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ error: "userId and courseId are required" }, { status: 400 });
    }

    const cert = await issueCourseCertificate(userId, courseId, user.name || "Administrator");

    return NextResponse.json(
      serializeData({
        success: true,
        message: "Certificate generated successfully by Admin",
        certificate: cert,
      })
    );
  } catch (error: any) {
    console.error("Admin manual issue certificate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
