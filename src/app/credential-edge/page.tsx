"use client";

import React from "react";
import { CredentialEdgePage } from "@/views/CredentialEdgePage";
import { useRouter } from "next/navigation";

export default function CredentialEdgeRoute() {
  const router = useRouter();

  return (
    <CredentialEdgePage
      onNavigate={(path: string, param?: string) => {
        if (param) router.push(`${path}/${param}`);
        else router.push(path);
      }}
    />
  );
}
