"use client";
import React, { useEffect } from "react";
import MyLearningPage from "@/views/MyLearningPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.replace("/login?redirect=/my-learning");
        return;
      }
      const userRole = (currentUser?.role || "").toUpperCase().trim();
      const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);
      if (isAdmin) {
        router.replace("/admin");
      }
    }
  }, [currentUser, isAuthenticated, isAuthLoading, router]);

  if (
    !isAuthLoading &&
    (!isAuthenticated ||
      ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(
        (currentUser?.role || "").toUpperCase().trim()
      ))
  ) {
    return null;
  }

  return <MyLearningPage onNavigate={(path: string) => router.push(path)} />;
}
