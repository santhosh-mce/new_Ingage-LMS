"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  Compass,
  BookOpen,
  Rocket,
  Bookmark,
  Sparkles,
  Radio,
  Users,
  Award,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Bell,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch } from "@/store/hooks";
import { logoutUserThunk, clearCredentials } from "@/store/slices/authSlice";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface StudentLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  requireAuth?: boolean;
}

export function StudentLayout({
  children,
  activePath,
  requireAuth = true,
}: StudentLayoutProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser, isAuthenticated, isAuthLoading, logout } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Authentication & role check: redirect unauthenticated to /login, and redirect ADMIN from /my-courses & /my-learning to /admin
  useEffect(() => {
    if (requireAuth && !isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (requireAuth && !isAuthLoading && isAuthenticated && currentUser) {
      const userRole = (currentUser.role || "").toUpperCase().trim();
      const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);
      if (
        isAdmin &&
        (pathname === "/my-courses" ||
          pathname.startsWith("/my-courses/") ||
          pathname === "/my-learning" ||
          pathname.startsWith("/my-learning/"))
      ) {
        router.replace("/admin");
      }
    }
  }, [requireAuth, isAuthenticated, isAuthLoading, currentUser, pathname, router]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserThunk()).unwrap();
    } catch {}
    dispatch(clearCredentials());
    logout();
    router.push("/login");
  };

  const currentRoute = activePath || pathname;

  const navItems = [
    {
      name: "Discover",
      href: "/discover",
      icon: Compass,
      isActive: currentRoute === "/discover" || currentRoute.startsWith("/discover/"),
    },
    {
      name: "My Courses",
      href: "/my-courses",
      icon: BookOpen,
      isActive:
        currentRoute === "/my-courses" ||
        currentRoute.startsWith("/my-courses/") ||
        currentRoute === "/my-learning" ||
        currentRoute.startsWith("/courses/") ||
        currentRoute.includes("/learn") ||
        currentRoute.startsWith("/learn"),
    },
    {
      name: "Bootcamp",
      href: "/bootcamp",
      icon: Rocket,
      isActive: currentRoute === "/bootcamp" || currentRoute.startsWith("/bootcamp/"),
    },
    {
      name: "Prebooks",
      href: "/prebooks",
      icon: Bookmark,
      isActive: currentRoute === "/prebooks" || currentRoute.startsWith("/prebooks/"),
    },
    {
      name: "Master Class",
      href: "/master-class",
      icon: Sparkles,
      isActive: currentRoute === "/master-class" || currentRoute.startsWith("/master-class/"),
    },
    {
      name: "Live Classes",
      href: "/live-classes",
      icon: Radio,
      isActive: currentRoute === "/live-classes" || currentRoute.startsWith("/live-classes/"),
    },
    {
      name: "Community",
      href: "/community",
      icon: Users,
      isActive: currentRoute === "/community" || currentRoute.startsWith("/community/"),
    },
    {
      name: "Certificates",
      href: "/certificates",
      icon: Award,
      isActive: currentRoute === "/certificates" || currentRoute.startsWith("/certificates/"),
    },
    {
      name: "Orders",
      href: "/orders",
      icon: CreditCard,
      isActive:
        currentRoute === "/orders" ||
        currentRoute.startsWith("/orders/") ||
        currentRoute === "/my-payments",
    },
  ];

  const studentName =
    currentUser?.name ||
    (currentUser as any)?.full_name ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "Student");
  const studentEmail = currentUser?.email || "";
  const studentAvatar = currentUser?.profileImage || currentUser?.avatarUrl || "";

  return (
    <div className="min-h-screen bg-white flex text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ==================================================
          LEFT SIDEBAR (EMC Student Design with InGage branding)
          ================================================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white text-slate-700 border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Top: Brand Logo & STUDENT Label */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <BrandLogo
            role="STUDENT"
            variant="sidebar"
            collapsed={isCollapsed}
            theme="light"
            href="/discover"
          />

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close mobile sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          <div>
            {!isCollapsed ? (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                GENERAL
              </p>
            ) : (
              <div className="h-4" />
            )}

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group relative ${
                      active
                        ? "bg-[#00A86B] text-white shadow-xs"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
                    } ${isCollapsed ? "justify-center px-0" : ""}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform ${
                        active
                          ? "text-white"
                          : "text-slate-500 group-hover:text-emerald-600 group-hover:scale-105"
                      }`}
                    />

                    {!isCollapsed && <span className="truncate">{item.name}</span>}

                    {/* Active pill dot when collapsed */}
                    {isCollapsed && active && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer group ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================
          MAIN CONTENT WRAPPER
          ================================================== */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Mobile Hamburger + Global Search */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Header Brand Logo */}
            <div className="lg:hidden">
              <BrandLogo role="STUDENT" variant="header" theme="light" href="/discover" />
            </div>

            {/* Quick Search */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search courses, bootcamps, master classes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Right: Notifications & Logged-in Student Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00A86B]" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      New Updates
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-3 hover:bg-slate-50 transition">
                      <p className="text-xs font-semibold text-slate-800">
                        Live Class Tomorrow
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Interactive Live Workshop on System Design starts at 7:00 PM.
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                    </div>
                    <div className="p-3 hover:bg-slate-50 transition">
                      <p className="text-xs font-semibold text-slate-800">
                        Certificate Ready
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        You completed Web Development Basics. Check your certificates!
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">1 day ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {!isMounted ? (
              <div className="w-9 h-9 rounded-xl bg-slate-100" />
            ) : isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                aria-label="User Profile Menu"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden shrink-0">
                  {studentAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={studentAvatar}
                      alt={studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{studentName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {studentName}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 leading-tight">
                    Enrolled Student
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{studentName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{studentEmail}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified Student Account
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/my-courses"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>My Courses</span>
                    </Link>

                    <Link
                      href="/certificates"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <Award className="w-4 h-4 text-slate-400" />
                      <span>My Certificates</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Order History</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="px-4 py-2 bg-[#00A86B] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
