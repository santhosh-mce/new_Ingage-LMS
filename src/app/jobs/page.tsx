"use client";
import React from "react";
import OpportunitiesPage from "@/views/OpportunitiesPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser } = useAuth();
  return (
    <OpportunitiesPage
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
    />
  );
}
