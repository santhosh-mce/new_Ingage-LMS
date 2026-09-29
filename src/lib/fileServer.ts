import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextResponse } from "next/server";

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
};

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

/**
 * Searches possible upload storage roots for the requested relative path.
 */
export function resolveUploadFile(relativePath: string): string | null {
  // Strip any leading slashes or context prefix
  const cleanPath = relativePath.replace(/^\/?(api\/)?(uploads\/)?/, "").replace(/\\/g, "/");

  // Prevent directory traversal
  if (cleanPath.includes("..")) {
    return null;
  }

  const searchRoots = [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "public", "uploads"),
  ];

  if (process.env.NODE_ENV !== "production") {
    const devBackend = path.resolve(process.cwd(), "..", "Backend", "uploads");
    if (fs.existsSync(devBackend)) {
      searchRoots.push(devBackend);
    }
  }

  for (const root of searchRoots) {
    const candidate = path.join(root, cleanPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // Fallback specifically for video requests: if any video is requested, try video.mp4 in uploads
  if (cleanPath.startsWith("videos/") || cleanPath.endsWith(".mp4")) {
    for (const root of searchRoots) {
      const defaultVideo = path.join(root, "videos", "video.mp4");
      if (fs.existsSync(defaultVideo) && fs.statSync(defaultVideo).isFile()) {
        return defaultVideo;
      }
    }
  }

  return null;
}

/**
 * Serves a local file with full HTTP Range (206) support for smooth video/audio streaming.
 */
export function serveFileWithRange(filePath: string, req: Request): Response {
  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const contentType = getMimeType(filePath);
    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      // Parse Range header e.g. "bytes=0-1048576"
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Handle invalid ranges safely
      if (isNaN(start) || start >= fileSize) {
        return new Response(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      if (end >= fileSize) {
        end = fileSize - 1;
      }

      const chunkSize = end - start + 1;
      const nodeStream = fs.createReadStream(filePath, { start, end });
      const webStream = (Readable as any).toWeb(nodeStream);

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      // Full file response
      const nodeStream = fs.createReadStream(filePath);
      const webStream = (Readable as any).toWeb(nodeStream);

      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Length": String(fileSize),
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch (error: any) {
    console.error("Error serving file:", filePath, error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
