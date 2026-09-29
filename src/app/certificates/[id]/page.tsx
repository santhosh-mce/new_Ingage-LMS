"use client";
import React from "react";
import CertificateDetailPage from "@/views/CertificateDetailPage";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const certId = (params?.id as string) || "1";
  return (
    <CertificateDetailPage
      certificateId={certId}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
