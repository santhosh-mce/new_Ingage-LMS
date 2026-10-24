"use client";

import React, { useState, useEffect } from "react";
import CourseDetailPage from "@/views/CourseDetailPage";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { StudentLayout } from "@/components/layout/StudentLayout";

export default function CourseDetailPageWrapper() {
  const router = useRouter();
  const params = useParams();
  const { currentUser, openAuthModal } = useAuth();
  const courseId = (params?.id as string) || "1";
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShowToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  if (!mounted) {
    return (
      <StudentLayout activePath="/my-courses" requireAuth={false}>
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading course syllabus and curriculum...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activePath="/my-courses" requireAuth={false}>
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-500 shadow-emerald-900/20'
                : toast.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-500 shadow-rose-900/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/20'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-white/70 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <CourseDetailPage
        courseId={courseId}
        currentUser={currentUser}
        onNavigate={(path: string) => router.push(path)}
        onOpenAuth={(mode?: 'login' | 'signup', redirectUrl?: string) => {
          openAuthModal(mode || 'login', redirectUrl || `/courses/${courseId}`);
        }}
        onShowToast={handleShowToast}
        embeddedInLayout={true}
      />
    </StudentLayout>
  );
}
