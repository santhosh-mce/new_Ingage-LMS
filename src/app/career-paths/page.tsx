"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CareerPathsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/careers");
  }, [router]);

  return null;
}
