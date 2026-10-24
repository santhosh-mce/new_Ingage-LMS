import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "qwertyuiopasdfghjklzxcvbnm1234567890";

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface DecodedToken {
  userId?: string;
  email?: string;
  role?: string;
  name?: string;
  exp?: number;
  [key: string]: any;
}

async function verifyEdgeJwt(token: string): Promise<DecodedToken | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify("HMAC", key, signature as unknown as BufferSource, data);
    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson);

    // Verify expiration timestamp if present
    if (payload.exp && typeof payload.exp === "number") {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSeconds) {
        return null; // Expired
      }
    }

    return payload;
  } catch {
    return null;
  }
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const t = authHeader.substring(7).trim();
    if (t) return t;
  }

  const cookieToken = request.cookies.get("AUTH_TOKEN")?.value;
  if (cookieToken && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}

function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const upper = role.toUpperCase().trim();
  return ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(upper);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static & public exceptions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/uploads") ||
    pathname === "/api/admin/media/upload" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Public certificate verification
  if (
    pathname.startsWith("/certificate/verify") ||
    pathname.startsWith("/certificates/verify") ||
    pathname.startsWith("/api/certificates/verify")
  ) {
    return NextResponse.next();
  }

  // Public authentication API endpoints
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/signup") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/login/oauth2") ||
    pathname.startsWith("/api/oauth2")
  ) {
    return NextResponse.next();
  }

  // Public catalog APIs
  if (
    pathname === "/api/explore" ||
    pathname === "/api/discounts/validate" ||
    (request.method === "GET" &&
      (pathname === "/api/courses" ||
        (pathname.startsWith("/api/courses/") &&
          !pathname.includes("/learn") &&
          !pathname.includes("/quiz") &&
          !pathname.includes("/project") &&
          !pathname.includes("/lessons") &&
          !pathname.includes("/access") &&
          !pathname.includes("/enrollment-status") &&
          !pathname.includes("/eligibility")) ||
        pathname === "/api/careers" ||
        pathname.startsWith("/api/careers/slug/") ||
        pathname === "/api/projects" ||
        pathname === "/api/opportunities"))
  ) {
    return NextResponse.next();
  }

  // Extract & verify token
  const token = extractToken(request);
  const payload = token ? await verifyEdgeJwt(token) : null;
  const isAuthenticated = !!payload;
  const userRole = (payload?.role || "").toUpperCase().trim();
  const isAdmin = isAuthenticated && isAdminRole(userRole);

  // -------------------------------------------------------------
  // 2. API ROUTES PROTECTION
  // -------------------------------------------------------------
  if (pathname.startsWith("/api/")) {
    // Admin API routes: requires valid token AND ADMIN role
    if (pathname.startsWith("/api/admin")) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Unauthorized: Please log in to continue" },
          { status: 401 }
        );
      }
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 }
        );
      }
      return NextResponse.next();
    }

    // Protected student/authenticated API routes
    const isProtectedApi =
      pathname.startsWith("/api/profile") ||
      pathname.startsWith("/api/progress") ||
      pathname.startsWith("/api/learning") ||
      pathname.startsWith("/api/enrollments") ||
      pathname.startsWith("/api/orders") ||
      pathname.startsWith("/api/payments") ||
      pathname.startsWith("/api/certificates/my") ||
      pathname.startsWith("/api/certificates/claim") ||
      pathname.startsWith("/api/certificates/generate") ||
      pathname === "/api/auth/me" ||
      pathname === "/api/users/me" ||
      pathname.startsWith("/api/users/profile") ||
      pathname.startsWith("/api/careers/my-enrollments") ||
      pathname.includes("/quiz/submit") ||
      pathname.includes("/project/submit") ||
      (pathname.startsWith("/api/courses/") &&
        (pathname.includes("/learn") ||
          pathname.includes("/quiz") ||
          pathname.includes("/project") ||
          pathname.includes("/lessons") ||
          pathname.includes("/access") ||
          pathname.includes("/enrollment-status") ||
          pathname.includes("/eligibility")));

    if (isProtectedApi) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Unauthorized: Please log in to continue" },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // -------------------------------------------------------------
  // 3. ROOT ROUTE: /
  // -------------------------------------------------------------
  if (pathname === "/") {
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/my-courses", request.url));
      }
    }
    // Unauthenticated: render public landing page
    return NextResponse.next();
  }

  // -------------------------------------------------------------
  // 4. FRONTEND ADMIN PAGES: /admin and /admin/*
  // -------------------------------------------------------------
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPage) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    // Authenticated non-admin (e.g. STUDENT) attempting to access Admin pages:
    if (!isAdmin) {
      const coursesUrl = new URL("/my-courses", request.url);
      const res = NextResponse.redirect(coursesUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  }

  // -------------------------------------------------------------
  // 5. FRONTEND PROTECTED STUDENT PAGES
  // -------------------------------------------------------------
  const isProtectedStudentPage =
    pathname === "/my-courses" ||
    pathname.startsWith("/my-courses/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/discover" ||
    pathname.startsWith("/discover/") ||
    pathname === "/bootcamp" ||
    pathname.startsWith("/bootcamp/") ||
    pathname === "/prebooks" ||
    pathname.startsWith("/prebooks/") ||
    pathname === "/master-class" ||
    pathname.startsWith("/master-class/") ||
    pathname === "/my-learning" ||
    pathname.startsWith("/my-learning/") ||
    pathname.startsWith("/learning/") ||
    pathname.startsWith("/learning-roles") ||
    pathname.startsWith("/my-learning-roles") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/learn/") ||
    (pathname.startsWith("/courses/") && pathname.includes("/learn")) ||
    (pathname === "/certificates" ||
      (pathname.startsWith("/certificates/") &&
        !pathname.startsWith("/certificates/verify"))) ||
    pathname === "/projects-dashboard" ||
    pathname === "/my-projects" ||
    pathname === "/live-classes" ||
    pathname.startsWith("/live-classes/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/learning-reports") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/my-credentials" ||
    pathname === "/my-roles" ||
    pathname === "/my-payments" ||
    pathname.startsWith("/user/") ||
    pathname.startsWith("/checkout") ||
    pathname === "/payment" ||
    pathname.startsWith("/pay/");

  if (isProtectedStudentPage) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    // Role-based protection: ADMIN cannot access student-only areas like /my-courses, /my-learning, or checkout
    if (isAdmin) {
      const isStudentOnlyArea =
        pathname === "/my-courses" ||
        pathname.startsWith("/my-courses/") ||
        pathname === "/my-learning" ||
        pathname.startsWith("/my-learning/") ||
        pathname.startsWith("/checkout") ||
        pathname === "/payment" ||
        pathname.startsWith("/pay/");

      if (isStudentOnlyArea) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  }

  // -------------------------------------------------------------
  // 6. AUTH PAGES: /login, /signup, /register
  // -------------------------------------------------------------
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/register";

  if (isAuthPage && isAuthenticated) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const qRedirect =
      request.nextUrl.searchParams.get("redirect") ||
      request.nextUrl.searchParams.get("returnUrl");

    if (
      qRedirect &&
      qRedirect.startsWith("/") &&
      !qRedirect.startsWith("//") &&
      !qRedirect.startsWith("/admin") &&
      qRedirect !== "/login" &&
      qRedirect !== "/signup" &&
      qRedirect !== "/discover" &&
      qRedirect !== "/"
    ) {
      return NextResponse.redirect(new URL(qRedirect, request.url));
    }

    return NextResponse.redirect(new URL("/my-courses", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/media/upload|api/profile/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
