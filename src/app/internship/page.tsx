"use client";
import React from "react";
import InternshipPage from "@/views/InternshipPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <InternshipPage onNavigate={(path: string) => router.push(path)} />;
}
