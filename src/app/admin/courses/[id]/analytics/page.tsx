"use client";

import React from "react";
import { AdminCourseAnalyticsPage } from "@/admin/pages/AdminCourseAnalyticsPage";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminCourseAnalyticsRoute() {
  const router = useRouter();
  const params = useParams();
  const courseId = (params?.id as string) || "1";
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={`/admin/courses/${courseId}/analytics`}
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminCourseAnalyticsPage
        courseId={courseId}
        onNavigate={(path: string) => router.push(path)}
      />
    </AdminLayout>
  );
}
