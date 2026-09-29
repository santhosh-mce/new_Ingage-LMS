"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Star,
  Users,
  Shield,
  Layers,
  ExternalLink,
  BookOpen,
  Filter,
  GraduationCap,
  ChevronRight,
  Database,
  Cloud,
  Cpu,
  Palette,
  Briefcase
} from 'lucide-react';
import {
  getCredentialCourses,
  getCredentialCategories,
  CredentialCourseDto,
  CategoryCountItem
} from '../api/credentialApi';
import { useAppSelector } from '../store/hooks';
import { UserProfile } from '../types';

interface CredentialEdgePageProps {
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
}

const STATIC_CATEGORIES = [
  'All',
  'Data & Analytics',
  'Cybersecurity',
  'Generative AI',
  'Cloud',
  'IT & Infrastructure',
  'Project Management',
  'UX Design',
  'Digital Marketing',
  'Other'
];

export function CredentialEdgePage({ onNavigate, currentUser: propUser, onOpenAuth }: CredentialEdgePageProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const [courses, setCourses] = useState<CredentialCourseDto[]>([]);
  const [categories, setCategories] = useState<string[]>(STATIC_CATEGORIES);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedLevel, sortBy]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, categoriesData] = await Promise.all([
        getCredentialCourses({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          level: selectedLevel !== 'All' ? selectedLevel : undefined,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
          sort: sortBy
        }),
        getCredentialCategories().catch(() => [] as CategoryCountItem[])
      ]);

      setCourses(coursesData);

      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        const counts: Record<string, number> = {};
        const dynCats: string[] = ['All'];

        categoriesData.forEach((item) => {
          if (item.category && item.category !== 'All') {
            counts[item.category] = item.count;
            if (!dynCats.includes(item.category)) {
              dynCats.push(item.category);
            }
          }
        });
        setCategoryCounts(counts);

        // Merge with static categories if missing
        STATIC_CATEGORIES.forEach((sc) => {
          if (!dynCats.includes(sc)) dynCats.push(sc);
        });
        setCategories(dynCats);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load Google courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Client-side filtering for price
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (priceFilter === 'Free' && !c.free && (c.price || 0) > 0) return false;
      if (priceFilter === 'Paid' && (c.free || (c.price || 0) <= 0)) return false;
      return true;
    });
  }, [courses, priceFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'data & analytics':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'cybersecurity':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'generative ai':
        return <Cpu className="w-4 h-4 text-purple-600" />;
      case 'cloud':
      case 'cloud & infrastructure':
      case 'it & infrastructure':
        return <Cloud className="w-4 h-4 text-cyan-600" />;
      case 'ux design':
        return <Palette className="w-4 h-4 text-pink-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-lime-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 flex flex-col font-sans">
      {/* Track Indicator Header Strip */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white text-xs sm:text-sm py-2.5 px-4 sm:px-8 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="font-bold tracking-wide">Credential Edge</span>
          <span className="text-emerald-400">•</span>
          <span className="text-emerald-100 hidden sm:inline">Google Professional Courses & Recognised Credentials</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => onNavigate('/careers')}
            className="text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            Career Compass
          </button>
          <span className="text-emerald-500">|</span>
          <button
            onClick={() => onNavigate('/courses')}
            className="text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            Skill Forge
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-lime-50/20 to-transparent border-b border-gray-100 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Content */}
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-100/80 border border-lime-200 text-lime-800 text-xs font-semibold uppercase tracking-wider mb-5">
                <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                <span>Credential Edge • Google Certified Courses</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                Build Skills. Earn Recognised Credentials.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-gray-600 leading-relaxed max-w-2xl mb-8">
                Learn industry-relevant skills through Google professional courses and build credentials that strengthen your career profile.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#courses-section"
                  className="px-6 py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm sm:text-[15px] shadow-sm hover:shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Explore Google Courses</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <button
                  onClick={() => onNavigate('/credential-edge/credentials')}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm sm:text-[15px] border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-lime-600" />
                  <span>View My Credentials</span>
                </button>
              </div>

              {/* Verified Attribution Clarification Note */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-lime-500" />
                <span>
                  <strong>Provider:</strong> Google • <strong>InGage:</strong> Structured learning pathways & student progress tracking
                </span>
              </div>
            </div>

            {/* Right Hero Badge Visual (Matching Google Certificates Card Design) */}
            <div className="w-full lg:w-auto shrink-0 flex justify-center py-4">
              <div className="relative w-full max-w-[420px] mx-auto">
                {/* Subtle ambient glow & decorative sparkle accents */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-100/40 via-blue-50/40 to-lime-100/40 rounded-[36px] blur-xl opacity-70 -z-10" />
                <span className="absolute -bottom-5 -right-5 text-gray-300/60 select-none text-2xl font-light pointer-events-none">
                  ✦
                </span>
                <span className="absolute -top-4 -left-4 text-gray-300/40 select-none text-xl font-light pointer-events-none">
                  ✦
                </span>

                <div className="relative bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_45px_rgba(0,0,0,0.06)] border border-gray-100 p-7 sm:p-9 text-left">
                  {/* Floating Pill Badge: INDUSTRY RECOGNISED */}
                  <div className="absolute -top-3.5 right-6 sm:right-8 px-4 sm:px-5 py-1.5 bg-[#F59E0B] text-white text-[10px] sm:text-[11px] font-black rounded-full uppercase tracking-wider shadow-sm z-10">
                    INDUSTRY RECOGNISED
                  </div>

                  {/* Google Certificates Wordmark Header */}
                  <div className="pt-2 mb-6">
                    <div className="text-3xl sm:text-4xl font-medium tracking-tight flex items-baseline">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">o</span>
                      <span className="text-[#FBBC05]">o</span>
                      <span className="text-[#4285F4]">g</span>
                      <span className="text-[#34A853]">l</span>
                      <span className="text-[#EA4335]">e</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-normal text-gray-700 tracking-tight mt-0.5">
                      Certificates
                    </div>
                  </div>

                  {/* Clean Horizontal Divider */}
                  <div className="border-b border-gray-100 mb-6" />

                  {/* 4 Feature Checklist Items */}
                  <div className="space-y-4">
                    {[
                      'Job-ready skills in high-growth fields',
                      '100% online, flexible self-paced learning',
                      'Verified certificate upon completion',
                      'Integrates with InGage Career Compass pathways'
                    ].map((text, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border border-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <svg
                            className="w-3 h-3 text-emerald-600 stroke-[2.5]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-sm sm:text-[15px] text-gray-700 leading-snug font-normal">
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Catalog Section */}
      <section id="courses-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        {/* Search & Main Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-8 shadow-2xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, skills or credentials..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 transition-all bg-gray-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-lime-500 transition-all cursor-pointer font-medium"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              {/* Price Filter */}
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-lime-500 transition-all cursor-pointer font-medium"
              >
                <option value="All">All Pricing</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3.5 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-lime-500 transition-all cursor-pointer font-medium"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="name_asc">Name A-Z</option>
              </select>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Tabs */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const count = cat === 'All' ? courses.length : (categoryCounts[cat] || 0);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-lime-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                  {count > 0 && <span className="ml-1.5 opacity-80 text-xs">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-16 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <p className="text-red-700 text-sm font-medium mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">No Google Courses Found</h3>
            <p className="text-xs text-gray-500 mb-5">
              Try adjusting your search query, level, or category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLevel('All');
                setSearchQuery('');
                setPriceFilter('All');
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = course.enrolled;
              const isCompleted = course.userStatus === 'COMPLETED' || course.userStatus === 'CREDENTIAL_EARNED';

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-lime-300 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Top Bar with Category, Level & Provider */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold">
                        {getCategoryIcon(course.category)}
                        <span>{course.category}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-lime-50 text-lime-800 border border-lime-200">
                          {course.level || 'Beginner'}
                        </span>
                        {course.free || (course.price || 0) <= 0 ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            ₹{course.price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Title */}
                    <h3
                      onClick={() => onNavigate(`/credential-edge/${course.slug}`)}
                      className="text-lg font-semibold text-gray-900 group-hover:text-lime-700 transition-colors cursor-pointer mb-2 line-clamp-2"
                    >
                      {course.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed flex-1">
                      {course.shortDescription || course.description}
                    </p>

                    {/* Credential Name Badge */}
                    {course.credentialName && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-4 flex items-start gap-2">
                        <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Credential</p>
                          <p className="text-[13px] font-semibold text-gray-800 line-clamp-1">{course.credentialName}</p>
                        </div>
                      </div>
                    )}

                    {/* Metadata: Duration & Rating */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{course.rating || 4.8}</span>
                        {course.learnersCount ? (
                          <span className="text-gray-400 font-normal">({course.learnersCount.toLocaleString()})</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Progress Bar (if user enrolled) */}
                    {isEnrolled && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-600">Your Progress</span>
                          <span className="text-lime-700 font-bold">{course.progressPercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progressPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer CTA Button */}
                  <div className="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-normal text-gray-500">
                      Provider: <strong className="text-gray-700 font-semibold">{course.provider || 'Google'}</strong>
                    </span>

                    <button
                      onClick={() => onNavigate(`/credential-edge/${course.slug}`)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : isEnrolled
                          ? 'bg-lime-600 hover:bg-lime-700 text-white shadow-2xs'
                          : 'bg-white hover:bg-lime-600 text-gray-800 hover:text-white border border-gray-200 hover:border-lime-600 shadow-2xs'
                      }`}
                    >
                      <span>
                        {isCompleted
                          ? 'View Credential'
                          : isEnrolled
                          ? 'Continue Learning'
                          : 'View Course'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Complete Your Career Flow Banner Section (Section 12) */}
        <div className="mt-16 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 rounded-3xl p-8 sm:p-10 text-white border border-gray-800 shadow-xl">
          <div className="max-w-3xl">
            <span className="px-3 py-1 rounded-full bg-lime-500/20 text-lime-400 text-xs font-bold uppercase tracking-wider inline-block mb-3">
              The 3-Track InGage Advantage
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Complete Your Career Flow
            </h3>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed">
              Connect what you learn with where you want to go. Follow structured pathways from role roadmap to job-ready credential.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-lime-400 font-bold block mb-1">1. Career Goal</span>
                <p className="text-sm font-bold text-white">Career Compass</p>
                <p className="text-xs text-gray-400 mt-1">Role Roadmaps & Placement Guidance</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-lime-400 font-bold block mb-1">2. Build Skills</span>
                <p className="text-sm font-bold text-white">Skill Forge</p>
                <p className="text-xs text-gray-400 mt-1">InGage Interactive Courses & Capstones</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-lime-400 font-bold block mb-1">3. Earn Credentials</span>
                <p className="text-sm font-bold text-white">Credential Edge</p>
                <p className="text-xs text-gray-400 mt-1">Google Certified Professional Credentials</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/careers')}
              className="px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-950 font-extrabold text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Continue Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CredentialEdgePage;
