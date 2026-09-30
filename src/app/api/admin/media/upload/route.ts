import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_VIDEO_EXT = [".mp4", ".webm", ".mov", ".mkv", ".ogv"];
const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const ALLOWED_DOC_EXT = [".pdf", ".txt", ".docx", ".zip"];

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = ((formData.get("category") as string) || "video").toLowerCase();

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = file.name || "upload";
    const ext = path.extname(originalName).toLowerCase() || (category === "video" ? ".mp4" : ".png");

    if (category === "video" && !ALLOWED_VIDEO_EXT.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported video format. Allowed: MP4, WebM, MOV, OGV" },
        { status: 400 }
      );
    }

    if (category === "thumbnail" && !ALLOWED_IMAGE_EXT.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported image format. Allowed: JPG, PNG, WEBP, SVG" },
        { status: 400 }
      );
    }

    const subfolder = category === "video" ? "videos" : category === "thumbnail" ? "thumbnails" : "documents";
    const cleanBaseName = path.basename(originalName, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const filename = `${cleanBaseName || "media"}-${Date.now()}${ext}`;

    const targetDir = path.join(process.cwd(), "uploads", subfolder);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetPath, buffer);

    // Also mirror to public/uploads
    try {
      const publicDir = path.join(process.cwd(), "public", "uploads", subfolder);
      fs.mkdirSync(publicDir, { recursive: true });
      fs.writeFileSync(path.join(publicDir, filename), buffer);
    } catch {}

    const relativeUrl = `/uploads/${subfolder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      contentUrl: relativeUrl,
      filename,
      size: file.size,
      message: "Media uploaded successfully",
    });
  } catch (error: any) {
    console.error("Media upload error:", error);
    return NextResponse.json({ error: "Failed to upload media file" }, { status: 500 });
  }
}
