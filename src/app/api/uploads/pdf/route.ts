import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden: Admin or Instructor access required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (ext !== ".pdf" && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF documents are allowed (.pdf)" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds limit of 100MB" }, { status: 400 });
    }

    const randomHex = crypto.randomBytes(4).toString("hex");
    const fileName = `pdf_${Date.now()}_${randomHex}.pdf`;

    const primaryDir = path.join(process.cwd(), "uploads", "pdf");
    const publicDir = path.join(process.cwd(), "public", "uploads", "pdf");
    const docsDir = path.join(process.cwd(), "uploads", "documents");
    const publicDocsDir = path.join(process.cwd(), "public", "uploads", "documents");

    [primaryDir, publicDir, docsDir, publicDocsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(path.join(primaryDir, fileName), buffer);
    fs.writeFileSync(path.join(publicDir, fileName), buffer);
    fs.writeFileSync(path.join(docsDir, fileName), buffer);
    fs.writeFileSync(path.join(publicDocsDir, fileName), buffer);

    const pdfUrl = `/uploads/pdf/${fileName}`;

    return NextResponse.json({
      success: true,
      url: pdfUrl,
      pdfFilePath: pdfUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: "application/pdf",
    });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload PDF" }, { status: 500 });
  }
}
