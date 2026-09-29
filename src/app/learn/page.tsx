"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LearnIndexRoute() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/learn/5");
  }, [router]);
  return null;
}
