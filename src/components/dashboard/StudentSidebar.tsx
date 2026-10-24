"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  GraduationCap,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function StudentSidebar({ isOpen, onClose, onLogout }: StudentSidebarProps) {
  const pathname = usePathname();

  const navItems = [
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
        pathname.startsWith("/courses/"),
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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A1224] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/60">
          <BrandLogo
            role="STUDENT"
            variant="sidebar"
            theme="dark"
            href="/discover"
          />

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-[#00C975] text-white shadow-lg shadow-[#00C975]/25 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
