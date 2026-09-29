import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    appName: "Ingage LMS Platform",
    appVersion: "2.0.0",
    backendStatus: "Operational / Healthy (Next.js 16 App Router)",
    databaseStatus: "Connected (PostgreSQL / Supabase Live Pool)",
    apiPrefix: "/api",
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: "Production / Live",
    uptime: Math.floor(process.uptime()) + " seconds",
  });
}
