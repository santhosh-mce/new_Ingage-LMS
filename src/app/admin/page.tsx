"use client";

import React from "react";
import AdminDashboardPage from "@/admin/pages/AdminDashboardPage";
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
      <AdminDashboardPage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
