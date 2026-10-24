"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  Radio,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Video,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import {
  getMasterClasses,
  getRegisteredMasterClassIds,
  toggleMasterClassRegistration,
  MasterClassItem,
} from "@/api/masterClassApi";

export default function MasterClassListPage() {
  const [classes, setClasses] = useState<MasterClassItem[]>([]);
  const [regIds, setRegIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    setClasses(getMasterClasses());
    setRegIds(getRegisteredMasterClassIds());
  }, []);

  const handleRegister = (id: string) => {
    toggleMasterClassRegistration(id);
    setRegIds(getRegisteredMasterClassIds());
  };

  const filtered = classes.filter((c) => {
    if (statusFilter === "All") return true;
    return c.status === statusFilter;
  });

  return (
    <StudentLayout activePath="/master-class">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Master Classes with Tech Leaders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Accelerate your architectural understanding with deep dives led by principal engineers,
            CTOs, and open-source core maintainers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          {["All", "Live Now", "Upcoming", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const isReg = regIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {item.status === "Live Now" ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white flex items-center gap-1.5 animate-pulse shadow-md">
                          <Radio className="w-3.5 h-3.5" />
                          <span>LIVE NOW</span>
                        </span>
                      ) : item.status === "Upcoming" ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-purple-300 backdrop-blur-xs border border-purple-500/20">
                          Upcoming
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/90 text-slate-300 backdrop-blur-xs">
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-xs">
                      {item.duration}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-purple-700 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Instructor Info */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>{item.instructor}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {item.instructorDesignation}
                      </p>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-2">
                  <div className="flex gap-2">
                    {item.status === "Live Now" ? (
                      <a
                        href={item.meetingUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <Radio className="w-4 h-4" />
                        <span>Join Now</span>
                      </a>
                    ) : item.status === "Upcoming" ? (
                      <button
                        onClick={() => handleRegister(item.id)}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                          isReg
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                        }`}
                      >
                        {isReg ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Registered</span>
                          </>
                        ) : (
                          <span>Register</span>
                        )}
                      </button>
                    ) : (
                      <a
                        href={item.recordingUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>View Recording</span>
                      </a>
                    )}

                    <Link
                      href={`/master-class/${item.id}`}
                      className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center transition"
                      title="View Master Class Agenda"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
}
