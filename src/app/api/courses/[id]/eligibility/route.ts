import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { calculateCourseEligibility } from "@/lib/certificateService";
import { serializeData } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const courseIdentifier = resolvedParams.id;

    const eligibility = await calculateCourseEligibility(user.id, courseIdentifier);

    return NextResponse.json(serializeData(eligibility));
  } catch (error: any) {
    console.error("Course eligibility error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to calculate course eligibility" },
      { status: 500 }
    );
  }
}
