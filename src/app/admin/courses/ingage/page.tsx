'use client';

import React from 'react';
import AdminInGageCoursesPage from '@/admin/pages/AdminInGageCoursesPage';
import { useRouter, usePathname } from 'next/navigation';
import { AdminLayout } from '@/admin/AdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function AdminRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={pathname || '/admin/courses/ingage'}
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminInGageCoursesPage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
