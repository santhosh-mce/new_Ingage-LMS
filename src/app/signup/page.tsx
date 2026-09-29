"use client";

import React from "react";
import { LandingPage } from "@/views/LandingPage";
import { useRouter } from "next/navigation";

export default function SignupRoute() {
  const router = useRouter();

  return (
    <LandingPage
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
