"use client";
import React from 'react';
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
  X,
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

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
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

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleNavigation = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-emerald-900/60 bg-[#08281a] text-slate-200 select-none">

      {/* =========================================================
          BRAND HEADER
      ========================================================= */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-emerald-900/50 px-4">

        {/* Logo */}
        <div
          className="
            grid h-10 w-10 shrink-0 place-items-center
            rounded-xl
            bg-green-600
            text-white
            shadow-lg shadow-green-950/40
          "
        >
          <GraduationCap className="h-5 w-5" />
        </div>

        {/* Brand */}
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
              {group.items.map(({ name, path, icon: Icon }) => {
                const active = isItemActive(path);

                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => handleNavigation(path)}
                    title={collapsed ? name : undefined}
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

                      ${active
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

                        ${active
                          ? 'text-white'
                          : 'text-emerald-300/70 group-hover:text-green-300'
                        }
                      `}
                    />

                    {/* Label */}
                    {!collapsed && (
                      <span className="truncate">
                        {name}
                      </span>
                    )}

                  </button>
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

          {!collapsed && (
            <span>
              Logout
            </span>
          )}
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

          ${mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          }
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;