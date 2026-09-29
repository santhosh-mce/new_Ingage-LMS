"use client";

import React, { useState, useEffect } from "react";
import CourseDetailPage from "@/views/CourseDetailPage";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CourseDetailPageWrapper() {
  const router = useRouter();
  const params = useParams();
  const { currentUser, openAuthModal } = useAuth();
  const courseId = (params?.id as string) || "1";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-8 h-8 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading course syllabus and curriculum...</p>
      </div>
    );
  }

  return (
    <CourseDetailPage
      courseId={courseId}
      currentUser={currentUser}
      onNavigate={(path: string) => router.push(path)}
      onOpenAuth={(mode?: 'login' | 'signup', redirectUrl?: string) => {
        openAuthModal(mode || 'login', redirectUrl || `/courses/${courseId}`);
      }}
    />
  );
}
