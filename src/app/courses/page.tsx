"use client";
import React from "react";
import CoursesPage from "@/views/CoursesPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <CoursesPage onNavigate={(path: string) => router.push(path)} />;
}
