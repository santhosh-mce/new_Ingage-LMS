"use client";
import React from "react";
import ProfilePage from "@/views/ProfilePage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser } = useAuth();
  return (
    <ProfilePage
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
    />
  );
}
