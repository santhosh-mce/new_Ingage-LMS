"use client";

import React, { useState, useEffect } from "react";
import CareerDetailPage from "@/views/CareerDetailPage";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CareerPathsPageWrapper() {
  const router = useRouter();
  const params = useParams();
  const { currentUser, openAuthModal } = useAuth();
  const slug = (params?.slug as string) || "machine-learning-engineer";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-8 h-8 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading Career Path curriculum...</p>
      </div>
    );
  }

  return (
    <CareerDetailPage
      roleId={slug}
      currentUser={currentUser}
      onNavigate={(p: string) => router.push(p)}
      onOpenAuth={(mode?: 'login' | 'signup', redirectUrl?: string) => {
        openAuthModal(mode || 'login', redirectUrl || `/career-paths/${slug}`);
      }}
    />
  );
}
