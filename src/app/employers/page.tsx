"use client";
import React from "react";
import EmployersPage from "@/views/EmployersPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <EmployersPage onNavigate={(path: string) => router.push(path)} />;
}
