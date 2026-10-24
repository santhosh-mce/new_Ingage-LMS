"use client";
import React, { useEffect } from "react";
import LandingPage from "@/views/LandingPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && currentUser) {
      const userRole = (currentUser.role || "").toUpperCase().trim();
      const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);
      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/my-courses");
      }
    }
  }, [isAuthenticated, isAuthLoading, currentUser, router]);

  if (!isAuthLoading && isAuthenticated && currentUser) {
    return null;
  }

  return <LandingPage onNavigate={(path: string) => router.push(path)} />;
}
