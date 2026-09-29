"use client";

import React from "react";
import { AdminUserDetailsPage } from "@/admin/pages/AdminUserDetailsPage";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/admin/AdminLayout";
import { useAuth } from "@/context/AuthContext";

export default function AdminUserDetailsRoute() {
  const router = useRouter();
  const params = useParams();
  const userId = (params?.id as string) || "1";
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath={`/admin/users/${userId}`}
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
      onLogout={logout}
    >
      <AdminUserDetailsPage
        userId={userId}
        onNavigate={(path: string) => router.push(path)}
      />
    </AdminLayout>
  );
}
