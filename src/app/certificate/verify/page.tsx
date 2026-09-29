"use client";

import { CertificateVerificationPage } from "@/views/CertificateVerificationPage";
import { useRouter } from "next/navigation";

export default function CertificateVerifyPage() {
  const router = useRouter();
  return <CertificateVerificationPage code="" onNavigate={(p: string) => router.push(p)} />;
}
