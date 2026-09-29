"use client";
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  intendedPath: string;
  pageTitle?: string;
  onRequireAuth: (intendedPath: string, pageTitle?: string) => void;
  onNavigate: (path: string) => void;
}

export function ProtectedRoute({
  isAuthenticated,
  isLoading = false,
  children,
  intendedPath,
  pageTitle,
  onRequireAuth,
  onNavigate
}: ProtectedRouteProps) {
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onRequireAuth(intendedPath, pageTitle);
      if (intendedPath.startsWith('/admin')) {
        onNavigate('/login');
      } else {
        onNavigate('/');
      }
    }
  }, [isAuthenticated, isLoading, intendedPath, pageTitle, onRequireAuth, onNavigate]);

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

  return <>{children}</>;
}

