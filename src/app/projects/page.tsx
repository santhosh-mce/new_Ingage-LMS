"use client";
import React from "react";
import ProjectsPage from "@/views/ProjectsPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser } = useAuth();
  return (
    <ProjectsPage
      onNavigate={(path: string) => router.push(path)}
      currentUser={currentUser}
    />
  );
}
