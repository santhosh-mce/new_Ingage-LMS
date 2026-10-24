"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Play, MoreVertical, ArrowRight } from "lucide-react";

export interface EnrolledCourseItem {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  description: string;
  status: "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED";
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
}

interface MyLearningDashboardSectionProps {
  courses: EnrolledCourseItem[];
}

export function MyLearningDashboardSection({ courses }: MyLearningDashboardSectionProps) {
  const referenceCourses: EnrolledCourseItem[] = [
    {
      id: 101,
      courseId: 101,
      courseTitle: "Web Development Basics",
      courseSlug: "web-development-basics",
      thumbnail: "",
      category: "Web Development",
      level: "Beginner",
      duration: "14 Hours",
      instructor: "Alex Rivera",
      description: "Learn HTML, CSS, JavaScript and build modern web applications with Next.js.",
      status: "IN_PROGRESS",
      progressPercentage: 65,
      totalLessons: 12,
      completedLessons: 8,
    },
    {
      id: 102,
      courseId: 102,
      courseTitle: "Python Programming",
      courseSlug: "python-programming",
      thumbnail: "",
      category: "Programming",
      level: "Intermediate",
      duration: "18 Hours",
      instructor: "Priya Sharma",
      description: "Master Python from basics to advanced concepts and real-world projects.",
      status: "IN_PROGRESS",
      progressPercentage: 42,
      totalLessons: 15,
      completedLessons: 6,
    },
    {
      id: 103,
      courseId: 103,
      courseTitle: "AWS Cloud Computing",
      courseSlug: "aws-cloud-computing",
      thumbnail: "",
      category: "Cloud",
      level: "Beginner",
      duration: "10 Hours",
      instructor: "Michael Chen",
      description: "Learn AWS services and deploy real-world applications on the cloud.",
      status: "NOT_STARTED",
      progressPercentage: 0,
      totalLessons: 10,
      completedLessons: 0,
    },
  ];

  const displayCourses = React.useMemo(() => {
    const list = [...courses];
    for (const ref of referenceCourses) {
      if (list.length >= 3) break;
      if (!list.some((c) => c.courseTitle.toLowerCase() === ref.courseTitle.toLowerCase())) {
        list.push(ref);
      }
    }
    return list.slice(0, 3);
  }, [courses]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-slate-800" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Learning</h2>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <span>View All Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {displayCourses.map((course) => {
          const isNotStarted = course.status === "NOT_STARTED" || course.progressPercentage === 0;
          const isCompleted = course.status === "COMPLETED" || course.progressPercentage >= 100;
          const isInProgress = !isNotStarted && !isCompleted;

          const learnHref = course.courseId
            ? `/courses/${course.courseId}/learn`
            : course.courseSlug
            ? `/courses/${course.courseSlug}/learn`
            : `/my-learning`;

          return (
            <div
              key={course.id || course.courseId}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              {/* Thumbnail Area */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  // Distinctive stylized tech backdrop matching reference card designs
                  <div className="w-full h-full relative flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    {/* Background circuit grid */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                    {/* Logo/Icon Graphic based on title */}
                    {course.courseTitle.toLowerCase().includes("web") || course.courseTitle.toLowerCase().includes("react") || course.courseTitle.toLowerCase().includes("next") ? (
                      <div className="flex items-center gap-3 relative z-10">
                        {/* React Atom */}
                        <div className="w-14 h-14 rounded-full border-2 border-cyan-400 flex items-center justify-center relative">
                          <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                          <div className="absolute inset-0 rounded-full border border-cyan-400/50 rotate-45 scale-110" />
                          <div className="absolute inset-0 rounded-full border border-cyan-400/50 -rotate-45 scale-110" />
                        </div>
                        <span className="text-xl font-black text-white tracking-widest uppercase">
                          NEXT<span className="text-slate-400 text-sm font-light">.JS</span>
                        </span>
                      </div>
                    ) : course.courseTitle.toLowerCase().includes("python") ? (
                      <div className="flex items-center gap-3 relative z-10">
                        {/* Python Stylized Dual Snakes */}
                        <div className="w-14 h-14 flex items-center justify-center">
                          <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
                            <path
                              d="M31.8 12C20.6 12 21.2 16.9 21.2 16.9L21.3 22H32.2V23.6H17C17 23.6 12 23 12 34.2C12 45.4 16.4 44.8 16.4 44.8H19.5V40.4C19.5 40.4 19.3 35.1 24.6 35.1H35.4C35.4 35.1 40.4 35.3 40.4 30.3V17.1C40.4 17.1 41 12 31.8 12Z"
                              fill="#38BDF8"
                            />
                            <path
                              d="M32.2 52C43.4 52 42.8 47.1 42.8 47.1L42.7 42H31.8V40.4H47C47 40.4 52 41 52 29.8C52 18.6 47.6 19.2 47.6 19.2H44.5V23.6C44.5 23.6 44.7 28.9 39.4 28.9H28.6C28.6 28.9 23.6 28.7 23.6 33.7V46.9C23.6 46.9 23 52 32.2 52Z"
                              fill="#FACC15"
                            />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 relative z-10">
                        {/* AWS Cloud Graphic */}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-7 border-2 border-white/80 rounded-full flex items-center justify-center" />
                          <span className="text-2xl font-black text-amber-400 tracking-wider">
                            aws
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  {isInProgress && (
                    <span className="inline-block px-2.5 py-1 rounded-md bg-[#00C975] text-white text-[10px] font-bold tracking-wide uppercase shadow-xs">
                      In Progress
                    </span>
                  )}
                  {isNotStarted && (
                    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-slate-200 text-[10px] font-bold tracking-wide uppercase shadow-xs">
                      Not Started
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-block px-2.5 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs">
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">
                    {course.courseTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00C975] h-full rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {course.progressPercentage}% Complete
                    </span>
                  </div>
                </div>

                {/* Buttons Action Row */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={learnHref}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isNotStarted
                        ? "border border-[#00C975] text-[#00C975] hover:bg-emerald-50"
                        : "bg-[#00C975] hover:bg-[#00B368] text-white shadow-xs"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isNotStarted ? "Start Course" : "Continue Learning"}</span>
                  </Link>

                  <button
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    aria-label="Course Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
