"use client";
import React from "react";
import CourseLearnPage from "@/views/CourseLearnPage";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const rawParam = params?.courseId ? String(params.courseId) : "1";
  const num = Number(rawParam);
  const courseId = !isNaN(num) ? num : rawParam;

  return (
    <CourseLearnPage
      courseId={courseId}
      onNavigate={(path: string) => router.push(path)}
    />
  );
}
