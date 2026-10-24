"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AdminLoginRoute() {
  const router = useRouter();
  const { currentUser, openAuthModal } = useAuth();

  useEffect(() => {
    const userRole = (currentUser?.role || "").toUpperCase().trim();
    const isAdmin = ["ADMIN", "ROLE_ADMIN", "SUPER_ADMIN", "ADMINISTRATOR"].includes(userRole);

    if (currentUser) {
      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/my-courses");
      }
    } else {
      openAuthModal("login", "/admin");
    }
  }, [currentUser, openAuthModal, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo role="ADMIN" variant="login" theme="dark" showTagline={true} />
        </div>
        <p className="text-sm text-slate-400">
          Redirecting to InGage EduTech Admin Portal authentication...
        </p>
      </div>
    </div>
  );
}
