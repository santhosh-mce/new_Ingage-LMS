"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Radio,
  PlayCircle,
  CheckCircle2,
  Users,
  ShieldCheck,
  Video,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import {
  getMasterClassById,
  getRegisteredMasterClassIds,
  toggleMasterClassRegistration,
  MasterClassItem,
} from "@/api/masterClassApi";

export default function MasterClassDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<MasterClassItem | null>(null);
  const [isReg, setIsReg] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const found = getMasterClassById(id);
      setItem(found);
      setIsReg(getRegisteredMasterClassIds().includes(id));
    }
  }, [id]);

  const handleRegister = () => {
    if (!item) return;
    const nowReg = toggleMasterClassRegistration(item.id);
    setIsReg(nowReg);
    setToastMsg(
      nowReg
        ? `Registration confirmed for "${item.title}". Meeting link added to calendar!`
        : `Registration cancelled.`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  if (!item) {
    return (
      <StudentLayout activePath="/master-class">
        <div className="p-12 text-center space-y-4">
          <p className="text-sm font-bold text-slate-600">Master Class not found.</p>
          <Link
            href="/master-class"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block"
          >
            Back to Master Classes
          </Link>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activePath="/master-class">
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/master-class"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Master Classes</span>
        </Link>

        {toastMsg && (
          <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>{toastMsg}</span>
            </span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Master Class Workshop</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {item.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.longDescription}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{item.time} ({item.duration})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{item.registeredCount} Learners Registered</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 self-start w-full md:w-80 shrink-0">
            <div>
              <span className="text-xs font-semibold text-slate-500">Access Status</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                Free for Enrolled InGage Students
              </p>
            </div>

            {item.status === "Live Now" ? (
              <a
                href={item.meetingUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md animate-pulse"
              >
                <Radio className="w-4 h-4" />
                <span>Join Live Session Now</span>
              </a>
            ) : item.status === "Upcoming" ? (
              <button
                onClick={handleRegister}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  isReg
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {isReg ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Registered (Seat Reserved)</span>
                  </>
                ) : (
                  <span>Register Free</span>
                )}
              </button>
            ) : (
              <a
                href={item.recordingUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Watch Full Recording</span>
              </a>
            )}

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Includes Q&amp;A and downloadable architecture diagrams</span>
              </p>
            </div>
          </div>
        </div>

        {/* Instructor Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Featured Master Instructor</h3>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-base">{item.instructor}</h4>
              <p className="text-xs font-semibold text-purple-700">{item.instructorDesignation}</p>
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">{item.instructorBio}</p>
            </div>
          </div>
        </div>

        {/* Agenda Timeline & Learning Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agenda */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Session Agenda</h3>
            <div className="space-y-3">
              {item.agenda.map((slot, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg shrink-0">
                    {slot.time}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{slot.topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Learning Outcomes</h3>
            <div className="space-y-3">
              {item.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
