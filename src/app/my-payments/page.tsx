"use client";
import React from "react";
import UserPaymentsPage from "@/views/UserPaymentsPage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Page() {
  const router = useRouter();
  const { currentUser } = useAuth();
  return (
    <UserPaymentsPage
      currentUser={currentUser}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
