"use client";

import React from "react";
import ProfilePage from "@/views/ProfilePage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SettingsRoute() {
  const router = useRouter();
  const { currentUser } = useAuth();

  return (
    <ProfilePage
      initialTab="settings"
      currentUser={currentUser}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
