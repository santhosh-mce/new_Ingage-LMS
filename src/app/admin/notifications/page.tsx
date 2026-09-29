"use client";

import React from "react";
import { AdminActivityLogsPage } from "@/admin/pages/AdminActivityLogsPage";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminNotificationsRoute() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/notifications"
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminActivityLogsPage />
    </AdminLayout>
  );
}
