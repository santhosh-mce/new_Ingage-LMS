"use client";

import React from "react";
import { AdminContentStudioPage } from "@/admin/pages/AdminContentStudioPage";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminContentStudioRoute() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/content-studio"
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminContentStudioPage onNavigate={(path: string) => router.push(path)} />
    </AdminLayout>
  );
}
