"use client";

import React from "react";
import AdminAddCoursePage from "@/admin/pages/AdminAddCoursePage";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={typeof window !== "undefined" ? window.location.pathname : "/admin"}
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminAddCoursePage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
