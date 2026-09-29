"use client";

import React from "react";
import { MyCredentialsPage } from "@/views/MyCredentialsPage";
import { useRouter } from "next/navigation";

export default function CredentialEdgeCredentialsRoute() {
  const router = useRouter();

  return (
    <MyCredentialsPage
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
