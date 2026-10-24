"use client";
import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { UserProfile } from '../types';
import {
  Menu,
  Bell,
  LogOut,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  onNavigate,
  currentUser,
  onLogout,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = (currentUser?.role || "").toUpperCase().trim();
  const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);

  // Client-side defense-in-depth route guard: prevent any flash before mount or role confirmation
  if (!mounted) {
    return null;
  }

  if (mounted && !currentUser) {
    if (typeof window !== "undefined") {
      window.location.replace("/login?redirect=" + encodeURIComponent(currentPath));
    }
    return null;
  }

  if (mounted && currentUser && !isAdmin) {
    if (typeof window !== "undefined") {
      window.location.replace("/my-courses");
    }
    return null;
  }

  const formatBreadcrumb = (path: string) => {
    const clean = path.replace('/admin', '').replace(/^\//, '');
    if (!clean || clean === 'dashboard') return 'Dashboard';
    return clean.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-green-100 selection:text-green-900">
      {/* Deep Green InGage Admin Sidebar */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Crisp White Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition md:hidden cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile InGage EduTech Admin Logo */}
            <div className="md:hidden">
              <BrandLogo role="ADMIN" variant="header" theme="light" href="/admin" />
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle sidebar collapse"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-slate-400">Admin</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-800 font-bold">{formatBreadcrumb(currentPath)}</span>
              </span>
            </div>
          </div>

          {/* Right: Actions, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Switch to Learner Site */}
            <button
              onClick={() => onNavigate('/')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-semibold transition-all cursor-pointer"
              title="Switch to Learner Portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Learner View</span>
            </button>

            {/* Notification Bell with Blue Badge */}
            <button
              onClick={() => onNavigate('/admin/activity')}
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Recent Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Admin Profile Display */}
            <div className="flex items-center gap-3 pl-1">
              <div
                suppressHydrationWarning
                className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-950/20"
              >
                {mounted && currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span
                  suppressHydrationWarning
                  className="text-xs font-bold text-slate-900 leading-tight"
                >
                  {mounted && currentUser?.name ? currentUser.name : 'Admin'}
                </span>
                <span
                  suppressHydrationWarning
                  className="text-[11px] text-blue-700 font-medium"
                >
                  {mounted && currentUser?.role
                    ? currentUser.role === 'ADMIN'
                      ? 'Administrator'
                      : currentUser.role
                    : 'Administrator'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Admin Page Container */}
        <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 pb-16 sm:pb-20">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
