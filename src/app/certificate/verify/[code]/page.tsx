"use client";
import React from "react";
import CertificateVerificationPage from "@/views/CertificateVerificationPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return <CertificateVerificationPage onNavigate={(path: string) => router.push(path)} />;
}
