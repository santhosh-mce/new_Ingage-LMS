"use client";
import React, { useState, useEffect } from 'react';
import { Search, X, RefreshCw, BookOpen, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { CourseDto } from '../api/courseApi';
import { CourseCard } from '../components/CourseCard';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCourses } from '../store/slices/courseSlice';

interface CoursesPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (message: string) => void;
}

const CATEGORIES = [
  'All',
  'Web Development',
  'Backend Development',
  'Frontend Development',
  'Data & Analytics',
  'Cloud & DevOps'
];

export function CoursesPage({ onNavigate, onShowToast }: CoursesPageProps) {
  const dispatch = useAppDispatch();
  const { courses, loading, error } = useAppSelector((state) => state.course);
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Debounce search input (300ms), fetch immediately on initial mount
  useEffect(() => {
    if (searchInput === '' && courses.length === 0) {
      setActiveSearch('');
      dispatch(fetchCourses(''));
      return;
    }
    const timer = setTimeout(() => {
      setActiveSearch(searchInput);
      dispatch(fetchCourses(searchInput));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedCategory('All');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setSearchInput('');
    } else {
      setSearchInput(category);
    }
  };

  const handleViewCourse = (course: CourseDto) => {
    if (onShowToast) {
      onShowToast(`Viewing course: ${course.title}`);
    }
    onNavigate(`/courses/${course.id}`, String(course.id));
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-20">
      {/* Hero / Header Section */}
      <div className="bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-50 text-lime-800 border border-lime-200/60 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-lime-600" />
              <span>Skill-Ready Course Discovery</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Explore Industry-Leading <span className="text-lime-600">Courses</span>
            </h1>

            <p className="text-[15px] sm:text-base text-gray-600 leading-relaxed max-w-2xl mb-8">
              Gain job-ready competencies with real-world curriculum, hands-on architectures, and guided mentorship designed to accelerate your career.
            </p>

            {/* Search Input Bar */}
            <div className="w-full max-w-xl relative">
              <div className="relative flex items-center shadow-xs hover:shadow-md transition-shadow">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
                <input
                  id="course-search-input"
                  data-testid="course-search-input"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search courses by title, topic, or category (e.g., Java, React)..."
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50/70 hover:bg-white focus:bg-white text-sm text-gray-900 placeholder:text-gray-400 rounded-2xl border border-gray-300 focus:outline-hidden focus:border-lime-500 focus:ring-2 focus:ring-lime-100 transition-all"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    aria-label="Clear search input"
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                <span>Filters:</span>
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-lime-600 text-white shadow-xs font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Results Metadata / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-lime-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {activeSearch.trim() ? `Search Results for "${activeSearch}"` : 'All Available Courses'}
            </h2>
            {!loading && !error && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full ml-1">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'}
              </span>
            )}
          </div>

          {activeSearch.trim() && (
            <button
              onClick={handleClearSearch}
              className="text-xs font-semibold text-lime-700 hover:text-lime-800 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Clear search</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* State 1: Loading State */}
        {loading && (
          <div>
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-8 py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-lime-600" />
              <span className="text-sm font-medium">Loading courses...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse flex flex-col h-96">
                  <div className="w-full h-44 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-3" />
                  <div className="h-4 bg-gray-100 rounded-md w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded-md w-2/3 mb-6" />
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded-md w-1/4" />
                    <div className="h-9 bg-gray-200 rounded-xl w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State 2: Error State */}
        {!loading && error && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to load courses.</h3>
            <p className="text-sm text-gray-600 mb-6">{error || 'Please try again.'}</p>
            <button
              onClick={() => dispatch(fetchCourses(activeSearch))}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* State 3: Empty State (No Search Results or No Courses) */}
        {!loading && !error && courses.length === 0 && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7" />
            </div>

            {activeSearch.trim() ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No courses found for "{activeSearch}".
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  We couldn't find any courses matching your search. Try searching for a different keyword or category.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Search Filter</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No courses available.</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Check back soon as new programs and courses are frequently added to the catalog.
                </p>
                <button
                  onClick={() => dispatch(fetchCourses(''))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Catalog</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* State 4: Success Grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onViewCourse={handleViewCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoursesPage;
