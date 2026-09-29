"use client";

import { AdminLayout } from "@/admin/AdminLayout";
import { AdminCourseProgressPage } from "@/admin/pages/AdminCourseProgressPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/enrollments"
      onNavigate={(p: string) => router.push(p)}
      currentUser={currentUser}
      onLogout={async () => {
        await logout();
        router.push("/login");
      }}
    >
      <AdminCourseProgressPage onNavigate={(p: string) => router.push(p)} />
    </AdminLayout>
  );
}
