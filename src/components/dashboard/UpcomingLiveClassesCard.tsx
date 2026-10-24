"use client";

import React from "react";
import Link from "next/link";
import { Radio, Clock, User } from "lucide-react";

export interface LiveClassCardItem {
  id: number | string;
  title: string;
  month: string;
  day: string;
  time: string;
  instructor: string;
  meetingLink: string;
  courseId?: number;
  courseTitle?: string;
  isEnrolled?: boolean;
}

interface UpcomingLiveClassesCardProps {
  classes: LiveClassCardItem[];
}

export function UpcomingLiveClassesCard({ classes }: UpcomingLiveClassesCardProps) {
  const displayClasses = classes.slice(0, 2);

  const handleJoinClass = (meetingLink?: string) => {
    if (meetingLink && meetingLink.startsWith("http")) {
      window.open(meetingLink, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = "/live-classes";
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-emerald-500 flex items-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Upcoming Live Classes
          </h2>
        </div>
        <Link
          href="/live-classes"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Class Items List */}
      <div className="space-y-4">
        {displayClasses.map((item, index) => {
          const isPrimary = index === 0;

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex items-start gap-3">
                {/* Date Box */}
                <div className="w-12 h-13 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-blue-600 leading-tight">
                    {item.month}
                  </span>
                  <span className="text-base font-extrabold text-slate-900 leading-tight">
                    {item.day}
                  </span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {item.title}
                  </h3>

                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.instructor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleJoinClass(item.meetingLink)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPrimary
                    ? "bg-[#00C975] hover:bg-[#00B368] text-white shadow-xs"
                    : "border border-[#00C975] text-[#00C975] hover:bg-emerald-50 bg-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5 shrink-0" />
                <span>Join Live Class</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
