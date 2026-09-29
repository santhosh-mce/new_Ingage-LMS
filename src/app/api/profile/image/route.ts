import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get("image") || formData.get("file")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
    }

    // Determine extension
    let ext = ".jpg";
    if (file.type === "image/png") ext = ".png";
    else if (file.type === "image/webp") ext = ".webp";
    else if (file.type === "image/gif") ext = ".gif";
    else if (file.name && file.name.includes(".")) {
      ext = path.extname(file.name).toLowerCase() || ".jpg";
    }

    const filename = `user-${sessionUser.id}-${Date.now()}${ext}`;

    // Ensure uploads directory exists
    const uploadsBase = path.join(process.cwd(), "uploads", "profile-images");
    fs.mkdirSync(uploadsBase, { recursive: true });

    const filePath = path.join(uploadsBase, filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Also mirror to Backend/uploads if directory exists
    try {
      const backendBase = "D:/Ingage project/Backend/uploads/profile-images";
      if (fs.existsSync(backendBase)) {
        fs.writeFileSync(path.join(backendBase, filename), buffer);
      }
    } catch {}

    const relativeUrl = `/uploads/profile-images/${filename}`;

    // Update database
    const updatedUser = await prisma.users.update({
      where: { id: sessionUser.id },
      data: {
        profile_image: relativeUrl,
      },
    });

    const safeUser = serializeData(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Profile photo updated successfully",
      profileImage: relativeUrl,
      avatarUrl: relativeUrl,
      user: {
        ...safeUser,
        profileImage: relativeUrl,
        avatarUrl: relativeUrl,
      },
    });
  } catch (error: any) {
    console.error("Profile image upload error:", error);
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: sessionUser.id },
      data: {
        profile_image: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo removed successfully",
      user: serializeData(updatedUser),
    });
  } catch (error: any) {
    console.error("Profile image delete error:", error);
    return NextResponse.json({ error: "Failed to remove profile photo" }, { status: 500 });
  }
}
