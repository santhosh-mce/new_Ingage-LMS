"use client";

import { AdminLayout } from "@/admin/AdminLayout";
import { AdminCredentialEdgePage } from "@/admin/pages/AdminCredentialEdgePage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  return (
    <AdminLayout
      currentPath="/admin/credential-edge"
      onNavigate={(p: string) => router.push(p)}
      currentUser={currentUser}
      onLogout={async () => {
        await logout();
        router.push("/login");
      }}
    >
      <AdminCredentialEdgePage />
    </AdminLayout>
  );
}
