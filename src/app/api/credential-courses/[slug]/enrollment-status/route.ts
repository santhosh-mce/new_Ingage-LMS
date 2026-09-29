import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ enrolled: false, progressPercentage: 0, status: "NOT_ENROLLED" });
  }
  return NextResponse.json({
    enrolled: false,
    progressPercentage: 0,
    status: "NOT_ENROLLED",
    completedModulesCount: 0,
  });
}
