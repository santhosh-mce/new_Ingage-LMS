"use client";

import React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, FileText, Video, ChevronRight } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "COMPLETED_LESSON" | "SUBMITTED_ASSIGNMENT" | "JOINED_LIVE" | "EARNED_CERTIFICATE" | string;
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "COMPLETED_LESSON":
        return {
          icon: CheckCircle2,
          bgColor: "bg-emerald-500/10",
          iconColor: "text-emerald-600",
        };
      case "SUBMITTED_ASSIGNMENT":
        return {
          icon: FileText,
          bgColor: "bg-purple-500/10",
          iconColor: "text-purple-600",
        };
      case "JOINED_LIVE":
      default:
        return {
          icon: Video,
          bgColor: "bg-blue-500/10",
          iconColor: "text-blue-600",
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-slate-800" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h2>
        </div>
        <Link
          href="/learning-reports"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-100">
        {activities.map((item) => {
          const config = getActivityIcon(item.type);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 group cursor-pointer hover:bg-slate-50/60 -mx-3 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${config.bgColor} ${config.iconColor} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
