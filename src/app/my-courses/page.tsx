"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  PlayCircle,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyEnrollments } from "@/store/slices/courseSlice";
import { UserEnrollmentRecord } from "@/api/paymentApi";

type CourseStatusTab = "all" | "in_progress" | "completed" | "not_started";

export default function MyCoursesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    enrollments,
    enrollmentsLoading: loading,
    enrollmentsError: error,
  } = useAppSelector((state) => state.course);

  const [activeTab, setActiveTab] = useState<CourseStatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  const counts = useMemo(() => {
    const all = enrollments.length;
    const inProgress = enrollments.filter(
      (e) =>
        e.status === "ACTIVE" &&
        (e.progressPercentage || 0) < 100 &&
        (e.progressPercentage || 0) > 0
    ).length;
    const completed = enrollments.filter(
      (e) =>
        e.status === "COMPLETED" ||
        (e.progressPercentage !== undefined && e.progressPercentage >= 100)
    ).length;
    const notStarted = enrollments.filter(
      (e) => (e.progressPercentage || 0) === 0 && e.status !== "COMPLETED"
    ).length;

    return { all, inProgress, completed, notStarted };
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      const title = item.courseTitle || "";
      const matchesSearch =
        !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase());

      const progress = item.progressPercentage || 0;
      const isCompleted = item.status === "COMPLETED" || progress >= 100;
      const isInProgress = item.status === "ACTIVE" && progress > 0 && progress < 100;
      const isNotStarted = progress === 0 && !isCompleted;

      let matchesTab = true;
      if (activeTab === "in_progress") matchesTab = isInProgress;
      if (activeTab === "completed") matchesTab = isCompleted;
      if (activeTab === "not_started") matchesTab = isNotStarted;

      return matchesSearch && matchesTab;
    });
  }, [enrollments, searchQuery, activeTab]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <StudentLayout activePath="/my-courses">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Courses
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track your learning journey, resume coursework, and access verified certificates.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover More Courses</span>
          </Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>All Courses</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("in_progress")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                activeTab === "in_progress"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>In Progress</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "in_progress" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {counts.inProgress}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                activeTab === "completed"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Completed</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "completed" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {counts.completed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("not_started")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                activeTab === "not_started"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Not Started</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === "not_started" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {counts.notStarted}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your courses..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-72 p-5 space-y-4">
                <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-2 bg-slate-200 rounded-full w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error Screen */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={() => dispatch(fetchMyEnrollments())}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEnrollments.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {searchQuery ? "No matching enrolled courses" : "You haven't enrolled in any courses yet"}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? "Check your spelling or reset the search query."
                : "Explore our rich course library to get started on your tech learning journey."}
            </p>
            <Link
              href="/discover"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20"
            >
              Browse Course Catalog
            </Link>
          </div>
        )}

        {/* Course Cards Grid */}
        {!loading && !error && filteredEnrollments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => {
              const courseId = enrollment.courseId;
              const courseTitle = enrollment.courseTitle || "Course";
              const instructor = enrollment.instructor || "InGage Faculty";
              const progress = enrollment.progressPercentage ?? 0;
              const isCompleted = enrollment.status === "COMPLETED" || progress >= 100;
              const totalLessons = enrollment.totalLessons ?? 0;
              const completedLessons =
                enrollment.completedLessons ?? Math.round((progress / 100) * (totalLessons || 1));
              const thumbnail = enrollment.thumbnail;

              // Dynamic real course route from backend courseId: /learn/[courseId]
              const learnRoute = `/learn/${courseId}`;

              // Button label: 0% -> Start Learning, >0 & <100 -> Continue Learning, 100% -> View Course
              const buttonText = isCompleted
                ? "View Course"
                : progress > 0
                ? "Continue Learning"
                : "Start Learning";

              return (
                <div
                  key={enrollment.id || courseId}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Card Top */}
                  <div>
                    {/* Thumbnail */}
                    <Link href={learnRoute} className="block relative aspect-video w-full bg-slate-900 overflow-hidden group">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt={courseTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#0A1224] to-emerald-950 p-4 text-center">
                          <GraduationCap className="w-10 h-10 text-emerald-400 mb-2" />
                          <span className="text-xs font-bold text-slate-300 line-clamp-1">
                            {courseTitle}
                          </span>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-md">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        ) : progress > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-md">
                            In Progress ({progress}%)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/90 text-slate-200 backdrop-blur-xs">
                            Not Started
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <Link href={learnRoute}>
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 hover:text-emerald-700 transition">
                            {courseTitle}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">Instructor: {instructor}</p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-600">Course Progress</span>
                          <span className="font-extrabold text-emerald-600">{progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-emerald-500"
                                : "bg-gradient-to-r from-emerald-500 to-teal-400"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(progress, 0))}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {totalLessons > 0
                              ? `${completedLessons}/${totalLessons} Lessons`
                              : `${completedLessons} Lessons`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(enrollment.lastAccessedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex gap-2">
                    <Link
                      href={learnRoute}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>{buttonText}</span>
                    </Link>

                    {isCompleted && (
                      <Link
                        href={`/certificates`}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="View Verified Certificate"
                      >
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Certificate</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
