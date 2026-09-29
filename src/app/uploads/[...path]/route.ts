export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { resolveUploadFile, serveFileWithRange } from "@/lib/fileServer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const subpath = (resolvedParams.path || []).join("/");
    const filePath = resolveUploadFile(subpath);

    if (!filePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return serveFileWithRange(filePath, req);
  } catch (error: any) {
    console.error("Uploads serve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
