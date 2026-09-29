"use client";

import React from "react";
import { AdminCourseAnalyticsPage } from "@/admin/pages/AdminCourseAnalyticsPage";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminGeneralAnalyticsRoute() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/analytics"
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminCourseAnalyticsPage
        courseId="1"
        onNavigate={(path: string) => router.push(path)}
      />
    </AdminLayout>
  );
}
