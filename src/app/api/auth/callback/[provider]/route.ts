import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import axios from "axios";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/oauth/callback?error=${encodeURIComponent(error || "Authorization denied")}`);
  }

  const prov = provider.toLowerCase();

  try {
    let email = "";
    let name = "";
    let profileImage = "";
    let providerId = "";

    if (prov === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/callback/google`;

      // Exchange code for tokens
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", null, {
        params: {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        },
      });

      const accessToken = tokenRes.data.access_token;

      // Get user info
      const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      email = userInfoRes.data.email;
      name = userInfoRes.data.name || email.split("@")[0];
      profileImage = userInfoRes.data.picture || "";
      providerId = userInfoRes.data.sub;
    } else if (prov === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID || "";
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || "";
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${appUrl}/api/auth/callback/linkedin`;

      // Exchange code for tokens
      const tokenRes = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", null, {
        params: {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const accessToken = tokenRes.data.access_token;

      // Get user info
      const userInfoRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      email = userInfoRes.data.email;
      name = userInfoRes.data.name || `${userInfoRes.data.given_name || ""} ${userInfoRes.data.family_name || ""}`.trim() || email.split("@")[0];
      profileImage = userInfoRes.data.picture || "";
      providerId = userInfoRes.data.sub;
    } else {
      return NextResponse.redirect(`${appUrl}/oauth/callback?error=Unsupported_provider`);
    }

    if (!email) {
      return NextResponse.redirect(`${appUrl}/oauth/callback?error=No_email_provided_by_provider`);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Upsert user into database
    let user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email: cleanEmail,
          name: name || "Learner",
          role: "STUDENT",
          provider: prov.toUpperCase(),
          provider_id: providerId,
          profile_image: profileImage || null,
          email_verified: true,
          active: true,
          welcome_email_sent: false,
          created_at: new Date(),
        },
      });
    } else {
      // Update provider details if not set
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          provider_id: providerId || user.provider_id,
          profile_image: profileImage || user.profile_image,
          email_verified: true,
        },
      });
    }

    // Sign JWT Token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.redirect(`${appUrl}/oauth/callback?token=${encodeURIComponent(token)}`);

    // Also set HTTP-only cookie
    response.cookies.set("AUTH_TOKEN", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("OAuth callback exchange error:", err?.response?.data || err.message);
    const msg = err?.response?.data?.error_description || err?.response?.data?.error || err.message || "Failed to authenticate";
    return NextResponse.redirect(`${appUrl}/oauth/callback?error=${encodeURIComponent(msg)}`);
  }
}
