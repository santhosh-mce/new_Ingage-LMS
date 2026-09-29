"use client";

import React from "react";
import AdminCareersPage from "@/admin/pages/AdminCareersPage";
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
      <AdminCareersPage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
