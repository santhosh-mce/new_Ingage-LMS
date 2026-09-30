"use client";
import React, { useState } from 'react';
import {
  Grid,
  X,
  ChevronRight,
  Home,
  GraduationCap,
  FileText,
  Briefcase,
  Rocket,
  Building2,
  PlayCircle,
  Search,
  LogIn,
  UserPlus,
  BookOpen,
  Award,
  Download,
  MessageSquare,
  HelpCircle,
  Settings,
  Lock,
  User,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';

interface ScreenNavigatorProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser?: UserProfile | null;
}

interface ScreenItem {
  name: string;
  path: string;
  desc: string;
  icon: React.ElementType;
  section: 'PUBLIC' | 'LEARNING' | 'PROFILE' | 'AUTH' | 'ADMIN';
}

const SCREENS: ScreenItem[] = [
  { name: 'Landing Page', path: '/', desc: 'Homepage with hero, featured careers', icon: Home, section: 'PUBLIC' },
  { name: 'Explore Career Paths', path: '/careers', desc: 'Browse all career job-role paths', icon: GraduationCap, section: 'PUBLIC' },
  { name: 'Course Discovery', path: '/courses', desc: 'Explore all specialized modular courses', icon: BookOpen, section: 'PUBLIC' },
  { name: 'Career Detail', path: '/roles/data-analyst', desc: 'Detailed career path & curriculum', icon: FileText, section: 'PUBLIC' },
  { name: 'Projects Track', path: '/projects', desc: 'Hands-on portfolio building track', icon: Rocket, section: 'PUBLIC' },
  { name: 'Opportunities & Jobs', path: '/opportunities', desc: 'Verified placement drives & listings', icon: Briefcase, section: 'PUBLIC' },
  { name: 'For Employers', path: '/employers', desc: 'Enterprise workforce & hiring portal', icon: Building2, section: 'PUBLIC' },
  { name: 'Certificate Verification', path: '/certificate/verify/INGAGE-2026-TEST01', desc: 'Public tamper-proof credential verifier', icon: Award, section: 'PUBLIC' },
  
  { name: 'My Learning Dashboard', path: '/my-learning', desc: 'Enrolled tracks, progress, milestone scores', icon: BookOpen, section: 'LEARNING' },
  { name: 'My Learning Roles', path: '/learning-roles', desc: 'Enrolled paths, active role switcher & progress', icon: GraduationCap, section: 'LEARNING' },
  { name: 'My Projects Dashboard', path: '/my-projects', desc: 'Active projects, progress rings & internship eligibility', icon: Rocket, section: 'LEARNING' },
  { name: 'Internship Program (Overview)', path: '/internship-program', desc: 'Ingage industry internship curriculum, duration & perks', icon: Sparkles, section: 'LEARNING' },
  { name: 'Active Internship Program', path: '/internship', desc: 'Healthcare Tech 8-week timeline & mentor lead', icon: Briefcase, section: 'LEARNING' },
  { name: 'Learning Player & LMS', path: '/learn/data-analyst', desc: 'Sequential gated modules & quiz', icon: PlayCircle, section: 'LEARNING' },

  { name: 'Student Profile', path: '/profile', desc: 'Readiness score, skills, target role', icon: User, section: 'PROFILE' },
  { name: 'Certificates & Credentials', path: '/profile/certificates', desc: 'Verifiable IDs & PDF downloads', icon: Award, section: 'PROFILE' },
  { name: 'Download Center', path: '/profile/downloads', desc: 'Cheat sheets, datasets, guides', icon: Download, section: 'PROFILE' },
  { name: 'My Support Tickets', path: '/profile/tickets', desc: 'Mentor questions & resolution status', icon: MessageSquare, section: 'PROFILE' },
  { name: 'Help Center & FAQs', path: '/profile/help', desc: 'Gated milestones & placement FAQs', icon: HelpCircle, section: 'PROFILE' },
  { name: 'Account Settings', path: '/profile/settings', desc: 'Personal details & notifications', icon: Settings, section: 'PROFILE' },
  { name: 'Password Reset', path: '/profile/reset-password', desc: 'Secure credential update form', icon: Lock, section: 'PROFILE' },

  { name: 'Admin Overview', path: '/admin', desc: '13 live metrics, revenue & enrollment charts', icon: Settings, section: 'ADMIN' },
  { name: 'Admin Users', path: '/admin/users', desc: 'Role management, soft deactivation, profiles', icon: User, section: 'ADMIN' },
  { name: 'Admin Courses', path: '/admin/courses', desc: 'Catalog, draft/publish/archive status', icon: BookOpen, section: 'ADMIN' },
  { name: 'Admin Add Course', path: '/admin/courses/new', desc: 'Curriculum builder & media uploader', icon: Sparkles, section: 'ADMIN' },
  { name: 'Admin Payments', path: '/admin/payments', desc: 'Razorpay payment transactions ledger', icon: Briefcase, section: 'ADMIN' },
  { name: 'Admin Orders', path: '/admin/orders', desc: 'Student order history & invoice statuses', icon: FileText, section: 'ADMIN' },
  { name: 'Admin Discounts', path: '/admin/discounts', desc: 'Coupon code generator & redemption limits', icon: Award, section: 'ADMIN' },
  { name: 'Admin Course Progress', path: '/admin/progress', desc: 'Student completion trackers & lesson records', icon: PlayCircle, section: 'ADMIN' },
  { name: 'Admin Certificates', path: '/admin/certificates', desc: 'Issued PDF credentials with verification codes', icon: Award, section: 'ADMIN' },
  { name: 'Admin Careers', path: '/admin/careers', desc: 'Career paths & dynamic course assignment', icon: GraduationCap, section: 'ADMIN' },
  { name: 'Admin Projects', path: '/admin/projects', desc: 'Project tracks, difficulty, public explore visibility', icon: Rocket, section: 'ADMIN' },
  { name: 'Admin Activity Logs', path: '/admin/activity', desc: 'Audit trail of administrative actions', icon: Lock, section: 'ADMIN' },
  { name: 'Admin Settings', path: '/admin/settings', desc: 'Razorpay keys, storage & platform config', icon: Settings, section: 'ADMIN' },

  { name: 'Create Account (Sign Up)', path: '/signup', desc: 'Modal with Google, LinkedIn & form', icon: UserPlus, section: 'AUTH' },
  { name: 'Welcome Back (Log In)', path: '/login', desc: 'Modal with remember me & reset', icon: LogIn, section: 'AUTH' },
];

export function ScreenNavigator({ currentPath, onNavigate, currentUser: propUser }: ScreenNavigatorProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? propUser : null;
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const currentScreen = SCREENS.find((s) => s.path === currentPath) || {
    name: 'Active Screen',
    path: currentPath,
    desc: 'Ingage Job-Role Learning Platform',
    icon: Home,
    section: 'PUBLIC' as const
  };

  const filteredScreens = SCREENS.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.path.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="screen-navigator-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-lime-300 cursor-pointer"
        title="Open Screen Directory"
        aria-label="Open Screen Navigator"
      >
        <Grid className="w-5 h-5" />
      </button>

      {/* Screen Navigator Slide-over Panel */}
      {isOpen && (
        <div
          id="screen-navigator-panel"
          className="fixed bottom-18 sm:bottom-24 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-96 max-w-sm max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-lime-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base">
              <Grid className="w-5 h-5" />
              <span>Screen Navigator</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-lime-700/80 transition-colors text-white cursor-pointer"
                title="Close navigator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search 43 screens..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-400"
              />
            </div>
          </div>

          {/* Current Page Box */}
          <div className="p-3 bg-lime-50/60 border-b border-lime-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-lime-800 flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse"></span>
              <span>Current Page</span>
            </div>
            <div className="bg-lime-600 text-white p-3 rounded-xl flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <currentScreen.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{currentScreen.name}</div>
                <div className="text-xs text-lime-100 font-mono truncate">{currentScreen.path}</div>
                <div className="text-[11px] text-lime-50 mt-0.5 truncate">{currentScreen.desc}</div>
              </div>
            </div>
          </div>

          {/* Screens List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[420px]">
            {/* Public Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                Public Pages ({SCREENS.filter((s) => s.section === 'PUBLIC').length})
              </div>
              <div className="space-y-1">
                {filteredScreens
                  .filter((s) => s.section === 'PUBLIC')
                  .map((screen) => (
                    <button
                      key={screen.path}
                      onClick={() => {
                        onNavigate(screen.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        currentPath === screen.path
                          ? 'bg-lime-500 text-white font-medium shadow-xs'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentPath === screen.path ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <screen.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{screen.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              currentPath === screen.path ? 'text-lime-100' : 'text-gray-400'
                            }`}
                          >
                            {screen.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          currentPath === screen.path ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Learning Player Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5 flex items-center justify-between">
                <span>LMS Learning Player</span>
                {!currentUser && (
                  <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {filteredScreens
                  .filter((s) => s.section === 'LEARNING')
                  .map((screen) => (
                    <button
                      key={screen.path}
                      onClick={() => {
                        onNavigate(screen.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        currentPath === screen.path
                          ? 'bg-lime-500 text-white font-medium shadow-xs'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentPath === screen.path ? 'bg-white/20 text-white' : 'bg-lime-100 text-lime-700'
                          }`}
                        >
                          <screen.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span>{screen.name}</span>
                            {!currentUser && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              currentPath === screen.path ? 'text-lime-100' : 'text-gray-400'
                            }`}
                          >
                            {screen.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          currentPath === screen.path ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Student Profile Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Student Profile</span>
                {!currentUser && (
                  <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {filteredScreens
                  .filter((s) => s.section === 'PROFILE')
                  .map((screen) => (
                    <button
                      key={screen.path}
                      onClick={() => {
                        onNavigate(screen.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        currentPath === screen.path
                          ? 'bg-lime-500 text-white font-medium shadow-xs'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentPath === screen.path ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <screen.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span>{screen.name}</span>
                            {!currentUser && <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              currentPath === screen.path ? 'text-lime-100' : 'text-gray-400'
                            }`}
                          >
                            {screen.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          currentPath === screen.path ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Admin Control Center Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 px-2 mb-1.5 flex items-center justify-between">
                <span>Admin Control Center ({SCREENS.filter((s) => s.section === 'ADMIN').length})</span>
                <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  Role: ADMIN
                </span>
              </div>
              <div className="space-y-1">
                {filteredScreens
                  .filter((s) => s.section === 'ADMIN')
                  .map((screen) => (
                    <button
                      key={screen.path}
                      onClick={() => {
                        onNavigate(screen.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        currentPath === screen.path
                          ? 'bg-indigo-600 text-white font-medium shadow-xs'
                          : 'hover:bg-slate-800/10 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentPath === screen.path ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <screen.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{screen.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              currentPath === screen.path ? 'text-indigo-100' : 'text-gray-400'
                            }`}
                          >
                            {screen.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          currentPath === screen.path ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </div>

            {/* Authentication & Account Section */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                Authentication & Accounts ({SCREENS.filter((s) => s.section === 'AUTH').length})
              </div>
              <div className="space-y-1">
                {filteredScreens
                  .filter((s) => s.section === 'AUTH')
                  .map((screen) => (
                    <button
                      key={screen.path}
                      onClick={() => {
                        onNavigate(screen.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        currentPath === screen.path
                          ? 'bg-lime-500 text-white font-medium shadow-xs'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            currentPath === screen.path ? 'bg-white/20 text-white' : 'bg-lime-100 text-lime-700'
                          }`}
                        >
                          <screen.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{screen.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              currentPath === screen.path ? 'text-lime-100' : 'text-gray-400'
                            }`}
                          >
                            {screen.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          currentPath === screen.path ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer badge */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-500 font-medium">
            Ingage LMS • Role-Based Learning &amp; Projects
          </div>
        </div>
      )}
    </>
  );
}
