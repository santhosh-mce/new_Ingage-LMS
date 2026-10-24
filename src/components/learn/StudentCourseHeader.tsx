"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, User, BookOpen, Award, LogOut, Menu } from "lucide-react";
import { UserProfile } from "@/types";

interface StudentCourseHeaderProps {
  courseTitle: string;
  courseId: number | string;
  currentUser: UserProfile | null;
  onBack: () => void;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
  embeddedInLayout?: boolean;
}

export function StudentCourseHeader({
  courseTitle,
  courseId,
  currentUser,
  onBack,
  onToggleMobileSidebar,
  onLogout,
  embeddedInLayout = false,
}: StudentCourseHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = currentUser?.name || (currentUser as any)?.full_name || currentUser?.email?.split('@')[0] || "Student";
  const displayAvatar = currentUser?.profileImage || currentUser?.avatarUrl || "";

  if (embeddedInLayout) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger + Back button + Course Title & ID */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer text-xs font-bold"
          title="Back to My Courses"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to My Courses</span>
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {courseTitle || "Web Development Basics"}
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Course ID: <span className="font-semibold text-slate-600">{courseId}</span>
          </p>
        </div>
      </div>

      {/* Right: Student Profile Avatar & Info Dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {displayName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
              {displayName}
            </span>
            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              Student
            </span>
          </div>

          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || ""}</p>
            </div>

            <div className="py-1">
              <Link
                href="/my-courses"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>My Courses</span>
              </Link>

              <Link
                href="/certificates"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                <Award className="w-4 h-4 text-slate-400" />
                <span>My Certificates</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-1">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
