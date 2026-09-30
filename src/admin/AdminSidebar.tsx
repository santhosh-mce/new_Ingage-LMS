"use client";
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  GraduationCap,
  Users,
  BriefcaseBusiness,
  Sparkles,
  Layers,
  CreditCard,
  Tag,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Target,
  Trophy,
} from 'lucide-react';

export interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SubNavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: SubNavItem[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      {
        name: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: 'COURSE MANAGEMENT',
    items: [
      {
        name: 'Courses',
        path: '/admin/courses',
        icon: BookOpen,
        children: [
          {
            name: 'InGage Courses',
            path: '/admin/courses/ingage',
            icon: BookOpen,
          },
          {
            name: 'Career Courses',
            path: '/admin/courses/career',
            icon: Target,
          },
          {
            name: 'Google Courses',
            path: '/admin/courses/google',
            icon: Trophy,
          },
        ],
      },
      {
        name: 'Categories',
        path: '/admin/categories',
        icon: FolderTree,
      },
      {
        name: 'Enrollments',
        path: '/admin/progress',
        icon: GraduationCap,
      },
      {
        name: 'Credential Edge',
        path: '/admin/credential-edge',
        icon: Award,
      },
    ],
  },

  {
    title: 'USER MANAGEMENT',
    items: [
      {
        name: 'Users',
        path: '/admin/users',
        icon: Users,
      },
    ],
  },

  {
    title: 'CAREER & OPPORTUNITY',
    items: [
      {
        name: 'Careers',
        path: '/admin/careers',
        icon: BriefcaseBusiness,
      },
      {
        name: 'Opportunities',
        path: '/admin/opportunities',
        icon: Sparkles,
      },
    ],
  },

  {
    title: 'PROJECT MANAGEMENT',
    items: [
      {
        name: 'Projects',
        path: '/admin/projects',
        icon: Layers,
      },
    ],
  },

  {
    title: 'PAYMENTS & DISCOUNTS',
    items: [
      {
        name: 'Payments',
        path: '/admin/payments',
        icon: CreditCard,
      },
      {
        name: 'Discounts',
        path: '/admin/discounts',
        icon: Tag,
      },
    ],
  },

  {
    title: 'CERTIFICATIONS',
    items: [
      {
        name: 'Certificates',
        path: '/admin/certificates',
        icon: Award,
      },
    ],
  },

  {
    title: 'SYSTEM',
    items: [
      {
        name: 'Settings',
        path: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  onNavigate,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  // Course dropdown state: auto-expand if on any course route
  const [coursesExpanded, setCoursesExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (currentPath.startsWith('/admin/courses')) {
      setCoursesExpanded(true);
    }
  }, [currentPath]);

  const isItemActive = (path: string): boolean => {
    // Dashboard
    if (path === '/admin') {
      return (
        currentPath === '/admin' ||
        currentPath === '/admin/' ||
        currentPath === '/admin/dashboard'
      );
    }

    // Enrollments
    if (path === '/admin/progress') {
      return (
        currentPath === '/admin/progress' ||
        currentPath === '/admin/enrollments'
      );
    }

    // Parent Courses item
    if (path === '/admin/courses') {
      return (
        currentPath === '/admin/courses' ||
        currentPath.startsWith('/admin/courses/')
      );
    }

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const isSubItemActive = (subPath: string): boolean => {
    if (subPath === '/admin/courses/ingage') {
      return (
        currentPath === '/admin/courses/ingage' ||
        currentPath === '/admin/courses' ||
        currentPath === '/admin/courses/'
      );
    }
    return currentPath === subPath || currentPath.startsWith(`${subPath}/`);
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  const toggleCoursesDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (collapsed) {
      onToggleCollapse(); // expand sidebar if currently collapsed
      setCoursesExpanded(true);
    } else {
      setCoursesExpanded((prev) => !prev);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-emerald-900/60 bg-[#08281a] text-slate-200 select-none">
      {/* =========================================================
          BRAND HEADER
      ========================================================= */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-emerald-900/50 px-4">
        {/* Brand Icon */}
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            border border-green-400/30
            bg-gradient-to-br from-green-500 to-emerald-700
            text-white
            shadow-md
            shadow-green-950/40
          "
        >
          <GraduationCap className="h-5 w-5" />
        </div>

        {/* Title */}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xl font-bold tracking-tight text-white">
                in<span className="text-lime-400">gage</span>
              </span>

              <span
                className="
                  shrink-0
                  rounded-md
                  border border-green-400/30
                  bg-green-500/15
                  px-1.5
                  py-0.5
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-green-300
                "
              >
                Admin
              </span>
            </div>

            <p className="mt-0.5 text-xs font-normal text-emerald-200/70">
              LMS Admin Panel
            </p>
          </div>
        )}

        {/* Mobile Close */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="
            ml-auto
            rounded-lg
            p-1.5
            text-emerald-300/70
            transition-colors
            hover:bg-white/10
            hover:text-white
            md:hidden
          "
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================= */}
      <nav
        className="
          flex-1
          overflow-y-auto
          px-2.5
          py-3
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-emerald-900
        "
      >
        <div className="space-y-4">
          {navGroups.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`} className="space-y-1">
              {/* Group title */}
              {group.title && !collapsed && (
                <p
                  className="
                    px-3
                    pb-1
                    pt-2
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-emerald-400/80
                  "
                >
                  {group.title}
                </p>
              )}

              {/* Navigation items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const active = isItemActive(item.path);

                // Normal Single-Item Button
                if (!hasChildren) {
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigation(item.path)}
                      title={collapsed ? item.name : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        ${active ? 'font-semibold' : 'font-medium'}
                        transition-all
                        duration-200

                        ${
                          active
                            ? `
                              bg-green-600
                              text-white
                              shadow-md
                              shadow-green-950/30
                            `
                            : `
                              text-emerald-100/75
                              hover:bg-white/[0.07]
                              hover:text-white
                            `
                        }

                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                    >
                      {/* Icon */}
                      <Icon
                        className={`
                          h-[18px]
                          w-[18px]
                          shrink-0
                          transition-colors
                          duration-200

                          ${
                            active
                              ? 'text-white'
                              : 'text-emerald-300/70 group-hover:text-green-300'
                          }
                        `}
                      />

                      {/* Label */}
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </button>
                  );
                }

                // Expandable Dropdown Item (Courses)
                return (
                  <div key={item.path} className="space-y-1">
                    <button
                      type="button"
                      onClick={
                        collapsed
                          ? () => handleNavigation('/admin/courses/ingage')
                          : toggleCoursesDropdown
                      }
                      title={collapsed ? item.name : undefined}
                      className={`
                        group
                        flex
                        w-full
                        items-center
                        justify-between
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        font-medium
                        transition-all
                        duration-200
                        cursor-pointer

                        ${
                          active && !collapsed
                            ? 'bg-white/[0.08] text-white font-semibold'
                            : active && collapsed
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-emerald-100/75 hover:bg-white/[0.07] hover:text-white'
                        }

                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`
                            h-[18px]
                            w-[18px]
                            shrink-0
                            transition-colors
                            duration-200
                            ${
                              active
                                ? 'text-green-300'
                                : 'text-emerald-300/70 group-hover:text-green-300'
                            }
                          `}
                        />

                        {!collapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </div>

                      {/* Chevron Arrow Toggle */}
                      {!collapsed && (
                        <span
                          onClick={toggleCoursesDropdown}
                          className="p-1 rounded-md hover:bg-white/10 text-emerald-300/70 group-hover:text-white transition-colors"
                        >
                          {coursesExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Sub-Items Menu Tree */}
                    {!collapsed && coursesExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-emerald-800/40 ml-5 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {item.children?.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = isSubItemActive(sub.path);

                          return (
                            <button
                              key={sub.path}
                              type="button"
                              onClick={() => handleNavigation(sub.path)}
                              className={`
                                flex
                                w-full
                                items-center
                                gap-2.5
                                rounded-lg
                                px-2.5
                                py-2
                                text-xs
                                transition-all
                                duration-150
                                cursor-pointer
                                ${
                                  subActive
                                    ? 'bg-green-600 text-white font-semibold shadow-xs'
                                    : 'text-emerald-200/70 hover:bg-white/[0.08] hover:text-white'
                                }
                              `}
                            >
                              <SubIcon
                                className={`
                                  h-3.5
                                  w-3.5
                                  shrink-0
                                  ${subActive ? 'text-white' : 'text-emerald-400/70'}
                                `}
                              />
                              <span className="truncate">{sub.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <div
        className="
          shrink-0
          space-y-1
          border-t
          border-emerald-900/50
          bg-[#062015]
          p-2.5
        "
      >
        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-sm
            font-medium
            text-emerald-200/75
            transition-colors

            hover:bg-rose-500/15
            hover:text-rose-200

            ${collapsed ? 'justify-center px-2' : ''}
          `}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />

          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse / Expand */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="
            hidden
            w-full
            items-center
            justify-center
            rounded-xl
            p-2
            text-emerald-300/60
            transition-colors
            hover:bg-white/[0.07]
            hover:text-white
            md:flex
          "
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-30
          hidden
          transition-all
          duration-300
          ease-in-out
          md:block

          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* =========================================================
          MOBILE BACKDROP
      ========================================================= */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/60
            backdrop-blur-sm
            transition-opacity
            md:hidden
          "
          aria-hidden="true"
        />
      )}

      {/* =========================================================
          MOBILE DRAWER
      ========================================================= */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-72
          max-w-[85vw]
          transform
          shadow-2xl
          transition-transform
          duration-300
          ease-in-out
          md:hidden

          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
