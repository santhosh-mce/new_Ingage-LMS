"use client";
import React from "react";
import MyLearningPage from "@/views/MyLearningPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <MyLearningPage onNavigate={(path: string) => router.push(path)} />;
}
