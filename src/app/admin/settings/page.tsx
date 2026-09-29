"use client";

import React from "react";
import AdminSettingsPage from "@/admin/pages/AdminSettingsPage";
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
      <AdminSettingsPage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
