"use client";
import React, { useState } from 'react';
import {
  GraduationCap,
  TrendingUp,
  Clock,
  Award,
  Zap,
  BookOpen,
  Play,
  ArrowRight,
  ChevronRight,
  Plus,
  CheckCircle,
  Lock,
  AlertCircle,
  Briefcase,
  Star,
  ExternalLink,
  Laptop,
  Palette,
  Bot,
  BarChart3
} from 'lucide-react';

interface MyLearningRolesPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string) => void;
}

interface EnrolledRole {
  id: string;
  slug: string;
  title: string;
  category: string;
  iconType: 'chart' | 'design' | 'code' | 'robot';
  badge?: 'PRO' | 'PREMIUM';
  bannerImage: string;
  progress: number; // percentage
  modulesCompleted: number;
  totalModules: number;
  hoursSpent: number;
  projectsDone: number;
  skillsCount: number;
  estCompletion?: string;
  currentTopic?: {
    title: string;
    subtopic: string;
  };
  isLocked?: boolean;
  lockRequirement?: string;
}

const INITIAL_ROLES: EnrolledRole[] = [
  {
    id: 'data-analyst',
    slug: 'data-analyst',
    title: 'Data Analyst',
    category: 'Data & Analytics',
    iconType: 'chart',
    badge: 'PRO',
    bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
    progress: 50,
    modulesCompleted: 4,
    totalModules: 8,
    hoursSpent: 24,
    projectsDone: 3,
    skillsCount: 12,
    estCompletion: 'Mar 30, 2024',
    currentTopic: {
      title: 'Window Functions & CTEs',
      subtopic: 'Advanced SQL Queries'
    }
  },
  {
    id: 'ux-ui-designer',
    slug: 'ux-ui-designer',
    title: 'UX/UI Designer',
    category: 'Design',
    iconType: 'design',
    badge: 'PRO',
    bannerImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80',
    progress: 20,
    modulesCompleted: 2,
    totalModules: 10,
    hoursSpent: 12,
    projectsDone: 1,
    skillsCount: 6,
    estCompletion: 'Apr 25, 2024',
    currentTopic: {
      title: 'Design Systems & Component Libraries',
      subtopic: 'Figma Auto-Layout & Variants'
    }
  },
  {
    id: 'full-stack-developer',
    slug: 'full-stack-developer',
    title: 'Full Stack Developer',
    category: 'Software Development',
    iconType: 'code',
    bannerImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 12,
    hoursSpent: 0,
    projectsDone: 0,
    skillsCount: 0,
    estCompletion: 'May 15, 2024',
    currentTopic: {
      title: 'Frontend Fundamentals with React & TypeScript',
      subtopic: 'State Management & Virtual DOM'
    }
  },
  {
    id: 'machine-learning-engineer',
    slug: 'machine-learning-engineer',
    title: 'Machine Learning Engineer',
    category: 'AI & Machine Learning',
    iconType: 'robot',
    badge: 'PREMIUM',
    bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    progress: 0,
    modulesCompleted: 0,
    totalModules: 14,
    hoursSpent: 0,
    projectsDone: 0,
    skillsCount: 0,
    isLocked: true,
    lockRequirement: 'Complete "Data Analyst" path to unlock'
  }
];

export function MyLearningRolesPage({ onNavigate, onShowToast }: MyLearningRolesPageProps) {
  const [activeRoleId, setActiveRoleId] = useState<string>('data-analyst');
  const [roles, setRoles] = useState<EnrolledRole[]>(INITIAL_ROLES);
  const [lockedModalRole, setLockedModalRole] = useState<EnrolledRole | null>(null);

  const activeRole = roles.find((r) => r.id === activeRoleId) || roles[0];
  const otherRoles = roles.filter((r) => r.id !== activeRoleId);

  // Stats calculation
  const totalEnrolled = roles.length;
  const avgProgress = Math.round(
    (roles.reduce((acc, r) => acc + r.progress, 0) / totalEnrolled) * 10
  ) / 10;
  const totalHours = roles.reduce((acc, r) => acc + r.hoursSpent, 0);
  const totalProjects = roles.reduce((acc, r) => acc + r.projectsDone, 0);

  const handleSwitchRole = (newRoleId: string) => {
    const target = roles.find((r) => r.id === newRoleId);
    if (!target) return;
    if (target.isLocked) {
      setLockedModalRole(target);
      return;
    }
    setActiveRoleId(newRoleId);
    if (onShowToast) {
      onShowToast(`Switched active role to ${target.title}`);
    }
  };

  const renderRoleIcon = (type: string) => {
    switch (type) {
      case 'design':
        return (
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 backdrop-blur-md border border-pink-400/40 flex items-center justify-center text-pink-300">
            <Palette className="w-5 h-5" />
          </div>
        );
      case 'code':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/40 flex items-center justify-center text-blue-300">
            <Laptop className="w-5 h-5" />
          </div>
        );
      case 'robot':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 backdrop-blur-md border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Bot className="w-5 h-5" />
          </div>
        );
      case 'chart':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <BarChart3 className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-[#fafbfa] text-gray-900 pb-6">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-8">
        
        {/* Page Header: Title, Subtitle, and "+ Browse All Careers >" Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              My Learning Roles
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your enrolled career paths and switch between roles
            </p>
          </div>

          <button
            id="browse-all-careers-header-btn"
            onClick={() => onNavigate('/careers')}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-lg bg-[#8DB600] hover:bg-[#7ca300] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Browse All Careers</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* 4 Stats Cards Grid (Exact match to Screenshot 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Card 1: Enrolled Roles */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {totalEnrolled}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">
                Enrolled Roles
              </div>
            </div>
          </div>

          {/* Card 2: Avg. Progress */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {avgProgress}%
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">
                Avg. Progress
              </div>
            </div>
          </div>

          {/* Card 3: Total Hours */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {totalHours}h
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">
                Total Hours
              </div>
            </div>
          </div>

          {/* Card 4: Projects Done */}
          <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {totalProjects}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">
                Projects Done
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Active Role (Exact match to Screenshots 2 & 3) */}
        <div className="mb-12">
          {/* Active Role Heading & Pill */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center gap-1.5 text-gray-900 font-bold text-lg">
              <Zap className="w-5 h-5 text-lime-600 fill-lime-600" />
              <span>Active Role</span>
            </div>
            <span className="bg-[#8DB600] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
              CURRENTLY LEARNING
            </span>
          </div>

          {/* Main Active Role Card with Green Border */}
          <div className="rounded-2xl border-2 border-lime-500 overflow-hidden bg-white shadow-sm">
            {/* Banner Section with Image, Title, Category and Pro Badge */}
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gray-900">
              <img
                src={activeRole.bannerImage}
                alt={activeRole.title}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Top Right Badge */}
              {activeRole.badge && (
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>{activeRole.badge}</span>
                  </span>
                </div>
              )}

              {/* Bottom Left Role Identity */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-3.5">
                {renderRoleIcon(activeRole.iconType)}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {activeRole.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300 font-medium mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-lime-400" />
                    <span>{activeRole.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Card Body Content */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Overall Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-gray-700">Overall Progress</span>
                  <span className="font-extrabold text-[#8DB600] text-base">{activeRole.progress}%</span>
                </div>
                <div className="h-3.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8DB600] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${activeRole.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 font-medium">
                  <span>{activeRole.modulesCompleted} of {activeRole.totalModules} modules completed</span>
                  {activeRole.estCompletion && <span>Est. completion: {activeRole.estCompletion}</span>}
                </div>
              </div>

              {/* 3 Metric Boxes (Hours Spent, Projects Done, Skills Learned) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50/80 rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#8DB600]">
                    {activeRole.hoursSpent}h
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Hours Spent</div>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#8DB600]">
                    {activeRole.projectsDone}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Projects Done</div>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-4 text-center border border-gray-100">
                  <div className="text-xl sm:text-2xl font-extrabold text-[#8DB600]">
                    {activeRole.skillsCount}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-1">Skills Learned</div>
                </div>
              </div>

              {/* Highlight Card: Continue Where You Left Off */}
              {activeRole.currentTopic && (
                <div className="bg-lime-50/60 border border-lime-200/90 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-lime-700">
                    <Play className="w-3.5 h-3.5 fill-lime-600 text-lime-600" />
                    <span>Continue Where You Left Off</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                    {activeRole.currentTopic.title}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-0.5 font-medium">
                    {activeRole.currentTopic.subtopic}
                  </div>
                </div>
              )}

              {/* Action Buttons: Resume Learning & View Details */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                <button
                  id="resume-learning-active-btn"
                  onClick={() => onNavigate(`/learn/${activeRole.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#8DB600] hover:bg-[#7ca300] text-white font-bold text-base shadow-sm transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume Learning</span>
                </button>

                <button
                  id="view-details-active-btn"
                  onClick={() => onNavigate(`/roles/${activeRole.id}`)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm border border-gray-200 shadow-xs transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Other Enrolled Roles (Exact match to Screenshots 4 & 5) */}
        <div className="mb-14">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-lg mb-5">
            <GraduationCap className="w-5 h-5 text-gray-700" />
            <span>Other Enrolled Roles ({otherRoles.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherRoles.map((role) => {
              if (role.isLocked) {
                // Locked Role Card (Machine Learning Engineer)
                return (
                  <div
                    key={role.id}
                    className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-xs relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner with dark robotic image and central Lock Icon */}
                      <div className="relative h-40 w-full overflow-hidden bg-gray-900">
                        <img
                          src={role.bannerImage}
                          alt={role.title}
                          className="w-full h-full object-cover opacity-40 grayscale"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                            <Lock className="w-6 h-6" />
                          </div>
                        </div>

                        {/* Premium Badge */}
                        {role.badge && (
                          <div className="absolute top-3.5 right-3.5">
                            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                              <Award className="w-3.5 h-3.5" />
                              <span>{role.badge}</span>
                            </span>
                          </div>
                        )}

                        {/* Title & Category */}
                        <div className="absolute bottom-3 left-4 flex items-center gap-3">
                          {renderRoleIcon(role.iconType)}
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                              {role.title}
                            </h3>
                            <div className="text-xs text-gray-300 font-medium">
                              {role.category}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        {/* Notice Box */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-start gap-2.5 mb-4">
                          <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-gray-800">Role Locked</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {role.lockRequirement || 'Complete prerequisite courses to unlock'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Locked Button */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => setLockedModalRole(role)}
                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 hover:text-gray-600 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Locked</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Active switchable role card (UX/UI Designer, Full Stack Developer)
              return (
                <div
                  key={role.id}
                  className="rounded-2xl border border-gray-200/90 overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Banner */}
                    <div className="relative h-40 w-full overflow-hidden bg-gray-900">
                      <img
                        src={role.bannerImage}
                        alt={role.title}
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                      {/* Pro Badge */}
                      {role.badge && (
                        <div className="absolute top-3.5 right-3.5">
                          <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                            <Star className="w-3 h-3 fill-white" />
                            <span>{role.badge}</span>
                          </span>
                        </div>
                      )}

                      {/* Title & Category */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        {renderRoleIcon(role.iconType)}
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                            {role.title}
                          </h3>
                          <div className="text-xs text-gray-300 font-medium">
                            {role.category}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                      {/* Progress Row */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-gray-600">Progress</span>
                          <span className="font-bold text-[#8DB600]">{role.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#8DB600] rounded-full transition-all"
                            style={{ width: `${role.progress}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 font-medium">
                          {role.modulesCompleted} / {role.totalModules} modules
                        </div>
                      </div>

                      {/* 3 Stats Columns */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-center">
                        <div>
                          <div className="text-sm font-bold text-gray-800">{role.hoursSpent}h</div>
                          <div className="text-[11px] text-gray-500">Hours</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">{role.projectsDone}</div>
                          <div className="text-[11px] text-gray-500">Projects</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-800">{role.skillsCount}</div>
                          <div className="text-[11px] text-gray-500">Skills</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => handleSwitchRole(role.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca300] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Switch to This Role</span>
                    </button>

                    <button
                      onClick={() => onNavigate(`/roles/${role.id}`)}
                      title="View Role Details"
                      className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: Ready to Learn More? (Dashed Box - Exact match to Screenshots 5 & 6) */}
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-b from-gray-50/50 to-white p-8 sm:p-12 text-center my-10">
          {/* Top Circle Plus Icon */}
          <div className="w-14 h-14 rounded-full bg-lime-50 border-2 border-[#8DB600] text-[#8DB600] flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-xs">
            <Plus className="w-7 h-7" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Ready to Learn More?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-2 leading-relaxed">
            Explore 20+ career paths and add new roles to your learning journey. Build diverse skills and increase your job opportunities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6">
            <button
              id="cta-browse-careers-btn"
              onClick={() => onNavigate('/careers')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#8DB600] hover:bg-[#7ca300] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Browse All Careers</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              id="cta-view-jobs-btn"
              onClick={() => onNavigate('/opportunities')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm border border-gray-300 shadow-xs transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span>View Job Opportunities</span>
            </button>
          </div>
        </div>

        {/* SECTION: 3 Guidance & Best Practices Cards (Exact match to Screenshot 6) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
          {/* Card 1: Focus on One Role */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Focus on One Role</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Set one role as active to concentrate your learning efforts and track progress effectively.
            </p>
          </div>

          {/* Card 2: Complete Prerequisites */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Complete Prerequisites</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Unlock advanced roles by completing foundational learning paths first.
            </p>
          </div>

          {/* Card 3: Earn Certifications */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Earn Certifications</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Complete each role to earn verified certifications and showcase your skills.
            </p>
          </div>
        </div>

      </div>

      {/* Prerequisite / Locked Role Dialog Modal */}
      {lockedModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              {lockedModalRole.title} is Locked
            </h3>
            <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed">
              {lockedModalRole.lockRequirement || 'You must complete earlier foundational modules to unlock this role.'}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setLockedModalRole(null);
                  setActiveRoleId('data-analyst');
                  if (onShowToast) onShowToast('Switched to foundational Data Analyst track');
                }}
                className="w-full py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ca300] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Continue Data Analyst Prerequisite
              </button>
              <button
                onClick={() => setLockedModalRole(null)}
                className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyLearningRolesPage;
