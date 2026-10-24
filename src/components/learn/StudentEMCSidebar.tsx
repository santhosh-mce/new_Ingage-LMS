"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface StudentEMCSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export function StudentEMCSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}: StudentEMCSidebarProps) {
  const pathname = usePathname();

  const generalNavItems = [
    {
      name: "Discover",
      href: "/discover",
      icon: Compass,
      isActive: pathname === "/discover" || pathname.startsWith("/discover/"),
    },
    {
      name: "My Courses",
      href: "/my-courses",
      icon: BookOpen,
      isActive:
        pathname === "/my-courses" ||
        pathname.startsWith("/my-courses/") ||
        pathname.startsWith("/courses/") ||
        pathname.includes("/learn"),
    },
    {
      name: "Bootcamp",
      href: "/bootcamp",
      icon: Rocket,
      isActive: pathname === "/bootcamp" || pathname.startsWith("/bootcamp/"),
    },
    {
      name: "Prebooks",
      href: "/prebooks",
      icon: Bookmark,
      isActive: pathname === "/prebooks" || pathname.startsWith("/prebooks/"),
    },
    {
      name: "Master Class",
      href: "/master-class",
      icon: Sparkles,
      isActive: pathname === "/master-class" || pathname.startsWith("/master-class/"),
    },
    {
      name: "Live Classes",
      href: "/live-classes",
      icon: Radio,
      isActive: pathname === "/live-classes" || pathname.startsWith("/live-classes/"),
    },
    {
      name: "Community",
      href: "/community",
      icon: Users,
      isActive: pathname === "/community" || pathname.startsWith("/community/"),
    },
    {
      name: "Certificates",
      href: "/certificates",
      icon: Award,
      isActive: pathname === "/certificates" || pathname.startsWith("/certificates/"),
    },
    {
      name: "Orders",
      href: "/orders",
      icon: CreditCard,
      isActive: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0A1224] text-slate-200 border-r border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Top Header: Brand Logo, STUDENT Tag & Collapse Button */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-slate-800/80">
          <BrandLogo
            role="STUDENT"
            variant="sidebar"
            collapsed={isCollapsed}
            theme="dark"
            href="/discover"
          />

          {/* Collapse button on Desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close button on Mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label: GENERAL */}
        {!isCollapsed && (
          <div className="px-5 pt-5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              GENERAL
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          {generalNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onCloseMobile();
                }}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-[#00C975] text-white shadow-md shadow-[#00C975]/25 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-slate-400 group-hover:text-rose-400" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
