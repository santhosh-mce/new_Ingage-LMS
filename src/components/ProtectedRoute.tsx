"use client";
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  intendedPath: string;
  pageTitle?: string;
  userRole?: string | null;
  requiredRole?: 'ADMIN' | 'STUDENT';
  onRequireAuth: (intendedPath: string, pageTitle?: string) => void;
  onNavigate: (path: string) => void;
}

export function ProtectedRoute({
  isAuthenticated,
  isLoading = false,
  children,
  intendedPath,
  pageTitle,
  userRole,
  requiredRole,
  onRequireAuth,
  onNavigate
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        onRequireAuth(intendedPath, pageTitle);
        onNavigate('/login');
        return;
      }

      const roleUpper = (userRole || '').toUpperCase().trim();
      const isAdmin = ['ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(roleUpper);

      if (requiredRole === 'ADMIN' && !isAdmin) {
        onNavigate('/my-courses');
      } else if (requiredRole === 'STUDENT' && isAdmin) {
        onNavigate('/admin');
      }
    }
  }, [isAuthenticated, isLoading, intendedPath, pageTitle, userRole, requiredRole, onRequireAuth, onNavigate]);

  if (isLoading) {
    return (
      <div className="w-full bg-white flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-lime-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const roleUpper = (userRole || '').toUpperCase().trim();
  const isAdmin = ['ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(roleUpper);
  if (requiredRole === 'ADMIN' && !isAdmin) {
    return null;
  }
  if (requiredRole === 'STUDENT' && isAdmin) {
    return null;
  }

  return <>{children}</>;
}

