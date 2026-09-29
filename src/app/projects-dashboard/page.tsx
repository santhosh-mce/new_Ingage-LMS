"use client";

import React from "react";
import { MyProjectsPage } from "@/views/MyProjectsPage";
import { useRouter } from "next/navigation";

export default function ProjectsDashboardRoute() {
  const router = useRouter();

  return (
    <MyProjectsPage
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
