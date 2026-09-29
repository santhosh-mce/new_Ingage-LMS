"use client";
import React from "react";
import MyProjectsPage from "@/views/MyProjectsPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser } = useAuth();
  return <MyProjectsPage onNavigate={(path: string) => router.push(path)} currentUser={currentUser} />;
}
