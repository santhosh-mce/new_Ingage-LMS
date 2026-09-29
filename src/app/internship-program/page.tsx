"use client";
import React from "react";
import InternshipProgramPage from "@/views/InternshipProgramPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <InternshipProgramPage onNavigate={(path: string) => router.push(path)} />;
}
