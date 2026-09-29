"use client";

import React from "react";
import { MyLearningRolesPage } from "@/views/MyLearningRolesPage";
import { useRouter } from "next/navigation";

export default function MyRolesRoute() {
  const router = useRouter();

  return (
    <MyLearningRolesPage
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
