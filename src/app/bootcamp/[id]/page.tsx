"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Rocket,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  FolderArchive,
  HelpCircle,
  Radio,
  FileBarChart,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { getCareerById, CareerDto } from "@/api/careerApi";
import { useAuth } from "@/context/AuthContext";

type BootcampTab =
  | "overview"
  | "curriculum"
  | "schedule"
  | "projects"
  | "quizzes"
  | "live"
  | "report";

export default function BootcampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const bootcampId = params?.id as string;

  const [bootcamp, setBootcamp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BootcampTab>("overview");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function loadBootcamp() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCareerById(bootcampId);
        setBootcamp(data);
      } catch (err: any) {
        console.error("Failed to load bootcamp detail", err);
        setError("Unable to load bootcamp details.");
      } finally {
        setLoading(false);
      }
    }
    if (bootcampId) {
      loadBootcamp();
    }
  }, [bootcampId]);

  return (
    <StudentLayout activePath="/bootcamp">
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/bootcamp"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Bootcamps</span>
        </Link>

        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-40 bg-slate-100 rounded-2xl w-full" />
          </div>
        )}

        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <Link
              href="/bootcamp"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-block"
            >
              Return to Bootcamps
            </Link>
          </div>
        )}

        {!loading && !error && bootcamp && (
          <>
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Bootcamp Cohort</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {bootcamp.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {bootcamp.description ||
                    "Master modern engineering workflows, production architectures, and deploy complete full-stack enterprise applications."}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{bootcamp.duration || "12 Weeks Intensive"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Next Cohort: Nov 15, 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>Industry Certificate Included</span>
                  </div>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex flex-col justify-center sm:items-end gap-3 shrink-0">
                <button
                  onClick={() => setIsEnrolled(!isEnrolled)}
                  className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shadow-md ${
                    isEnrolled
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-emerald-600"
                  }`}
                >
                  {isEnrolled ? "Enrolled • Continue Bootcamp" : "Join This Bootcamp"}
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEnrolled ? "Active Member Access" : "Limited Seats Per Cohort"}
                </span>
              </div>
            </div>

            {/* Pill Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "curriculum", label: "Curriculum", icon: BookOpen },
                { id: "schedule", label: "Schedule", icon: Calendar },
                { id: "projects", label: "Projects", icon: FolderArchive },
                { id: "quizzes", label: "Quizzes", icon: HelpCircle },
                { id: "live", label: "Live Classes", icon: Radio },
                { id: "report", label: "Report", icon: FileBarChart },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as BootcampTab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENTS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-900 text-base">Bootcamp Overview</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Designed for aspiring and advancing software engineers, this program delivers hands-on
                    curriculum covering state-of-the-art modern stacks, rigorous code reviews, automated CI/CD
                    pipelines, and system design essentials.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-emerald-600">Module Structure</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">6 Core Milestones</h4>
                      <p className="text-xs text-slate-500 mt-1">From fundamentals to production deployments.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-emerald-600">Capstone Work</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">4 Industry Projects</h4>
                      <p className="text-xs text-slate-500 mt-1">Reviewed by enterprise technical leads.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-emerald-600">Live Mentorship</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">Weekly Live Classes</h4>
                      <p className="text-xs text-slate-500 mt-1">Live Q&amp;A, debugging workshops &amp; career guidance.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CURRICULUM */}
              {activeTab === "curriculum" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Curriculum Modules</h3>
                  <div className="divide-y divide-slate-100">
                    {[
                      { week: "Weeks 1-2", title: "Modern JavaScript, TypeScript & Clean Architecture", lessons: 14 },
                      { week: "Weeks 3-5", title: "React 19, Server Components & Next.js 16", lessons: 18 },
                      { week: "Weeks 6-8", title: "Scalable Node.js, Express, PostgreSQL & Prisma ORM", lessons: 16 },
                      { week: "Weeks 9-10", title: "Docker, Kubernetes, CI/CD & Cloud Deployment", lessons: 12 },
                      { week: "Weeks 11-12", title: "Enterprise Capstone & Mock Technical Interviews", lessons: 8 },
                    ].map((m, idx) => (
                      <div key={idx} className="py-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-600">{m.week}</span>
                          <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">{m.lessons} Lessons</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SCHEDULE */}
              {activeTab === "schedule" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Live Cohort Schedule</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Live Mentorship Call: Next.js Patterns</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Every Tuesday &amp; Thursday • 7:00 PM - 8:30 PM IST</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Upcoming
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">Weekend Project Hackathon</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Saturday • 10:00 AM - 2:00 PM IST</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Scheduled
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === "projects" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Industrial Capstone Projects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Capstone 1
                        </span>
                        <span className="text-xs font-semibold text-slate-500">100 Marks</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Full-Stack SaaS Billing &amp; Subscription Engine</h4>
                      <p className="text-xs text-slate-500">Build authentication, Stripe webhooks, and tiered permission middleware.</p>
                    </div>

                    <div className="p-5 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Capstone 2
                        </span>
                        <span className="text-xs font-semibold text-slate-500">100 Marks</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Real-Time Collaborative Code Playground</h4>
                      <p className="text-xs text-slate-500">Implement WebSockets, CRDT synchronization, and docker sandboxing.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: QUIZZES */}
              {activeTab === "quizzes" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Assessment Quizzes</h3>
                  <div className="space-y-3">
                    {["Milestone 1: Fundamentals Quiz", "Milestone 2: State Management & Data Fetching", "Milestone 3: Database & Security Quiz"].map(
                      (q, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{q}</p>
                              <p className="text-[11px] text-slate-500">20 Questions • 30 mins</p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                            Available
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: LIVE */}
              {activeTab === "live" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base">Live Interactive Sessions</h3>
                  <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>Live Session Ready</span>
                      </span>
                      <h4 className="font-extrabold text-base">Weekly Sprint Review &amp; Code Clinic</h4>
                      <p className="text-xs text-slate-300">Join the lead mentor and cohort peers on Google Meet.</p>
                    </div>
                    <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition cursor-pointer">
                      Join Live Meeting
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 7: REPORT */}
              {activeTab === "report" && (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-900 text-base">Student Performance &amp; Analytics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Live Attendance</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-1">92%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Quiz Average</span>
                      <p className="text-lg font-extrabold text-emerald-600 mt-1">88.5%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Projects</span>
                      <p className="text-lg font-extrabold text-slate-900 mt-1">3 / 4</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Certificate</span>
                      <p className="text-lg font-extrabold text-emerald-600 mt-1">Eligible</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
