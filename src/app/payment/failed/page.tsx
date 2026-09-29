"use client";
import React from "react";
import PaymentFailedPage from "@/views/PaymentFailedPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <PaymentFailedPage onNavigate={(path: string) => router.push(path)} />;
}
