"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  TrendingUp,
  BarChart3,
  Database,
  Palette,
  Shield,
  Laptop,
  ArrowRight,
  Users,
  Star,
  Clock,
  LayoutGrid,
  Bot,
  LineChart,
  Code,
  Settings,
  Cpu,
  Box,
  Cloud,
  Layers,
  Smartphone,
  Activity,
  Sparkles,
  CheckSquare,
  Share2,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getCareers, getCareerCategories, CareerDto } from '../api/careerApi';

interface CareersPageProps {
  onNavigate: (path: string, param?: string) => void;
}

function getRoleIcon(iconName?: string) {
  const props = { className: "w-5 h-5 text-gray-800" };
  switch (iconName) {
    case 'BarChart3': return <BarChart3 {...props} />;
    case 'Database': return <Database {...props} />;
    case 'TrendingUp': return <TrendingUp {...props} />;
    case 'Bot': return <Bot {...props} />;
    case 'LineChart': return <LineChart {...props} />;
    case 'Code': return <Code {...props} />;
    case 'Settings': return <Settings {...props} />;
    case 'Cpu': return <Cpu {...props} />;
    case 'Box': return <Box {...props} />;
    case 'Palette': return <Palette {...props} />;
    case 'Shield': return <Shield {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'Cloud': return <Cloud {...props} />;
    case 'Layers': return <Layers {...props} />;
    case 'Smartphone': return <Smartphone {...props} />;
    case 'Activity': return <Activity {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'CheckSquare': return <CheckSquare {...props} />;
    case 'Share2': return <Share2 {...props} />;
    default: return <Briefcase {...props} />;
  }
}

export function CareersPage({ onNavigate }: CareersPageProps) {
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [featuredCareers, setFeaturedCareers] = useState<CareerDto[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [totalElements, setTotalElements] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Load distinct categories from backend
  useEffect(() => {
    getCareerCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(['All', ...cats]);
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic categories, fallback to defaults', err);
        setCategories([
          'All',
          'Data & Analytics',
          'Software Engineering',
          'Design & Product',
          'Security & Infrastructure',
          'Growth & Marketing',
          'Management & Operations'
        ]);
      });
  }, []);

  // Fetch careers from backend API
  const fetchCareersData = useCallback(async (searchQuery: string, cat: string, lvl: string) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        size: 50, // Retrieve full catalog for smooth browsing
        sortBy: 'displayOrder',
        sortDir: 'asc'
      };

      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (cat !== 'All') {
        params.category = cat;
      }
      if (lvl !== 'All') {
        params.level = lvl;
      }

      const response = await getCareers(params);
      setCareers(response.content || []);
      setTotalElements(response.totalElements || 0);

      // Derive or fetch top featured roles
      const featured = (response.content || []).filter(c => c.featured || c.popular).slice(0, 3);
      setFeaturedCareers(featured);
    } catch (err: any) {
      console.error('Failed to load careers from backend:', err);
      setError('Unable to load careers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchInput);
      fetchCareersData(searchInput, selectedCategory, selectedLevel);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, selectedCategory, selectedLevel, fetchCareersData]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSearchInput('');
    setActiveSearch('');
  };

  const renderRoleCard = (role: CareerDto) => (
    <div
      key={role.id}
      id={`role-card-${role.slug}`}
      onClick={() => onNavigate(`/roles/${role.slug}`, role.slug)}
      className="group bg-white rounded-2xl border border-gray-200/90 hover:border-[#8DB600] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer overflow-hidden relative"
    >
      {/* Cover Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100">
        <img
          src={role.imageUrl || (role as any).image_url || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80'}
          alt={role.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Featured / Trending Badge */}
        {(role.featured || role.popular) && (
          <div className="absolute top-3 right-3 bg-[#ef4444] text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <TrendingUp className="w-3 h-3" />
            <span>Trending</span>
          </div>
        )}

        {/* Floating Icon overlapping bottom-left of image */}
        <div className="absolute bottom-3 left-4 w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300">
          {getRoleIcon(role.icon)}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-[#8DB600] transition-colors leading-snug">
            {role.title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {role.shortDescription || role.description}
          </p>

          {/* Badges: Level & Duration */}
          <div className="mt-3.5 flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                role.level === 'Beginner'
                  ? 'bg-[#8DB600]/10 text-[#658500] border-[#8DB600]/25'
                  : role.level === 'Intermediate'
                  ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                  : 'bg-[#faf5ff] text-[#7e22ce] border-[#e9d5ff]'
              }`}
            >
              {role.level}
            </span>
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{role.duration}</span>
            </span>
          </div>

          {/* Stats: Avg. Salary & Job Openings */}
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-normal">Avg. Salary</span>
              <span className="font-bold text-[#8DB600]">{role.salary?.formatted || ((role as any).salary_min && (role as any).salary_max ? `₹${(Number((role as any).salary_min)/100000).toFixed(1)} - ₹${(Number((role as any).salary_max)/100000).toFixed(1)} LPA` : 'Competitive')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-normal">Job Openings</span>
              <span className="font-semibold text-gray-800">{role.jobOpenings || (role as any).job_openings || 'Active hiring'}</span>
            </div>
          </div>
        </div>

        {/* Footer: Modules count & Arrow */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">{role.modulesCount || 10} modules</span>
          <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-[#8DB600]/10 flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4 text-[#8DB600] group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#f8fafc] pb-8">
      {/* Hero Banner with #8DB600 Background (Theme Color) */}
      <section className="bg-[#8DB600] text-white pt-10 pb-16 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 w-full">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            Explore Career Paths
          </h1>
          <p className="mt-2.5 text-white/90 text-sm sm:text-base max-w-3xl leading-relaxed">
            Discover in-demand careers with structured learning paths designed to take you from beginner to job-ready professional.
          </p>

          {/* 3 Frosted Stat Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">50,000+</div>
                <div className="text-xs sm:text-sm text-white/90 font-medium">Active Learners</div>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">180,000+</div>
                <div className="text-xs sm:text-sm text-white/90 font-medium">Job Openings</div>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-white">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">4.8/5</div>
                <div className="text-xs sm:text-sm text-white/90 font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar Container (Floating over hero) */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 -mt-7 relative z-20">
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-lg p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="careers-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by career, skill, or keyword..."
                className="w-full pl-10 sm:pl-11 pr-4 py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:border-[#8DB600] focus:ring-2 focus:ring-[#8DB600]/20 transition-all placeholder:text-gray-400"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Button */}
            <button
              id="careers-filter-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                showFilters || selectedCategory !== 'All' || selectedLevel !== 'All'
                  ? 'bg-[#8DB600]/10 border-[#8DB600] text-[#7a9f00]'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {(selectedCategory !== 'All' || selectedLevel !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#8DB600]" />
              )}
            </button>
          </div>

          {/* Expandable Filter Drawer */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Level Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[70px]">Level:</span>
                <div className="flex flex-wrap gap-1.5">
                  {levels.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        selectedLevel === lvl
                          ? 'bg-[#8DB600] hover:bg-[#7a9f00] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider min-w-[70px]">Domain:</span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-gray-900 text-white font-semibold'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Filters */}
              {(selectedCategory !== 'All' || selectedLevel !== 'All' || searchInput) && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 mt-8">
        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between text-sm text-gray-500 font-medium">
          <span>
            {loading ? 'Searching career paths...' : `Showing ${careers.length} of ${totalElements} career paths`}
          </span>
          {(selectedCategory !== 'All' || selectedLevel !== 'All' || activeSearch) && (
            <span className="text-xs text-[#7a9f00] bg-[#8DB600]/10 px-2.5 py-1 rounded-md font-semibold">
              Filtered
            </span>
          )}
        </div>

        {/* Loading State Skeleton */}
        {loading && (
          <div>
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-8 py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-[#8DB600]" />
              <span className="text-sm font-medium">Loading career catalog from server...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse flex flex-col h-96">
                  <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded-md w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded-md w-2/3 mb-6" />
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded-md w-1/3" />
                    <div className="h-7 w-7 bg-gray-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Unable to load careers.</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4">
              Please try again.
            </p>
            <button
              onClick={() => fetchCareersData(activeSearch, selectedCategory, selectedLevel)}
              className="px-5 py-2.5 bg-[#8DB600] hover:bg-[#7a9f00] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && careers.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {activeSearch ? `No careers match your search "${activeSearch}".` : 'No careers found.'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-4">
              Try adjusting your search query or reset your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#8DB600] text-white rounded-xl text-xs font-semibold hover:bg-[#7a9f00] transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Content: Featured & All Career Paths */}
        {!loading && !error && careers.length > 0 && (
          <>
            {/* Section 1: Featured Career Paths (Shown when no search/filters active) */}
            {selectedCategory === 'All' && selectedLevel === 'All' && !activeSearch && featuredCareers.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <span>✨</span>
                  <span>Featured Career Paths</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {featuredCareers.map(renderRoleCard)}
                </div>
              </section>
            )}

            {/* Section 2: All Career Paths */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                All Career Paths
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {careers.map(renderRoleCard)}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Floating Action Button (Scroll to top) */}
      <button
        id="career-fab"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="fixed bottom-18 sm:bottom-24 right-4 sm:right-6 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#8DB600] hover:bg-[#7a9f00] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-30 cursor-pointer"
        title="Scroll to top"
      >
        <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );
}

export default CareersPage;
