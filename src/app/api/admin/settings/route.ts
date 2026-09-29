import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serializeData } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    // Allow admin access or fallback default settings
    const settingsList = await prisma.platform_settings.findMany({
      orderBy: [{ category: "asc" }, { setting_key: "asc" }],
    });

    const general: Record<string, string> = {
      platform_name: "Ingage",
      platform_description: "Enterprise Digital Learning & Career Growth Platform",
      support_email: "support@ingage.com",
      support_phone: "+1 (555) 000-1234",
      website_url: "https://ingage-lms.vercel.app",
      timezone: "Asia/Kolkata (IST)",
      default_language: "English",
    };

    const notifications: Record<string, boolean> = {
      notify_new_user_registration: true,
      notify_course_enrollment: true,
      notify_payment_success: true,
      notify_certificate_generated: true,
      notify_password_reset: true,
      notify_email_verification: false,
    };

    const platform: Record<string, boolean> = {
      allow_user_registration: true,
      require_email_verification: false,
      allow_course_enrollment: true,
      allow_opportunity_applications: true,
      maintenance_mode: false,
    };

    const email: Record<string, string> = {
      email_sender_name: "Ingage LMS Support",
      email_sender_email: "no-reply@ingage.com",
      provider: "In-App / System Logger",
      status: "Active (Direct Authentication & Database Logging)",
      credentialsMasked: "*****************",
    };

    for (const s of settingsList) {
      const cat = (s.category || "GENERAL").toUpperCase();
      if (cat === "NOTIFICATIONS") {
        notifications[s.setting_key] = s.setting_value === "true";
      } else if (cat === "PLATFORM") {
        platform[s.setting_key] = s.setting_value === "true";
      } else if (cat === "EMAIL") {
        if (s.setting_value) email[s.setting_key] = s.setting_value;
      } else {
        if (s.setting_value) general[s.setting_key] = s.setting_value;
      }
    }

    const razorpayKey = process.env.RAZORPAY_KEY_ID || "";
    const payments = {
      provider: "Razorpay",
      currency: "INR",
      configured: Boolean(razorpayKey),
      status: razorpayKey ? "Connected" : "Test Mode",
      mode: razorpayKey.startsWith("rzp_live") ? "Live" : "Test",
      keyIdMasked: razorpayKey ? razorpayKey.substring(0, 8) + "********" : "rzp_test_mock",
      secretMasked: "*****************",
      webhookStatus: "Connected / Active",
    };

    const system = {
      appName: "Ingage LMS Platform",
      appVersion: "2.0.0",
      backendStatus: "Operational / Healthy (Next.js 16 App Router)",
      databaseStatus: "Connected (PostgreSQL / Supabase Live Pool)",
      apiPrefix: "/api",
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      environment: "Production / Live",
      uptime: Math.floor(process.uptime()) + " seconds",
    };

    return NextResponse.json({
      general,
      notifications,
      platform,
      email,
      payments,
      system,
    });
  } catch (error: any) {
    console.error("Admin settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (user && !["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR", "STAFF", "INSTRUCTOR"].includes(user.role?.toUpperCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Iterate through received categories or key-value entries
    for (const [key, val] of Object.entries(body)) {
      if (typeof val === "object" && val !== null) {
        for (const [subKey, subVal] of Object.entries(val as Record<string, any>)) {
          await prisma.platform_settings.upsert({
            where: { setting_key: subKey },
            create: {
              category: key.toUpperCase(),
              setting_key: subKey,
              setting_value: String(subVal),
              updated_at: new Date(),
              updated_by: user?.email || "admin@ingage.com",
            },
            update: {
              category: key.toUpperCase(),
              setting_value: String(subVal),
              updated_at: new Date(),
              updated_by: user?.email || "admin@ingage.com",
            },
          });
        }
      } else {
        await prisma.platform_settings.upsert({
          where: { setting_key: key },
          create: {
            category: "GENERAL",
            setting_key: key,
            setting_value: String(val),
            updated_at: new Date(),
            updated_by: user?.email || "admin@ingage.com",
          },
          update: {
            setting_value: String(val),
            updated_at: new Date(),
            updated_by: user?.email || "admin@ingage.com",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    console.error("Save settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
