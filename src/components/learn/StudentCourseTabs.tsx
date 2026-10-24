"use client";

import React from "react";
import {
  Video,
  HelpCircle,
  FolderArchive,
  Radio,
  FileBarChart,
  CreditCard,
} from "lucide-react";

export type CourseTabType =
  | "videos"
  | "quizzes"
  | "projects"
  | "live"
  | "report"
  | "reports"
  | "payment"
  | "project-report";

interface StudentCourseTabsProps {
  activeTab: CourseTabType;
  onChangeTab: (tab: CourseTabType) => void;
  counts?: {
    videos?: number;
    quizzes?: number;
    projects?: number;
    live?: number;
  };
}

export function StudentCourseTabs({
  activeTab,
  onChangeTab,
  counts,
}: StudentCourseTabsProps) {
  const tabs = [
    {
      id: "videos" as CourseTabType,
      label: "Videos",
      icon: Video,
      count: counts?.videos,
    },
    {
      id: "quizzes" as CourseTabType,
      label: "Quizzes",
      icon: HelpCircle,
      count: counts?.quizzes,
    },
    {
      id: "projects" as CourseTabType,
      label: "Projects",
      icon: FolderArchive,
      count: counts?.projects,
    },
    {
      id: "live" as CourseTabType,
      label: "Live Class",
      icon: Radio,
      count: counts?.live,
    },
    {
      id: "report" as CourseTabType,
      label: "Report",
      icon: FileBarChart,
    },
    {
      id: "payment" as CourseTabType,
      label: "Payment",
      icon: CreditCard,
    },
  ];

  return (
    <div className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#00C975] text-white shadow-md shadow-[#00C975]/25 font-bold"
                  : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
