import nodemailer from "nodemailer";
import crypto from "crypto";

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
  userName?: string;
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Uses Node's crypto.randomInt (never Math.random).
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Cryptographically hash an OTP string using SHA-256 before storing.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Create a reusable Nodemailer transporter from environment variables.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || "";
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an OTP verification email using SMTP with professional HTML design.
 */
export async function sendOtpEmail({
  to,
  otp,
  purpose,
  userName,
}: SendOtpEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const isSignup = purpose === "SIGNUP";
  const subject = isSignup
    ? "Verify your InGage LMS account"
    : "Reset your InGage LMS password";

  const actionTitle = isSignup ? "Verify Your Email Address" : "Password Reset Request";
  const actionDescription = isSignup
    ? `Thank you for signing up with InGage LMS${userName ? `, ${userName}` : ""}. Please use the following One-Time Password (OTP) to activate and verify your learning account:`
    : `We received a request to reset the password for your InGage LMS account${userName ? `, ${userName}` : ""}. Please use the following One-Time Password (OTP) to proceed:`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #059669; padding: 28px 32px; text-align: center; }
    .brand { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; display: inline-flex; align-items: center; gap: 8px; }
    .tagline { color: #d1fae5; font-size: 13px; margin-top: 4px; font-weight: 500; }
    .content { padding: 36px 32px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
    .otp-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #065f46; margin: 0; padding-left: 10px; }
    .expiry { font-size: 12px; color: #047857; margin-top: 8px; font-weight: 600; }
    .warning { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.5; color: #92400e; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">🎓 InGage LMS</h1>
      <div class="tagline">Next-Generation Learning Platform</div>
    </div>
    <div class="content">
      <h2 class="title">${actionTitle}</h2>
      <p class="text">${actionDescription}</p>
      
      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">⏱️ Valid for 5 minutes only</div>
      </div>
      
      <div class="warning">
        <strong>🔒 Security Notice:</strong> Never share this OTP with anyone. InGage LMS staff will never ask for your verification code or password. If you did not initiate this request, you can safely ignore this email.
      </div>
      
      <p class="text" style="font-size: 12px; color: #64748b; margin-bottom: 0;">
        Need help? Contact support or reply to this message.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} InGage LMS. All rights reserved.<br>
      This is an automated system notification.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
InGage LMS - ${actionTitle}

${actionDescription}

Your OTP: ${otp}
Valid for: 5 minutes

Security Warning: Never share this OTP with anyone. InGage LMS staff will never ask for your code.
If you did not request this, please disregard this email.
`;

  const transporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || `"InGage LMS" <noreply@ingagelms.com>`;

  if (!transporter) {
    console.log(`[SMTP DEV MODE] Email dispatch to ${to} for ${purpose} | OTP: [PROTECTED 6-DIGIT]`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed sending to ${to}:`, err?.message || err);
    throw new Error("Unable to send verification email. Please check your SMTP configuration.");
  }
}
