"use client";
import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { UserProfile } from '../types';
import {
  Menu,
  Bell,
  LogOut,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

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

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle sidebar collapse"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="hidden sm:inline text-slate-400">Admin</span>
                <span className="hidden sm:inline text-slate-300">/</span>
                <span className="text-slate-800 font-bold">{formatBreadcrumb(currentPath)}</span>
              </span>
            </div>
          </div>

          {/* Right: Actions, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Switch to Learner Site */}
            <button
              onClick={() => onNavigate('/')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-700 border border-slate-200 hover:border-green-200 text-xs font-semibold transition-all cursor-pointer"
              title="Switch to Learner Portal"
            >
              <ExternalLink className="w-3.5 h-3.5 text-green-600" />
              <span>Learner View</span>
            </button>

            {/* Notification Bell with Green Badge */}
            <button
              onClick={() => onNavigate('/admin/activity')}
              className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Recent Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-600 ring-2 ring-white animate-pulse" />
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Admin Profile Display */}
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-green-950/20">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'Admin'}
                </span>
                <span className="text-[11px] text-green-700 font-medium">
                  {currentUser?.role === 'ADMIN' ? 'Administrator' : currentUser?.role || 'Administrator'}
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
