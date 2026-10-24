"use client";

import React from "react";
import Link from "next/link";

export interface BrandLogoProps {
  /**
   * User role: 'ADMIN' or 'STUDENT' (falls back to detected context or STUDENT)
   */
  role?: string | null;
  /**
   * Layout style
   * - 'sidebar': For student & admin sidebars with collapsible text & badge
   * - 'header': For public and internal top navigation bars
   * - 'login': High-impact branding for login / auth modal with optional tagline
   * - 'horizontal': Inline single-line brand format
   * - 'compact': Icon only or condensed presentation
   */
  variant?: "sidebar" | "header" | "login" | "horizontal" | "compact";
  /**
   * Collapsed state (icon-only mode in sidebar)
   */
  collapsed?: boolean;
  /**
   * Color theme: 'dark' for dark navy sidebars, 'light' for white surfaces
   */
  theme?: "dark" | "light";
  /**
   * Custom CSS classes
   */
  className?: string;
  /**
   * Show slogan / tagline ("Learn · Build · Grow" for Student, "Manage · Monitor · Grow" for Admin)
   */
  showTagline?: boolean;
  /**
   * Optional custom link href (defaults to /admin for admin and / for student)
   */
  href?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * Standardized Vector Brand Emblem Icon for InGage EduTech
 * Features graduation cap + open book / administrative crest geometry
 */
function BrandEmblem({
  isAdmin,
  size = 40,
}: {
  isAdmin: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-hidden="true"
    >
      {/* Background Container / Soft Rounded Shield */}
      <rect
        width="48"
        height="48"
        rx="12"
        fill={isAdmin ? "url(#admin-bg-grad)" : "url(#student-bg-grad)"}
      />

      {/* Graduation Cap Mortarboard (Diamond Top) */}
      <path
        d="M24 10L39 17.5L24 25L9 17.5L24 10Z"
        fill={isAdmin ? "#1E40AF" : "#16A34A"}
      />
      <path
        d="M24 10L39 17.5L24 25L9 17.5L24 10Z"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Cap Skull Cap (Underneath band) */}
      <path
        d="M15 20.5V26.5C15 29.5 19 32 24 32C29 32 33 29.5 33 26.5V20.5"
        stroke={isAdmin ? "#60A5FA" : "#4ADE80"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tassel Hanging on the Right */}
      <path
        d="M36 18.5V28"
        stroke={isAdmin ? "#93C5FD" : "#86EFAC"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="36" cy="28.5" r="1.5" fill={isAdmin ? "#DBEAFE" : "#DCFCE7"} />

      {/* Inner Motif: Open Book for Student vs Admin Governance Crest for Admin */}
      {isAdmin ? (
        // Admin: Clean geometric governance/gear balance indicator
        <g stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Central gear/core nodes */}
          <circle cx="24" cy="26" r="2.5" fill="#3B82F6" />
          <path d="M24 21.5V23" />
          <path d="M24 29V30.5" />
          <path d="M19.5 26H21" />
          <path d="M27 26H28.5" />
          {/* Upward Growth Bar Accent */}
          <path d="M19 37H29" stroke="#93C5FD" strokeWidth="2" />
          <path d="M21 37V34" stroke="#60A5FA" strokeWidth="2" />
          <path d="M24 37V31" stroke="#38BDF8" strokeWidth="2" />
          <path d="M27 37V33" stroke="#93C5FD" strokeWidth="2" />
        </g>
      ) : (
        // Student: Clean open book knowledge leaves
        <g fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Left page */}
          <path d="M24 27C21 25.5 17 25.5 14 26.5V36C17 35 21 35 24 36.5V27Z" fill="#22C55E" />
          {/* Right page */}
          <path d="M24 27C27 25.5 31 25.5 34 26.5V36C31 35 27 35 24 36.5V27Z" fill="#16A34A" />
          {/* Book Spine Center Line */}
          <path d="M24 26.5V36.5" stroke="#BBF7D0" strokeWidth="1.5" />
        </g>
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="student-bg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#064E3B" />
          <stop offset="0.6" stopColor="#065F46" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="admin-bg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="0.6" stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BrandLogo({
  role,
  variant = "horizontal",
  collapsed = false,
  theme = "light",
  className = "",
  showTagline = false,
  href,
  onClick,
}: BrandLogoProps) {
  const isAdmin = (role || "").toUpperCase() === "ADMIN";
  const roleLabel = isAdmin ? "ADMIN" : "STUDENT";
  const tagline = isAdmin ? "Manage · Monitor · Grow" : "Learn · Build · Grow";

  // Determine target link if none provided
  const targetHref = href !== undefined ? href : isAdmin ? "/admin" : "/";

  // Light/Dark text colors for "In"
  const inColor =
    theme === "dark" ? "text-white" : "text-slate-900";

  // Green color for "Gage"
  const gageColor = "text-[#00A86B]"; // Vibrant corporate green

  // Deep Blue / Dark color for "EduTech"
  const eduTechColor =
    theme === "dark" ? "text-blue-400" : "text-slate-900";

  // Badge styling
  const badgeClasses = isAdmin
    ? theme === "dark"
      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
      : "bg-blue-600 text-white shadow-xs"
    : theme === "dark"
    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
    : "bg-[#064E3B] text-white shadow-xs";

  // Render Inner Content
  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        collapsed ? "justify-center" : ""
      } ${className}`}
    >
      {/* 1. EMBLEM */}
      <BrandEmblem
        isAdmin={isAdmin}
        size={variant === "login" ? 48 : variant === "sidebar" ? 38 : 36}
      />

      {/* 2. TEXT & BADGE (Hidden when sidebar is collapsed) */}
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          {/* Top Line: Brand Name + Role Badge */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-tight flex items-baseline">
              <span className={inColor}>In</span>
              <span className={gageColor}>Gage</span>
            </span>

            {/* Role Badge */}
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full leading-none transition-all ${badgeClasses}`}
            >
              {roleLabel}
            </span>
          </div>

          {/* Bottom Line: EduTech */}
          <span
            className={`font-black text-xs sm:text-sm tracking-wide leading-tight ${eduTechColor}`}
          >
            EduTech
          </span>

          {/* Optional Tagline for Login / Hero view */}
          {showTagline && (
            <span
              className={`text-[11px] font-medium tracking-wide mt-1 ${
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // If onClick or href is passed, wrap cleanly
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left focus:outline-none cursor-pointer group"
        aria-label={`InGage EduTech ${roleLabel} Portal`}
      >
        {content}
      </button>
    );
  }

  if (targetHref) {
    return (
      <Link
        href={targetHref}
        className="focus:outline-none group block"
        aria-label={`InGage EduTech ${roleLabel} Portal`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
