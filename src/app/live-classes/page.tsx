"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Calendar,
  Clock,
  User,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import axios from "axios";

interface LiveClassRecord {
  id: number;
  title: string;
  description: string;
  courseId: number;
  courseTitle: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  status: "Live Now" | "Upcoming" | "Completed";
  meetingUrl: string;
  recordingUrl: string;
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Live Now" | "Completed">("Upcoming");

  const fetchLiveClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/live-classes");
      if (Array.isArray(res.data)) {
        setClasses(res.data);
        // If there's an active Live Now class, default to that or Upcoming
        const hasLive = res.data.some((c) => c.status === "Live Now");
        if (hasLive) setActiveTab("Live Now");
      }
    } catch (err: any) {
      console.error("Failed to load live classes", err);
      setError("Unable to load live classes from the LMS backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const filtered = classes.filter((c) => c.status === activeTab);

  const countFor = (st: "Upcoming" | "Live Now" | "Completed") =>
    classes.filter((c) => c.status === st).length;

  return (
    <StudentLayout activePath="/live-classes">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Interactive Classes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join your instructors and peers for live coding sessions, architectural reviews, doubt
            resolution, and hands-on laboratory workshops.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          {(["Live Now", "Upcoming", "Completed"] as const).map((tab) => {
            const count = countFor(tab);
            const active = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? tab === "Live Now"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab === "Live Now" && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-64 p-6 space-y-4">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={fetchLiveClasses}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No {activeTab} classes found</h3>
            <p className="text-xs text-slate-500">
              {activeTab === "Live Now"
                ? "There are no ongoing live sessions right now. Check the Upcoming tab for scheduled sessions."
                : "No sessions recorded in this category."}
            </p>
          </div>
        )}

        {/* Class Cards Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      <span className="truncate max-w-[160px]">{item.courseTitle}</span>
                    </span>

                    {item.status === "Live Now" ? (
                      <span className="text-[11px] font-extrabold text-rose-600 flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>LIVE NOW</span>
                      </span>
                    ) : item.status === "Upcoming" ? (
                      <span className="text-[11px] font-semibold text-slate-400">Scheduled</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Recorded</span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{item.instructor}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {item.status === "Live Now" ? (
                    <a
                      href={item.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-rose-900/20"
                    >
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>JOIN NOW</span>
                    </a>
                  ) : item.status === "Upcoming" ? (
                    <a
                      href={item.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Join Live Class</span>
                    </a>
                  ) : (
                    <a
                      href={item.recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>View Recording</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
