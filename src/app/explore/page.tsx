"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getExploreData, ExploreData } from "@/api/exploreApi";
import { useRouter } from "next/navigation";
import { Compass, Briefcase, Code, ArrowRight, Search } from "lucide-react";

export default function ExplorePage() {
  const router = useRouter();
  const [data, setData] = useState<ExploreData>({ careers: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "careers" | "projects">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getExploreData()
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to load explore data", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCareers = (data.careers || []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = (data.projects || []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currentPath="/explore" onNavigate={(p: string) => router.push(p)} />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            <span>Discover Your Tech Future</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore Career Tracks & Capstone Projects
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Choose an industry-aligned roadmap or build production-grade projects evaluated by hiring managers.
          </p>

          <div className="max-w-md mx-auto relative pt-4">
            <Search className="w-5 h-5 absolute left-3.5 top-7 text-slate-500" />
            <input
              type="text"
              placeholder="Search careers, skills, or projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-500 text-sm"
            />
          </div>

          <div className="flex justify-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-lime-500 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              All ({(data.careers?.length || 0) + (data.projects?.length || 0)})
            </button>
            <button
              onClick={() => setActiveTab("careers")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "careers"
                  ? "bg-lime-500 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Career Roadmaps ({data.careers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "projects"
                  ? "bg-lime-500 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              Industry Projects ({data.projects?.length || 0})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {(activeTab === "all" || activeTab === "careers") && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-lime-400" />
                  <span>Featured Career Pathways</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCareers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/careers/${c.slug}`)}
                      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-lime-500/50 hover:bg-slate-800/40 transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-lime-500/10 text-lime-400 font-semibold border border-lime-500/20">
                          {c.category}
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-lime-400 transition">
                          {c.title}
                        </h3>
                      </div>
                      <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 mt-4">
                        <span>Comprehensive Roadmap</span>
                        <ArrowRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "projects") && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Code className="w-5 h-5 text-lime-400" />
                  <span>Industry Capstone Projects</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.slug}`)}
                      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-lime-500/50 hover:bg-slate-800/40 transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                          {p.industry}
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-lime-400 transition">
                          {p.title}
                        </h3>
                      </div>
                      <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 mt-4">
                        <span>View Project Spec</span>
                        <ArrowRight className="w-4 h-4 text-lime-400 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer onNavigate={(p: string) => router.push(p)} />
    </div>
  );
}
