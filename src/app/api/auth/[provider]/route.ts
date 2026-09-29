import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const prov = provider.toLowerCase();

  if (prov === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID || "841471755318-q0r5f0r054850kg1fkfcfiubju7f0spi.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback/google`);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
    return NextResponse.redirect(googleAuthUrl);
  }

  if (prov === "linkedin") {
    const clientId = process.env.LINKEDIN_CLIENT_ID || "86shlxnjkufoi7";
    const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback/linkedin`);
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email`;
    return NextResponse.redirect(linkedinAuthUrl);
  }

  return NextResponse.json({ error: "Unsupported OAuth provider" }, { status: 400 });
}
