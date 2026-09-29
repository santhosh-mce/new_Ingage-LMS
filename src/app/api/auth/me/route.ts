import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { password_hash, ...safeUser } = user;
    const serialized = serializeData(safeUser);

    return NextResponse.json({
      message: "Profile retrieved",
      userId: serialized.id,
      profileImage: serialized.profile_image,
      avatarUrl: serialized.profile_image,
      ...serialized,
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile" },
      { status: 500 }
    );
  }
}
