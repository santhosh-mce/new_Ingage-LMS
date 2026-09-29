"use client";
import React from "react";
import PaymentSuccessPage from "@/views/PaymentSuccessPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <PaymentSuccessPage onNavigate={(path: string) => router.push(path)} />;
}
