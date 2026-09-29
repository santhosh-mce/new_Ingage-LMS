"use client";

import React from "react";
import { CredentialCourseDetailPage } from "@/views/CredentialCourseDetailPage";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CredentialEdgeDetailRoute() {
  const router = useRouter();
  const params = useParams();
  const { openAuthModal } = useAuth();
  const slug = (params?.slug as string) || "google-data-analytics";

  return (
    <CredentialCourseDetailPage
      slug={slug}
      onNavigate={(path: string, param?: string) => {
        if (param) router.push(`${path}/${param}`);
        else router.push(path);
      }}
      onOpenAuth={(mode?: 'login' | 'signup', redirectUrl?: string) => {
        openAuthModal(mode || 'login', redirectUrl || `/credential-edge/${slug}`);
      }}
    />
  );
}
