import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { issueCourseCertificate } from "@/lib/certificateService";
import { serializeData } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseIdentifier = resolvedParams.courseId;

    const cert = await issueCourseCertificate(user.id, courseIdentifier);

    return NextResponse.json(
      serializeData({
        success: true,
        message: "Certificate generated successfully!",
        certificate: cert,
      })
    );
  } catch (error: any) {
    console.error("Claim certificate error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to claim certificate" },
      { status: 400 }
    );
  }
}
