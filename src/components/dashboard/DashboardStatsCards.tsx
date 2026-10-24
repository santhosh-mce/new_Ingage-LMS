"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  PlayCircle,
  ClipboardList,
  Award,
  ChevronRight,
} from "lucide-react";

interface StatsData {
  enrolledCourses: number;
  completedLessons: number;
  totalLessons: number;
  pendingAssignments: number;
  certificatesEarned: number;
}

interface DashboardStatsCardsProps {
  stats: StatsData;
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const cards = [
    {
      id: "enrolled",
      title: "Enrolled Courses",
      value: stats.enrolledCourses,
      subtitle: "Total courses enrolled",
      icon: GraduationCap,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-500/10",
      href: "/my-learning",
    },
    {
      id: "lessons",
      title: "Completed Lessons",
      value: stats.completedLessons,
      subtitle: `Out of ${stats.totalLessons} lessons`,
      icon: PlayCircle,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-500/10",
      href: "/my-learning",
    },
    {
      id: "assignments",
      title: "Pending Assignments",
      value: stats.pendingAssignments,
      subtitle: "To be completed",
      icon: ClipboardList,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-500/10",
      href: "/my-learning",
    },
    {
      id: "certificates",
      title: "Certificates Earned",
      value: stats.certificatesEarned,
      subtitle: "So far",
      icon: Award,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-500/10",
      href: "/certificates",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.id}
            href={card.href}
            className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">
                    {card.title}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                    {card.value}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>{card.subtitle}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
