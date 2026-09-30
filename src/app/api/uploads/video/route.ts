import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".mkv"]);
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin or Instructor access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId")?.toString() || "course";
    const lessonId = formData.get("lessonId")?.toString() || "lesson";

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const isVideoMime = file.type.startsWith("video/") || ALLOWED_EXTENSIONS.has(ext);

    if (!isVideoMime || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "Unsupported video format. Allowed formats: MP4, WebM, MOV, MKV" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Video file size exceeds maximum limit of 500MB" },
        { status: 400 }
      );
    }

    // Generate safe sanitized filename: course_{id}_lesson_{id}_{timestamp}_{random}.ext
    const randomHex = crypto.randomBytes(4).toString("hex");
    const sanitizedCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, "");
    const sanitizedLesson = lessonId.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `video_${sanitizedCourse}_${sanitizedLesson}_${Date.now()}_${randomHex}${ext}`;

    // Target upload directories
    const primaryDir = path.join(process.cwd(), "uploads", "video");
    const publicDir = path.join(process.cwd(), "public", "uploads", "video");
    const legacyVideosDir = path.join(process.cwd(), "uploads", "videos");
    const publicLegacyVideosDir = path.join(process.cwd(), "public", "uploads", "videos");

    [primaryDir, publicDir, legacyVideosDir, publicLegacyVideosDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(path.join(primaryDir, fileName), buffer);
    fs.writeFileSync(path.join(publicDir, fileName), buffer);
    fs.writeFileSync(path.join(legacyVideosDir, fileName), buffer);
    fs.writeFileSync(path.join(publicLegacyVideosDir, fileName), buffer);

    const videoUrl = `/uploads/video/${fileName}`;

    return NextResponse.json({
      success: true,
      url: videoUrl,
      videoFilePath: videoUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type || "video/mp4",
    });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload video" }, { status: 500 });
  }
}
