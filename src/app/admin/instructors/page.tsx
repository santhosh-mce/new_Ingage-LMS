"use client";

import React from "react";
import AdminUsersPage from "@/admin/pages/AdminUsersPage";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminInstructorsRoute() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/instructors"
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminUsersPage
        onNavigate={(path: string) => router.push(path)}
        currentUser={currentUser}
        initialRoleFilter="INSTRUCTOR"
      />
    </AdminLayout>
  );
}
