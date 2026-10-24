"use client";

import React from "react";
import { CertificateVerificationPage } from "@/views/CertificateVerificationPage";
import { useParams, useRouter } from "next/navigation";

export default function CertificateVerifyWithCodePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string) || "";

  return (
    <CertificateVerificationPage
      code={code}
      onNavigate={(p: string) => router.push(p)}
    />
  );
}
