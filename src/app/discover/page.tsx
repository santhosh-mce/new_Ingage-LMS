"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  Star,
  Clock,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Rocket,
  Award,
  Briefcase,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import axios from "axios";

interface CourseItem {
  id: number;
  title: string;
  slug?: string;
  short_description?: string;
  description?: string;
  instructor?: string;
  duration?: string;
  level?: string;
  rating?: number;
  price?: number;
  thumbnail_url?: string;
  thumbnail?: string;
  category?: string;
  course_sections?: Array<{
    id: number;
    title: string;
    course_lessons?: Array<{ id: number; title: string; duration?: string }>;
  }>;
}

interface CareerItem {
  id: number;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  shortDescription?: string;
  level?: string;
  duration?: string;
  salary?: {
    min?: number;
    max?: number;
    formatted?: string;
  };
  imageUrl?: string;
  image_url?: string;
  jobOpenings?: string;
  modulesCount?: number;
  certificationName?: string;
  skills?: string[];
}

interface CredentialCourseItem {
  id: number;
  title: string;
  slug: string;
  provider?: string;
  category?: string;
  level?: string;
  duration?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  credentialName?: string;
  credentialType?: string;
  price?: number;
  free?: boolean;
  rating?: number;
  learnersCount?: number;
  modules?: Array<{ id: number; title: string }>;
}

const CATEGORIES = ["All", "Development", "Data Science", "Cloud", "AI", "Other"];

// Helper to test if item matches selected category
function matchesCategoryFilter(categoryStr: string | undefined, titleStr: string | undefined, selectedCategory: string): boolean {
  if (selectedCategory === "All") return true;

  const target = `${categoryStr || ""} ${titleStr || ""}`.toLowerCase();
  const sel = selectedCategory.toLowerCase();

  if (sel === "development") {
    return (
      target.includes("dev") ||
      target.includes("full-stack") ||
      target.includes("full stack") ||
      target.includes("software") ||
      target.includes("web") ||
      target.includes("frontend") ||
      target.includes("backend") ||
      target.includes("programming")
    );
  }
  if (sel === "data science") {
    return (
      target.includes("data") ||
      target.includes("analytics") ||
      target.includes("analyst") ||
      target.includes("scientist") ||
      target.includes("business intelligence")
    );
  }
  if (sel === "cloud") {
    return (
      target.includes("cloud") ||
      target.includes("devops") ||
      target.includes("infrastructure") ||
      target.includes("architect") ||
      target.includes("security") ||
      target.includes("cyber")
    );
  }
  if (sel === "ai") {
    return (
      target.includes("ai") ||
      target.includes("intelligence") ||
      target.includes("machine learning") ||
      target.includes("deep learning") ||
      target.includes("generative")
    );
  }
  if (sel === "other") {
    return (
      !matchesCategoryFilter(categoryStr, titleStr, "Development") &&
      !matchesCategoryFilter(categoryStr, titleStr, "Data Science") &&
      !matchesCategoryFilter(categoryStr, titleStr, "Cloud") &&
      !matchesCategoryFilter(categoryStr, titleStr, "AI")
    );
  }

  return target.includes(sel);
}

function deduplicateById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const [inGageCourses, setInGageCourses] = useState<CourseItem[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerItem[]>([]);
  const [googleCourses, setGoogleCourses] = useState<CredentialCourseItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  useEffect(() => {
    async function fetchAllDiscoverContent() {
      setLoading(true);
      setError(null);

      try {
        const [coursesRes, careersRes, credsRes] = await Promise.allSettled([
          axios.get("/api/courses"),
          axios.get("/api/careers"),
          axios.get("/api/credential-courses"),
        ]);

        // 1. InGage Courses
        if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value.data)) {
          setInGageCourses(deduplicateById(coursesRes.value.data));
        } else {
          setInGageCourses([]);
        }

        // 2. Career Courses / Paths
        if (careersRes.status === "fulfilled") {
          const rawCareers = careersRes.value.data?.content || careersRes.value.data;
          if (Array.isArray(rawCareers)) {
            setCareerPaths(deduplicateById(rawCareers));
          } else {
            setCareerPaths([]);
          }
        } else {
          setCareerPaths([]);
        }

        // 3. Google Credential Courses
        if (credsRes.status === "fulfilled" && Array.isArray(credsRes.value.data)) {
          // Filter to Google credential courses
          const googleFiltered = credsRes.value.data.filter(
            (c: CredentialCourseItem) =>
              (c.provider || "").toLowerCase().includes("google") ||
              (c.title || "").toLowerCase().includes("google") ||
              (c.credentialName || "").toLowerCase().includes("google")
          );
          setGoogleCourses(deduplicateById(googleFiltered.length > 0 ? googleFiltered : credsRes.value.data));
        } else {
          setGoogleCourses([]);
        }
      } catch (err: any) {
        console.error("Failed to load discover content:", err);
        setError("Unable to load all learning content at the moment.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllDiscoverContent();
  }, []);

  // Filter 1: InGage Courses
  const filteredInGageCourses = useMemo(() => {
    return inGageCourses.filter((course) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (course.title || "").toLowerCase().includes(q) ||
        (course.description || "").toLowerCase().includes(q) ||
        (course.short_description || "").toLowerCase().includes(q) ||
        (course.instructor || "").toLowerCase().includes(q) ||
        (course.category || "").toLowerCase().includes(q);

      const matchesCat = matchesCategoryFilter(course.category, course.title, selectedCategory);

      const matchesLvl =
        selectedLevel === "All" ||
        (course.level || "").toLowerCase() === selectedLevel.toLowerCase();

      return matchesSearch && matchesCat && matchesLvl;
    });
  }, [inGageCourses, searchQuery, selectedCategory, selectedLevel]);

  // Filter 2: Career Paths
  const filteredCareerPaths = useMemo(() => {
    return careerPaths.filter((career) => {
      const q = searchQuery.toLowerCase().trim();
      const skillsStr = (career.skills || []).join(" ").toLowerCase();
      const matchesSearch =
        !q ||
        (career.title || "").toLowerCase().includes(q) ||
        (career.description || "").toLowerCase().includes(q) ||
        (career.shortDescription || "").toLowerCase().includes(q) ||
        (career.category || "").toLowerCase().includes(q) ||
        skillsStr.includes(q);

      const matchesCat = matchesCategoryFilter(career.category, career.title, selectedCategory);

      const matchesLvl =
        selectedLevel === "All" ||
        (career.level || "").toLowerCase() === selectedLevel.toLowerCase();

      return matchesSearch && matchesCat && matchesLvl;
    });
  }, [careerPaths, searchQuery, selectedCategory, selectedLevel]);

  // Filter 3: Google Credential Courses
  const filteredGoogleCourses = useMemo(() => {
    return googleCourses.filter((cred) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (cred.title || "").toLowerCase().includes(q) ||
        (cred.description || "").toLowerCase().includes(q) ||
        (cred.shortDescription || "").toLowerCase().includes(q) ||
        (cred.credentialName || "").toLowerCase().includes(q) ||
        (cred.category || "").toLowerCase().includes(q);

      const matchesCat = matchesCategoryFilter(cred.category, cred.title, selectedCategory);

      const matchesLvl =
        selectedLevel === "All" ||
        (cred.level || "").toLowerCase() === selectedLevel.toLowerCase();

      return matchesSearch && matchesCat && matchesLvl;
    });
  }, [googleCourses, searchQuery, selectedCategory, selectedLevel]);

  const totalFilteredCount =
    filteredInGageCourses.length + filteredCareerPaths.length + filteredGoogleCourses.length;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Card 1: InGage Course Card
  const renderCourseCard = (course: CourseItem) => {
    const totalLessons = (course.course_sections || []).reduce(
      (acc, s) => acc + (s.course_lessons?.length || 0),
      0
    );
    const thumb = course.thumbnail_url || course.thumbnail;

    return (
      <div
        key={`ingage-course-${course.id}`}
        className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col"
      >
        {/* Thumbnail banner */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-emerald-950 p-4 text-center">
              <GraduationCap className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-slate-300 line-clamp-1">{course.title}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {course.category && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#064E3B]/90 text-white backdrop-blur-xs">
                {course.category}
              </span>
            )}
            {course.level && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200/80 shadow-xs">
                {course.level}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#00A86B] text-white shadow-md">
              {formatPrice(course.price)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {course.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {course.short_description ||
                course.description ||
                "Master industry-level skills with step-by-step video lessons and hands-on projects."}
            </p>
          </div>

          {/* Meta specs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium truncate max-w-[150px]">
                By {course.instructor || "InGage Faculty"}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{course.rating ? course.rating.toFixed(1) : "4.8"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{course.duration || "8 Hours"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{totalLessons > 0 ? `${totalLessons} Lessons` : "12 Modules"}</span>
              </div>
            </div>

            {/* View Course Button */}
            <Link
              href={course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-[#00A86B] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group-hover:shadow-md"
            >
              <span>View Course</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Card 2: Career Path Card
  const renderCareerCard = (career: CareerItem) => {
    const thumb = career.imageUrl || career.image_url;

    return (
      <div
        key={`career-path-${career.id}`}
        className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col"
      >
        {/* Thumbnail banner */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={career.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-emerald-950 p-4 text-center">
              <Rocket className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-slate-300 line-clamp-1">{career.title}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {career.category && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-emerald-400 backdrop-blur-xs border border-emerald-500/20">
                {career.category}
              </span>
            )}
            {career.level && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800 backdrop-blur-xs">
                {career.level}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-md">
              {career.salary?.formatted || career.jobOpenings || "High Demand"}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {career.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {career.shortDescription ||
                career.description ||
                "Comprehensive career roadmaps with job opportunities and capstone projects."}
            </p>
          </div>

          {/* Skills tags preview */}
          {career.skills && career.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {career.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                >
                  {skill}
                </span>
              ))}
              {career.skills.length > 3 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  +{career.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Meta specs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium truncate max-w-[150px]">
                {career.jobOpenings ? `${career.jobOpenings} Job Openings` : "Career Track"}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.9</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{career.duration || "4-6 Months"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{career.modulesCount || 10} Modules</span>
              </div>
            </div>

            {/* Explore Career Path Button */}
            <Link
              href={`/careers/${career.slug}`}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group-hover:shadow-md"
            >
              <span>Explore Career Path</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Card 3: Google Credential Course Card
  const renderCredentialCard = (cred: CredentialCourseItem) => {
    return (
      <div
        key={`google-cred-${cred.id}`}
        className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col"
      >
        {/* Thumbnail banner */}
        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
          {cred.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cred.thumbnail}
              alt={cred.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-emerald-950 p-4 text-center">
              <Award className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-slate-300 line-clamp-1">{cred.title}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-emerald-400 backdrop-blur-xs border border-emerald-500/20">
              {cred.provider || "Google"}
            </span>
            {cred.level && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800 backdrop-blur-xs">
                {cred.level}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-md">
              {cred.free || !cred.price ? "Free" : formatPrice(cred.price)}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {cred.title}
            </h3>

            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {cred.shortDescription ||
                cred.description ||
                "Official Google certified credential track with accredited digital badge."}
            </p>
          </div>

          {/* Meta specs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium truncate max-w-[150px]">
                By {cred.provider || "Google"}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{cred.rating ? cred.rating.toFixed(1) : "4.8"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{cred.duration || "Approx. 6 months"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>{cred.modules?.length ? `${cred.modules.length} Modules` : "Certified Track"}</span>
              </div>
            </div>

            {/* View Course Button */}
            <Link
              href={`/credential/${cred.slug}`}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group-hover:shadow-md"
            >
              <span>View Course</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout activePath="/discover">
      <div className="space-y-8">
        {/* Search Input */}
        <div className="relative max-w-2xl">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, bootcamps, master classes..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
          />
        </div>

        {/* ==================================================
            CATEGORY PILL FILTERS & LEVEL SELECTOR
            ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#00A86B] text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Level:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-full px-4 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-slate-200/80 -mt-2 mb-2" />

        {/* ==================================================
            LOADING SKELETON
            ================================================== */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-80 p-4 space-y-4">
                <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded-xl w-full mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            GLOBAL ERROR BANNER
            ================================================== */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* ==================================================
            EMPTY STATE IF NO DATA MATCHES
            ================================================== */}
        {!loading && !error && totalFilteredCount === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No learning content matched your query</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search terms or selecting a different category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedLevel("All");
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-700 transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ==================================================
            THE ONLY THREE ALLOWED CONTENT SECTIONS
            1. InGage Courses
            2. Career Paths
            3. Google Credential Courses
            ================================================== */}
        {!loading && !error && totalFilteredCount > 0 && (
          <div className="space-y-12">
            {/* SECTION 1 — INGAGE COURSES */}
            {filteredInGageCourses.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        InGage Courses
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Learn practical technology skills through industry-focused courses.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
                    {filteredInGageCourses.length} {filteredInGageCourses.length === 1 ? "Course" : "Courses"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredInGageCourses.map(renderCourseCard)}
                </div>
              </section>
            )}

            {/* SECTION 2 — CAREER COURSES / CAREER PATHS */}
            {filteredCareerPaths.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Career Paths
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Structured job-ready career paths with industry-aligned roadmaps and hiring pipelines.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
                    {filteredCareerPaths.length} {filteredCareerPaths.length === 1 ? "Path" : "Paths"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCareerPaths.map(renderCareerCard)}
                </div>
              </section>
            )}

            {/* SECTION 3 — GOOGLE CREDENTIAL COURSES */}
            {filteredGoogleCourses.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Google Credential Courses
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Official Google credential programs to validate in-demand cloud and AI capabilities.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
                    {filteredGoogleCourses.length} {filteredGoogleCourses.length === 1 ? "Program" : "Programs"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredGoogleCourses.map(renderCredentialCard)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default function DiscoverPage() {
  return (
    <React.Suspense
      fallback={
        <StudentLayout activePath="/discover">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-80 p-4 space-y-4">
                <div className="aspect-video bg-slate-200 rounded-2xl w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded-xl w-full mt-6" />
              </div>
            ))}
          </div>
        </StudentLayout>
      }
    >
      <DiscoverContent />
    </React.Suspense>
  );
}
