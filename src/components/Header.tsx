"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building2,
  ChevronDown,
  Briefcase,
  Rocket,
  ArrowRight,
  Command,
  User,
  LogOut,
  BookOpen,
  Award,
  Settings,
  Bell,
  Home,
  ArrowLeft,
  ChevronRight,
  Download,
  MessageSquare,
  HelpCircle,
  Lock,
  LogIn,
  UserPlus,
  CreditCard,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { getExploreData, CareerExploreItem, ProjectExploreItem } from '../api/exploreApi';
import { getCredentialCourses, CredentialCourseDto } from '../api/credentialApi';
import { getAccessibleImageUrl } from '../api/authApi';
import { UserProfile } from '../types';
import { useAppSelector } from '../store/hooks';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode: 'signup' | 'login') => void;
  onLogout?: () => void;
}

export function Header({ currentPath, onNavigate, currentUser: propUser, onOpenAuth, onLogout }: HeaderProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? (propUser || authUser) : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const exploreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const exploreCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [exploreCareers, setExploreCareers] = useState<CareerExploreItem[]>([]);
  const [exploreProjects, setExploreProjects] = useState<ProjectExploreItem[]>([]);
  const [exploreCredentialCourses, setExploreCredentialCourses] = useState<CredentialCourseDto[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  const fetchExploreData = async () => {
    setExploreLoading(true);
    setExploreError(null);
    try {
      const [data, credCourses] = await Promise.all([
        getExploreData().catch(() => ({ careers: [], projects: [] })),
        getCredentialCourses().catch(() => [])
      ]);
      setExploreCareers(data.careers || []);
      setExploreProjects(data.projects || []);
      setExploreCredentialCourses(credCourses || []);
    } catch (err: any) {
      setExploreError(err?.message || 'Failed to load Explore data');
    } finally {
      setExploreLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreData();
  }, []);

  const handleExploreMouseEnter = () => {
    if (exploreCloseTimeoutRef.current) {
      clearTimeout(exploreCloseTimeoutRef.current);
      exploreCloseTimeoutRef.current = null;
    }
    setExploreMenuOpen(true);
    if (exploreCareers.length === 0 && !exploreLoading) {
      fetchExploreData();
    }
  };

  const handleExploreMouseLeave = () => {
    exploreCloseTimeoutRef.current = setTimeout(() => {
      setExploreMenuOpen(false);
    }, 200);
  };

  const handleUserMouseEnter = () => {
    if (userCloseTimeoutRef.current) {
      clearTimeout(userCloseTimeoutRef.current);
      userCloseTimeoutRef.current = null;
    }
    setUserMenuOpen(true);
  };

  const handleUserMouseLeave = () => {
    userCloseTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Check '/' when not already in an input/textarea
      else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Check Escape to dismiss
      else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close explore menu & user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreMenuRef.current && !exploreMenuRef.current.contains(e.target as Node)) {
        setExploreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Job Roles from dynamic backend data
  const matchingRoles = searchQuery.trim()
    ? exploreCareers
      .filter(
        (role) =>
          role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 3)
    : [];

  // Filter Projects from dynamic backend data
  const matchingProjects = searchQuery.trim()
    ? exploreProjects
      .filter(
        (proj) =>
          proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (proj.industry && proj.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (proj.category && proj.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 3)
    : [];

  // Filter Credential Courses from dynamic backend data
  const matchingCredentialCourses = searchQuery.trim()
    ? exploreCredentialCourses
      .filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.credentialName && course.credentialName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 3)
    : [];

  const hasSuggestions = searchQuery.trim().length > 0 && (matchingRoles.length > 0 || matchingProjects.length > 0 || matchingCredentialCourses.length > 0);

  const handleSelectRole = (roleSlugOrId: string | number) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    onNavigate('/roles/' + roleSlugOrId, String(roleSlugOrId));
  };

  const handleSelectProject = (projSlugOrId: string | number) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    onNavigate('/projects', String(projSlugOrId));
  };

  const handleSelectCredentialCourse = (slug: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    onNavigate(`/credential-edge/${slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsDropdownOpen(false);
    // If top match is a role, navigate there, else project, else credential course, else careers
    if (matchingRoles.length > 0) {
      handleSelectRole(matchingRoles[0].slug || matchingRoles[0].id);
    } else if (matchingProjects.length > 0) {
      handleSelectProject(matchingProjects[0].slug || matchingProjects[0].id);
    } else if (matchingCredentialCourses.length > 0) {
      handleSelectCredentialCourse(matchingCredentialCourses[0].slug);
    } else {
      onNavigate('/careers');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      {/* Job Role Mode Top Banner (As shown in screenshot 1 & 7) */}
      {(currentPath === '/careers' || currentPath.startsWith('/roles/') || currentPath === '/opportunities' || currentPath === '/jobs') && (
        <div className="bg-[#1e3a8a] text-white text-xs sm:text-sm py-2 px-3 sm:px-6 lg:px-8 flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
            <Briefcase className="w-3.5 h-3.5 text-blue-200 shrink-0" />
            <span className="font-bold truncate">Job Role Mode</span>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <span className="text-blue-100 hidden sm:inline truncate">Career-focused learning with job readiness tracking</span>
          </div>
          <button
            onClick={() => onNavigate('/projects')}
            className="shrink-0 flex items-center gap-1 text-blue-100 hover:text-white hover:underline transition-colors cursor-pointer text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            <span className="hidden xs:inline sm:inline">Switch to </span>Project Mode
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Project Mode Top Banner (As shown in screenshots 3 & 4) */}
      {currentPath === '/projects' && (
        <div className="bg-purple-700 text-white text-xs sm:text-sm py-2 px-3 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-between font-medium w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate mr-2">
            <Rocket className="w-3.5 h-3.5 text-purple-200 shrink-0" />
            <span className="font-bold truncate">Project Mode</span>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <span className="text-purple-100 hidden sm:inline truncate">Learning-focused, no job placement pressure</span>
          </div>
          <button
            onClick={() => onNavigate('/careers')}
            className="shrink-0 flex items-center gap-1 text-purple-100 hover:text-white hover:underline transition-colors cursor-pointer text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            <span className="hidden xs:inline sm:inline">Switch to </span>Job Role Mode
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </button>
        </div>
      )}

      <div className="w-full px-3 sm:px-6 lg:px-10 xl:px-16 2xl:px-20 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Left Nav */}
        <div className="flex items-center gap-2 sm:gap-5 shrink-0">
          <button
            id="nav-logo-btn"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1 text-left cursor-pointer group focus:outline-none"
          >
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center">
              In<span className="text-lime-600">Gage</span>
            </span>
          </button>

          {/* Back & Home buttons (Only shown on inner pages, not on home page) */}
          {currentPath !== '/' && (
            <>
              {/* Vertical Divider */}
              <div className="hidden sm:block h-5 w-px bg-gray-200" />

              {/* Back Button */}
              <button
                id="nav-back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else if (currentPath.startsWith('/roles/')) {
                    onNavigate('/careers');
                  } else {
                    onNavigate('/');
                  }
                }}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Home Button */}
              <button
                id="nav-home-btn"
                onClick={() => onNavigate('/')}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                title="Home"
              >
                <Home className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </>
          )}

          {/* Explore Dropdown with Hover & Click */}
          <div
            className="relative"
            ref={exploreMenuRef}
            onMouseEnter={handleExploreMouseEnter}
            onMouseLeave={handleExploreMouseLeave}
          >
            <button
              id="nav-explore-btn"
              onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${exploreMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <span>Explore</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${exploreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {exploreMenuOpen && (
              <div
                id="explore-mega-menu"
                className="fixed left-2 right-2 top-16 sm:absolute sm:left-0 sm:right-auto sm:top-full mt-2 w-auto sm:w-[94vw] lg:w-[980px] xl:w-[1040px] max-w-[1040px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      Choose Your Learning Path
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      3 structured learning tracks to launch, advance, and certify your tech career
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-lime-700 bg-lime-50 px-2.5 py-1 rounded-full border border-lime-200/60 self-start sm:self-auto">
                    3 Tracks Available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                  {/* Column 1: Job-Ready Training (Career Compass) */}
                  <div className="flex flex-col h-full lg:pr-4 lg:border-r lg:border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-lime-600" />
                      <span className="text-base font-semibold text-gray-900">Job-Ready Training</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Career-focused programs with placement support
                    </p>

                    {/* Scrollable list of job roles */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1.5 scrollbar-thin flex-1">
                      {exploreLoading && exploreCareers.length === 0 ? (
                        <div className="space-y-2 py-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="h-7 bg-gray-100 animate-pulse rounded-lg w-full" />
                          ))}
                        </div>
                      ) : exploreError && exploreCareers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-red-500 bg-red-50 rounded-lg">
                          {exploreError}
                        </div>
                      ) : exploreCareers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                          No job-ready training available
                        </div>
                      ) : (
                        exploreCareers.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => {
                              setExploreMenuOpen(false);
                              onNavigate(`/roles/${role.slug || role.id}`, role.slug || String(role.id));
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:text-lime-700 hover:bg-lime-50/70 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform truncate">
                              {role.title}
                            </span>
                            {role.trending && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                Hot
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        id="btn-view-all-job-roles"
                        onClick={() => {
                          setExploreMenuOpen(false);
                          onNavigate('/careers');
                        }}
                        className="w-full py-2.5 px-4 bg-[#8DB600] hover:bg-[#7a9f00] text-white font-semibold text-sm rounded-xl text-center shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>View All Job Roles</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Column 2: Project-Based Learning (Skill Forge) */}
                  <div className="flex flex-col h-full lg:px-2 lg:border-r lg:border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="w-4 h-4 text-purple-600" />
                      <span className="text-base font-semibold text-gray-900">Project-Based Learning</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Build real projects at your own pace
                    </p>

                    {/* List of projects */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1.5 scrollbar-thin flex-1">
                      {exploreLoading && exploreProjects.length === 0 ? (
                        <div className="space-y-2 py-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="h-7 bg-gray-100 animate-pulse rounded-lg w-full" />
                          ))}
                        </div>
                      ) : exploreError && exploreProjects.length === 0 ? (
                        <div className="p-3 text-center text-xs text-red-500 bg-red-50 rounded-lg">
                          {exploreError}
                        </div>
                      ) : exploreProjects.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                          No projects available
                        </div>
                      ) : (
                        exploreProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => {
                              setExploreMenuOpen(false);
                              onNavigate('/projects', project.slug || String(project.id));
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50/70 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform truncate">
                              {project.title}
                            </span>
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                              {project.industry || project.category}
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        id="btn-browse-all-projects"
                        onClick={() => {
                          setExploreMenuOpen(false);
                          onNavigate('/projects');
                        }}
                        className="w-full py-2.5 px-4 bg-[#9333ea] hover:bg-[#7e22ce] text-white font-semibold text-sm rounded-xl text-center shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Browse All Projects</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Column 3: Credential Edge (Google Certified Courses) */}
                  <div className="flex flex-col h-full lg:pl-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="text-base font-semibold text-gray-900">Credential Edge</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                        Google Courses
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Google certified courses & career credentials
                    </p>

                    {/* List of Google Courses */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1.5 scrollbar-thin flex-1">
                      {exploreLoading && exploreCredentialCourses.length === 0 ? (
                        <div className="space-y-2 py-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="h-7 bg-gray-100 animate-pulse rounded-lg w-full" />
                          ))}
                        </div>
                      ) : exploreCredentialCourses.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 font-medium">
                          No Google courses available
                        </div>
                      ) : (
                        exploreCredentialCourses.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => {
                              setExploreMenuOpen(false);
                              onNavigate(`/credential-edge/${course.slug}`);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:text-blue-700 hover:bg-blue-50/70 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <span className="font-medium group-hover:translate-x-0.5 transition-transform truncate">
                              {course.title}
                            </span>
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0 ml-1 font-medium">
                              {course.category}
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        id="btn-browse-all-google-courses"
                        onClick={() => {
                          setExploreMenuOpen(false);
                          onNavigate('/credential-edge');
                        }}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl text-center shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Browse All Google Courses</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Courses */}
          <button
            id="nav-courses-btn"
            onClick={() => onNavigate('/courses')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${currentPath === '/courses' || currentPath.startsWith('/courses/')
                ? 'text-lime-700 bg-lime-50 font-semibold'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <BookOpen className="w-4 h-4 text-lime-600" />
            <span>Courses</span>
          </button>

          {/* For Employers */}
          <button
            id="nav-employers-btn"
            onClick={() => onNavigate('/employers')}
            className={`hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${currentPath === '/employers' ? 'text-lime-700 bg-lime-50 font-semibold' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Building2 className="w-4 h-4 text-gray-500" />
            <span>For Employers</span>
          </button>
        </div>

        {/* Center: Search Bar with Autocomplete & Keyboard Shortcut (Desktop/Tablet) */}
        <div className="hidden md:block flex-1 max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <input
                ref={searchInputRef}
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsFocused('search');
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onBlur={() => {
                  // Delay blur to allow clicks in dropdown
                  setTimeout(() => {
                    setIsDropdownOpen(false);
                    setIsFocused('');
                  }, 220);
                }}
                placeholder="Search job roles or projects..."
                className="w-full pl-5 pr-28 py-2.5 rounded-full border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 transition-all bg-gray-50/50 hover:bg-white"
              />

              {/* Keyboard Shortcut Indicator & Search Action Button */}
              <div className="absolute right-1.5 flex items-center gap-1.5">
                <kbd
                  onClick={() => searchInputRef.current?.focus()}
                  className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-2xs cursor-pointer hover:border-gray-300 hover:text-gray-600 transition-colors"
                  title="Press Cmd+K or / to search"
                >
                  {isMac ? '⌘' : 'Ctrl+'}K
                </kbd>
                <button
                  type="submit"
                  id="header-search-submit-btn"
                  className="w-8 h-8 rounded-full bg-[#8DB600] hover:bg-[#7a9f00] text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && hasSuggestions && (
            <div
              id="search-suggestions-dropdown"
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Job Roles Section (Green accents) */}
              {matchingRoles.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-lime-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Job Roles</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingRoles.map((role) => (
                      <button
                        key={role.id}
                        onMouseDown={() => handleSelectRole(role.id)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-lime-50/70 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-lime-100 text-lime-700 flex items-center justify-center text-xs">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-lime-800">
                              {role.title}
                            </div>
                            <div className="text-xs text-gray-500">{role.category} {((role as any).avgSalary || (role as any).salary) ? `• ${(role as any).avgSalary || (role as any).salary}` : ''}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-lime-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section (Purple accents) */}
              {matchingProjects.length > 0 && (
                <div className="p-3 bg-gray-50/40 border-b border-gray-100">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Hands-on Projects</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingProjects.map((proj) => (
                      <button
                        key={proj.id}
                        onMouseDown={() => handleSelectProject(proj.id)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50/70 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                            <Rocket className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-800">
                              {proj.title}
                            </div>
                            <div className="text-xs text-purple-600 font-medium">Project Track {((proj as any).difficulty || (proj as any).level) ? `• ${(proj as any).difficulty || (proj as any).level}` : ''}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Credential Edge Section (Blue accents) */}
              {matchingCredentialCourses.length > 0 && (
                <div className="p-3 bg-blue-50/30">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Credential Edge • Google Courses</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchingCredentialCourses.map((course) => (
                      <button
                        key={course.id}
                        onMouseDown={() => handleSelectCredentialCourse(course.slug)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/70 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-800">
                              {course.title}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">{course.category} • {course.level}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            id="mobile-search-toggle-btn"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Authenticated Navigation Links (Desktop) */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-3 sm:gap-6 md:border-r md:border-gray-200 md:pr-6">
              {/* My Learning Button */}
              <button
                id="nav-my-learning-btn"
                onClick={() => onNavigate('/my-learning')}
                className={`text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${currentPath === '/my-learning'
                    ? 'text-[#8DB600] font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                My Learning
              </button>

              {/* Opportunities Button */}
              <button
                id="nav-opportunities-btn"
                onClick={() => onNavigate('/opportunities')}
                className={`text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${currentPath === '/opportunities' || currentPath === '/jobs'
                    ? 'text-[#8DB600] font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Opportunities
              </button>
            </div>
          )}

          {/* Conditional Auth: Profile Avatar on Desktop & Mobile */}
          {currentUser ? (
            <div
              className="relative"
              ref={userMenuRef}
              onMouseEnter={handleUserMouseEnter}
              onMouseLeave={handleUserMouseLeave}
            >
              <div className="flex items-center gap-1 py-1">
                <button
                  id="nav-profile-btn"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate('/profile');
                  }}
                  className={`relative flex items-center justify-center rounded-full transition-all cursor-pointer focus:outline-none ${currentPath.startsWith('/profile')
                      ? 'ring-2 ring-[#8DB600] ring-offset-2'
                      : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  title="Go to Profile"
                  aria-label="Go to Profile"
                >
                  <img
                    src={getAccessibleImageUrl(currentUser?.avatarUrl) || "/profile-avatar.jpg"}
                    alt={currentUser?.name || "Profile"}
                    className="w-8 h-8 rounded-full object-cover shadow-xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&auto=format&fit=crop';
                    }}
                  />
                </button>

                <button
                  id="nav-profile-dropdown-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="hidden md:flex p-1 -ml-1 text-gray-400 hover:text-gray-700 cursor-pointer rounded transition-colors focus:outline-none items-center justify-center"
                  aria-label="Toggle profile menu"
                  aria-expanded={userMenuOpen}
                >
                  <svg
                    className={`w-2 h-2 fill-current text-gray-400 hover:text-gray-600 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#8DB600]' : ''
                      }`}
                    viewBox="0 0 10 6"
                  >
                    <path d="M0 0l5 6 5-6z" />
                  </svg>
                </button>
              </div>

              {/* Profile Dropdown Menu Card (Desktop) */}
              {userMenuOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Section 1: Profile, Certificates, Download Center */}
                  <div className="px-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('/profile');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-700" />
                      <span>Profile</span>
                    </button>

                    <div className="pl-6 space-y-0.5 mt-0.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/profile/certificates');
                        }}
                        className="w-full text-left px-3 py-1 rounded-md text-xs text-gray-600 hover:text-[#8DB600] hover:bg-lime-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-gray-500" />
                        <span>Certificates</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/credential-edge/credentials');
                        }}
                        className="w-full text-left px-3 py-1 rounded-md text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>My Credentials</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/profile/downloads');
                        }}
                        className="w-full text-left px-3 py-1 rounded-md text-xs text-gray-600 hover:text-[#8DB600] hover:bg-lime-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                        <span>Download Center</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/user/payments');
                        }}
                        className="w-full text-left px-3 py-1 rounded-md text-xs text-gray-600 hover:text-[#8DB600] hover:bg-lime-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        <span>Payment History</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-2 border-t border-gray-100" />

                  {/* Section 2: My Tickets, Help Center */}
                  <div className="px-2 space-y-0.5">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('/profile/tickets');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-700" />
                      <span>My Tickets</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('/profile/help');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-700" />
                      <span>Help Center</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-2 border-t border-gray-100" />

                  {/* Section 3: Account Settings, Password Reset */}
                  <div className="px-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('/profile/settings');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-gray-700" />
                      <span>Account Settings</span>
                    </button>

                    <div className="pl-6 space-y-0.5 mt-0.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('/profile/reset-password');
                        }}
                        className="w-full text-left px-3 py-1 rounded-md text-xs text-gray-600 hover:text-[#8DB600] hover:bg-lime-50/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                        <span>Password Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Console Quick Link if role is Admin */}
                  {(currentUser.role === 'ADMIN' || currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                    <>
                      <div className="my-2 border-t border-gray-100" />
                      <div className="px-2">
                        <button
                          id="nav-profile-admin-btn"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('/admin');
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-lime-700 bg-lime-50 hover:bg-lime-100/80 flex items-center gap-2.5 transition-colors cursor-pointer border border-lime-200/60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                          <span>Admin Control Center</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sign out */}
                  <div className="my-2 border-t border-gray-100" />
                  <div className="px-2">
                    <button
                      id="nav-profile-signout-btn"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out ({currentUser.name})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Log In and Sign Up buttons on Desktop (hidden on mobile, visible in mobile drawer) */
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
              <button
                id="nav-login-btn"
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('login');
                  } else {
                    onNavigate('/login');
                  }
                }}
                className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-gray-500" />
                <span>Log In</span>
              </button>

              <button
                id="nav-signup-btn"
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('signup');
                  } else {
                    onNavigate('/signup');
                  }
                }}
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-[#8DB600] hover:bg-[#7a9f00] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar (Only visible when mobileSearchOpen is true on < md) */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 py-3 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={(e) => { handleSearchSubmit(e); setMobileSearchOpen(false); }} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job roles, projects..."
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-1.5 w-7 h-7 rounded-lg bg-[#8DB600] text-white flex items-center justify-center shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Slide-out / Collapsible Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 sm:top-[72px] bottom-0 bg-white/98 backdrop-blur-md z-50 overflow-y-auto px-5 py-6 pb-12 flex flex-col justify-between border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Quick Links */}
            <div className="space-y-1">
              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath === '/' ? 'bg-lime-50 text-lime-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Home className="w-4 h-4 text-lime-600" />
                <span>Home</span>
              </button>

              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/courses'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath === '/courses' || currentPath.startsWith('/courses/') ? 'bg-lime-50 text-lime-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <BookOpen className="w-4 h-4 text-lime-600" />
                <span>Courses</span>
              </button>

              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/careers'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath === '/careers' || currentPath.startsWith('/roles/') ? 'bg-lime-50 text-lime-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Briefcase className="w-4 h-4 text-lime-600" />
                <span>Job Roles</span>
              </button>

              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/projects'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath === '/projects' ? 'bg-purple-50 text-purple-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Rocket className="w-4 h-4 text-purple-600" />
                <span>Projects</span>
              </button>

              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/credential-edge'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath.startsWith('/credential-edge') ? 'bg-blue-50 text-blue-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Award className="w-4 h-4 text-blue-600" />
                <span>Credential Edge</span>
              </button>

              <button
                onClick={() => { setMobileNavOpen(false); onNavigate('/employers'); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currentPath === '/employers' ? 'bg-lime-50 text-lime-700' : 'text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>For Employers</span>
              </button>
            </div>

            {/* Authenticated Links in Mobile Drawer */}
            {currentUser && (
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <div className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  My Account
                </div>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/my-learning'); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-lime-600" />
                    My Learning
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/credential-edge/credentials'); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    My Credentials
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/opportunities'); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-lime-600" />
                    Opportunities
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/profile'); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-600" />
                    View Profile
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => { setMobileNavOpen(false); onNavigate('/user/payments'); }}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                    Payment History
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Actions: Sign Out or Log In / Sign Up */}
          <div className="pt-6 border-t border-gray-100">
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out ({currentUser.name})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    if (onOpenAuth) onOpenAuth('login');
                    else onNavigate('/login');
                  }}
                  className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl text-center transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    if (onOpenAuth) onOpenAuth('signup');
                    else onNavigate('/signup');
                  }}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white bg-[#8DB600] hover:bg-[#7a9f00] rounded-xl text-center shadow-xs transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
