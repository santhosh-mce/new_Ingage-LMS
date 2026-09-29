"use client";

import { OAuthCallbackPage } from "@/views/OAuthCallbackPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <OAuthCallbackPage
      onNavigate={(path: string) => router.push(path)}
      onShowToast={(msg: string) => {
        if (typeof window !== "undefined") {
          console.log("[Toast]", msg);
        }
      }}
    />
  );
}
