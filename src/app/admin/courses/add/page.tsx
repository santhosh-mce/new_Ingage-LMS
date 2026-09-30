"use client";

import React, { Suspense } from "react";
import AdminAddCoursePage from "@/admin/pages/AdminAddCoursePage";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function AdminAddCourseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("id") || searchParams.get("courseId") || undefined;
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={courseId ? `/admin/courses/add?id=${courseId}` : "/admin/courses/add"}
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

export default function AdminAddCourseRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      }
    >
      <AdminAddCourseContent />
    </Suspense>
  );
}
