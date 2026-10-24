"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScreenNavigator } from "./ScreenNavigator";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/context/AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const {
    currentUser,
    logout,
    isAuthModalOpen,
    authModalMode,
    authRedirectUrl,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let redirectUrl: string | null = null;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const qRedirect = sp.get("redirect") || sp.get("returnUrl") || sp.get("callbackUrl");
      if (qRedirect && qRedirect.startsWith("/") && !qRedirect.startsWith("//")) {
        redirectUrl = qRedirect;
        try {
          sessionStorage.setItem("ingage_redirect_after_auth", qRedirect);
        } catch {}
      }
    }

    if (pathname === "/login") {
      openAuthModal("login", redirectUrl || undefined);
    } else if (pathname === "/admin/login") {
      openAuthModal("login", redirectUrl || "/admin");
    } else if (pathname === "/signup") {
      openAuthModal("signup", redirectUrl || undefined);
    } else if (pathname === "/forgot-password" || pathname === "/reset-password") {
      openAuthModal("forgot-password");
    }
  }, [pathname, openAuthModal]);

  const navigate = (p: string) => {
    router.push(p);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAuth = (
    mode: "login" | "signup" | "forgot-password" = "login",
    redirectUrl?: string
  ) => {
    openAuthModal(mode, redirectUrl);
  };

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLearnRoute = pathname.startsWith("/learn") || pathname.includes("/learn");
  const isStudentRoute =
    pathname === "/discover" ||
    pathname.startsWith("/discover/") ||
    pathname === "/my-courses" ||
    pathname.startsWith("/my-courses/") ||
    pathname === "/bootcamp" ||
    pathname.startsWith("/bootcamp/") ||
    pathname === "/prebooks" ||
    pathname.startsWith("/prebooks/") ||
    pathname === "/master-class" ||
    pathname.startsWith("/master-class/") ||
    pathname === "/live-classes" ||
    pathname.startsWith("/live-classes/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/certificates" ||
    pathname.startsWith("/certificates/") ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/my-learning") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/pay");
  const isDedicatedLayoutRoute = isAdminRoute || isDashboardRoute || isLearnRoute || isStudentRoute;
  const hidePublicNavbar = isDedicatedLayoutRoute || !!currentUser;

  return (
    <div
      className={`min-h-screen ${
        isAdminRoute
          ? "bg-slate-950 text-slate-100"
          : isDashboardRoute || isLearnRoute || isStudentRoute
          ? "bg-[#F8FAFC] text-gray-900"
          : "bg-white text-gray-900"
      } flex flex-col font-sans selection:bg-lime-200 selection:text-lime-900 relative`}
    >
      {toastMessage && (
        <div
          id="global-toast-notification"
          className="fixed top-20 sm:top-22 right-3 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)] bg-gray-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2.5 animate-in slide-in-from-top-4 fade-in duration-200"
        >
          <span className="w-2 h-2 rounded-full bg-lime-400 shrink-0 animate-pulse"></span>
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {!hidePublicNavbar && (
        <Header
          currentPath={pathname}
          onNavigate={navigate}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={logout}
        />
      )}

      <main className="flex-1">{children}</main>

      {!hidePublicNavbar && <Footer onNavigate={navigate} />}

      {!hidePublicNavbar && (
        <ScreenNavigator currentPath={pathname} onNavigate={navigate} currentUser={currentUser} />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        portalRole={
          pathname === "/admin/login" || pathname.startsWith("/admin")
            ? "ADMIN"
            : undefined
        }
        onClose={() => {
          closeAuthModal();
          if (
            pathname === "/login" ||
            pathname === "/admin/login" ||
            pathname === "/signup" ||
            pathname === "/forgot-password" ||
            pathname === "/reset-password"
          ) {
            let savedRedirect: string | null = null;
            if (typeof window !== "undefined") {
              try {
                savedRedirect = sessionStorage.getItem("ingage_redirect_after_auth");
              } catch {}
            }
            if (
              savedRedirect &&
              savedRedirect.startsWith("/") &&
              !savedRedirect.startsWith("//") &&
              savedRedirect !== "/login" &&
              savedRedirect !== "/signup" &&
              savedRedirect !== "/forgot-password" &&
              savedRedirect !== "/reset-password"
            ) {
              navigate(savedRedirect);
            } else {
              navigate("/");
            }
          }
        }}
        onSuccess={(user) => {
          closeAuthModal();
          showToast(`Welcome${user?.name ? ", " + user.name : ""}!`);
          const userRole = (user?.role || "").toUpperCase().trim();
          const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);

          let savedRedirect = authRedirectUrl;
          if (!savedRedirect && typeof window !== "undefined") {
            try {
              savedRedirect = sessionStorage.getItem("ingage_redirect_after_auth");
            } catch {}
          }

          if (
            savedRedirect &&
            savedRedirect.startsWith("/") &&
            !savedRedirect.startsWith("//") &&
            savedRedirect !== "/login" &&
            savedRedirect !== "/signup" &&
            savedRedirect !== "/forgot-password" &&
            savedRedirect !== "/reset-password" &&
            savedRedirect !== "/discover" &&
            savedRedirect !== "/"
          ) {
            try {
              sessionStorage.removeItem("ingage_redirect_after_auth");
            } catch {}

            // Prevent a student from following a saved redirect into /admin
            if (!isAdmin && (savedRedirect === "/admin" || savedRedirect.startsWith("/admin/"))) {
              navigate("/my-courses");
            } else if (
              isAdmin &&
              (savedRedirect === "/my-courses" ||
                savedRedirect.startsWith("/my-courses/") ||
                savedRedirect === "/my-learning" ||
                savedRedirect.startsWith("/my-learning/"))
            ) {
              navigate("/admin");
            } else {
              navigate(savedRedirect);
            }
          } else if (isAdmin) {
            navigate("/admin");
          } else {
            navigate("/my-courses");
          }
        }}
        onNavigate={navigate}
      />
    </div>
  );
}

export default AppShell;
