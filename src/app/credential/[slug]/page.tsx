"use client";

import React from "react";
import { CredentialCourseDetailPage } from "@/views/CredentialCourseDetailPage";
import { useParams, useRouter } from "next/navigation";

export default function CredentialDetailRoute() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "google-data-analytics";

  return (
    <CredentialCourseDetailPage
      slug={slug}
      onNavigate={(path: string, param?: string) => {
        if (param) router.push(`${path}/${param}`);
        else router.push(path);
      }}
    />
  );
}
