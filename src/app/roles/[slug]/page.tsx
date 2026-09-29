"use client";

import React from "react";
import { CareerDetailPage } from "@/views/CareerDetailPage";
import { useParams, useRouter } from "next/navigation";

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "data-analyst";

  return (
    <CareerDetailPage
      roleId={slug}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
