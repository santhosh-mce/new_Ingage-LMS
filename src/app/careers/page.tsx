"use client";
import React from "react";
import CareersPage from "@/views/CareersPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <CareersPage onNavigate={(path: string) => router.push(path)} />;
}
