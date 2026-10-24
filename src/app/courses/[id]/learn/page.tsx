"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourseLearnPageWrapper() {
  const router = useRouter();
  const params = useParams();
  const rawParam = params?.id ? String(params.id) : "1";

  useEffect(() => {
    router.replace(`/learn/${rawParam}`);
  }, [router, rawParam]);

  return null;
}
