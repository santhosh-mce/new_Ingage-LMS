"use client";

import React from "react";
import AdminAddCoursePage from "@/admin/pages/AdminAddCoursePage";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminCourseEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={`/admin/courses/${courseId}/edit`}
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminAddCoursePage
        courseId={courseId}
        onNavigate={(path: string) => router.push(path)}
      />
    </AdminLayout>
  );
}
