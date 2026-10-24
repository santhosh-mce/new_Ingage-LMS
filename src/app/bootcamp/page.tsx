"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Calendar,
  Clock,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Code,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { getCareers, CareerDto } from "@/api/careerApi";

export default function BootcampListPage() {
  const router = useRouter();
  const [bootcamps, setBootcamps] = useState<CareerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCareers();
        setBootcamps(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Failed to load bootcamps", err);
        setError("Unable to load bootcamp programs.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <StudentLayout activePath="/bootcamp">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Intensive Tech Bootcamps
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Job-ready cohorts with dedicated live classes, industrial capstone projects, mentor code
            reviews, and 1-on-1 career assistance.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-96 p-6 space-y-4">
                <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bootcamp Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bootcamps.map((item, idx) => {
              const startDate = "Nov 15, 2026";
              const endDate = "Feb 28, 2027";
              const studentCount = 120 + idx * 35;
              const mentor = "Senior Industry Architect";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Image or Graphic */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#0A1224] to-emerald-950 p-6">
                          <Rocket className="w-12 h-12 text-emerald-400" />
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-emerald-400 backdrop-blur-xs border border-emerald-500/20">
                          {item.category || "Bootcamp"}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800">
                          {item.level || "Intermediate"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-emerald-700 transition">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {item.description || item.shortDescription || "Comprehensive immersion program with live mentoring and real-world projects."}
                        </p>
                      </div>

                      {/* Cohort Timeline */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{item.duration || "12 Weeks"}</span>
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Cohort Start</span>
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-600" />
                            <span>{startDate}</span>
                          </p>
                        </div>
                      </div>

                      {/* Mentor & Students */}
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{studentCount} Students Enrolled</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Live Classes Included
                        </span>
                      </div>

                      {/* Skills Covered Tags */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {item.skills.slice(0, 4).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                          {item.skills.length > 4 && (
                            <span className="text-[10px] font-bold text-slate-400 self-center">
                              +{item.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 flex gap-2">
                    <Link
                      href={`/bootcamp/${item.id}`}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs group-hover:shadow-md"
                    >
                      <span>View Bootcamp</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
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
