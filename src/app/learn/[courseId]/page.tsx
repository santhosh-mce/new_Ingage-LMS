"use client";

import React, { useEffect } from "react";
import CourseLearnPage from "@/views/CourseLearnPage";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { StudentLayout } from "@/components/layout/StudentLayout";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading } = useAppSelector((state) => state.auth);
  const rawParam = params?.courseId ? String(params.courseId) : "1";
  const num = Number(rawParam);
  const courseId = !isNaN(num) ? num : rawParam;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/learn/${rawParam}`)}`);
    }
  }, [authLoading, isAuthenticated, router, rawParam]);

  return (
    <StudentLayout activePath="/my-courses" requireAuth={true}>
      <CourseLearnPage
        courseId={courseId}
        onNavigate={(path: string) => router.push(path)}
        embeddedInLayout={true}
      />
    </StudentLayout>
  );
}
