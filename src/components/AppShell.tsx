"use client";

import React, { useState } from "react";
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

  React.useEffect(() => {
    if (pathname === '/login') {
      openAuthModal('login');
    } else if (pathname === '/signup') {
      openAuthModal('signup');
    } else if (pathname === '/forgot-password' || pathname === '/reset-password') {
      openAuthModal('forgot-password');
    }
  }, [pathname, openAuthModal]);

  const navigate = (p: string) => {
    router.push(p);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAuth = (mode: "login" | "signup" | "forgot-password" = "login", redirectUrl?: string) => {
    openAuthModal(mode, redirectUrl);
  };

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div
      className={`min-h-screen ${
        isAdminRoute ? "bg-slate-950 text-slate-100" : "bg-white text-gray-900"
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

      {!isAdminRoute && (
        <Header
          currentPath={pathname}
          onNavigate={navigate}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={logout}
        />
      )}

      <main className="flex-1">{children}</main>

      {!isAdminRoute && <Footer onNavigate={navigate} />}

      <ScreenNavigator currentPath={pathname} onNavigate={navigate} currentUser={currentUser} />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => {
          closeAuthModal();
          if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
            navigate('/');
          }
        }}
        onSuccess={(user) => {
          closeAuthModal();
          showToast(`Welcome${user?.name ? ', ' + user.name : ''}!`);
          const savedRedirect = authRedirectUrl || sessionStorage.getItem('ingage_redirect_after_auth');
          if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/signup' && savedRedirect !== '/forgot-password' && savedRedirect !== '/reset-password') {
            try {
              sessionStorage.removeItem('ingage_redirect_after_auth');
            } catch {}
            navigate(savedRedirect);
          } else if (user?.role === 'ADMIN') {
            navigate('/admin');
          } else if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
            navigate('/');
          }
        }}
        onNavigate={navigate}
      />
    </div>
  );
}
