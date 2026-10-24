"use client";

import React from "react";
import ProfilePage from "@/views/ProfilePage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LearningReportsRoute() {
  const router = useRouter();
  const { currentUser } = useAuth();

  return (
    <ProfilePage
      initialTab="learning"
      currentUser={currentUser}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
