import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("AUTH_TOKEN")?.value;

  let userRole = "";
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        userRole = (payload.role || "").toUpperCase().trim();
      }
    } catch {}
  }

  const isAdmin = userRole === "ADMIN" || userRole === "ROLE_ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ADMINISTRATOR";

  // 1. Direct Checkout / Payment route protection:
  // If an ADMIN directly navigates to a checkout or purchase URL, redirect them to /admin
  const isCheckoutRoute =
    pathname.startsWith("/checkout") ||
    pathname.includes("/checkout") ||
    pathname === "/payment" ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/courses/checkout");

  if (isAdmin && isCheckoutRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. Admin routes protection:
  // If a non-admin student navigates to /admin, redirect them to homepage
  if (pathname.startsWith("/admin")) {
    if (token && !isAdmin) {
      return NextResponse.redirect(new URL("/?unauthorized=true", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/payment",
    "/pay/:path*",
  ],
};
