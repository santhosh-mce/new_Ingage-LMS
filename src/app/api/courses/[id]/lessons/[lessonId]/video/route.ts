import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUploadFile, serveFileWithRange } from "@/lib/fileServer";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { lessonId: rawLessonId } = await params;
    const lessonId = Number(rawLessonId);

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    const lesson = await prisma.course_lessons.findUnique({
      where: { id: BigInt(lessonId) },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // 1. Check if lesson content_url points to a local upload or video.mp4
    const contentUrl = lesson.content_url || "";

    if (contentUrl.includes("uploads/") || contentUrl.includes("video.mp4") || contentUrl.includes("localhost:8080")) {
      // Extract subpath from URL (e.g. videos/video.mp4)
      const subpath = contentUrl.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?(api\/)?(uploads\/)?/, "");
      const resolved = resolveUploadFile(subpath || "videos/video.mp4");
      if (resolved) {
        return serveFileWithRange(resolved, req);
      }
    }

    // 2. If video exists in uploads/videos/video.mp4, prioritize local uploads folder video!
    const defaultLocalVideo = resolveUploadFile("videos/video.mp4");
    if (defaultLocalVideo) {
      return serveFileWithRange(defaultLocalVideo, req);
    }

    // 3. Fallback to external content_url if present
    if (contentUrl.startsWith("http://") || contentUrl.startsWith("https://")) {
      return NextResponse.redirect(contentUrl, { status: 307 });
    }

    return NextResponse.json({ error: "No video stream available" }, { status: 404 });
  } catch (error: any) {
    console.error("Video stream route error:", error);
    // Safe fallback to uploads folder video if available
    const fallbackVideo = resolveUploadFile("videos/video.mp4");
    if (fallbackVideo) {
      return serveFileWithRange(fallbackVideo, req);
    }
    return NextResponse.json({ error: "Video stream unavailable" }, { status: 500 });
  }
}
