"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMyEnrollments } from '../store/slices/courseSlice';

import { LearningSummaryCards } from './my-learning/LearningSummaryCards';
import { CourseFilterTabs, CourseStatusFilter } from './my-learning/CourseFilterTabs';
import { CourseSearchBar } from './my-learning/CourseSearchBar';
import { EnrolledCourseCard } from './my-learning/EnrolledCourseCard';
import { LearningEmptyState } from './my-learning/LearningEmptyState';
import { NoSearchResults } from './my-learning/NoSearchResults';
import { LearningSkeleton } from './my-learning/LearningSkeleton';

interface MyLearningPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function MyLearningPage({ onNavigate, onShowToast }: MyLearningPageProps) {
  const dispatch = useAppDispatch();
  const {
    enrollments,
    enrollmentsLoading: loading,
    enrollmentsError: error,
  } = useAppSelector((state) => state.course);

  const [currentFilter, setCurrentFilter] = useState<CourseStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch real enrollments on mount
  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchMyEnrollments());
  };

  // Dynamic filter counts
  const counts = useMemo(() => {
    const all = enrollments.length;

    const inProgress = enrollments.filter(
      (e) => e.status === 'ACTIVE' && (e.progressPercentage || 0) < 100 && (e.progressPercentage || 0) > 0
    ).length;

    const completed = enrollments.filter(
      (e) => e.status === 'COMPLETED' || (e.progressPercentage !== undefined && e.progressPercentage >= 100)
    ).length;

    const notStarted = enrollments.filter(
      (e) => (e.progressPercentage || 0) === 0 && e.status !== 'COMPLETED'
    ).length;

    return { all, inProgress, completed, notStarted };
  }, [enrollments]);

  // Combined status filter & search query filtering
  const filteredCourses = useMemo(() => {
    return enrollments.filter((course) => {
      const rawProgress = typeof course.progressPercentage === 'number' ? course.progressPercentage : 0;
      const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));
      const isCompleted = course.status === 'COMPLETED' || progress >= 100;
      const isNotStarted = !isCompleted && progress === 0;
      const isInProgress = !isCompleted && !isNotStarted;

      // 1. Status Filter Check
      if (currentFilter === 'in-progress' && !isInProgress) return false;
      if (currentFilter === 'completed' && !isCompleted) return false;
      if (currentFilter === 'not-started' && !isNotStarted) return false;

      // 2. Search Query Check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (course.courseTitle || '').toLowerCase().includes(query);
        const categoryMatch = (course.category || '').toLowerCase().includes(query);
        const instructorMatch = (course.instructor || '').toLowerCase().includes(query);

        if (!titleMatch && !categoryMatch && !instructorMatch) {
          return false;
        }
      }

      return true;
    });
  }, [enrollments, currentFilter, searchQuery]);

  const handleResetFilters = () => {
    setCurrentFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-[calc(100vh-4.5rem)] pb-16">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-8 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              My Learning
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Continue your learning journey and track your progress.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh learning data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8DB600]' : 'text-gray-500'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error State Banner with Retry */}
        {error && !loading && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Unable to load your learning data.</p>
                <p className="text-xs text-rose-700 mt-0.5">{error} — Please check your network or try again.</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State: Skeletons */}
        {loading && <LearningSkeleton />}

        {/* Content State: Real Data Loaded */}
        {!loading && (
          <>
            {/* Learning Summary Statistics */}
            <LearningSummaryCards enrollments={enrollments} />

            {/* Zero Enrollments Empty State */}
            {enrollments.length === 0 ? (
              <LearningEmptyState onNavigate={onNavigate} />
            ) : (
              <div className="space-y-6 pt-2">
                {/* Controls Bar: Filters Tabs & Search Field */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CourseFilterTabs
                    currentFilter={currentFilter}
                    onFilterChange={setCurrentFilter}
                    counts={counts}
                  />

                  <CourseSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>

                {/* Filter & Search Results Count (when searching or filtered) */}
                {(searchQuery.trim() || currentFilter !== 'all') && (
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>
                      Showing <strong className="text-gray-900">{filteredCourses.length}</strong> of{' '}
                      <strong className="text-gray-900">{enrollments.length}</strong> courses
                    </span>
                    <button
                      onClick={handleResetFilters}
                      className="text-lime-700 hover:text-lime-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}

                {/* No Search / Filter Matches State */}
                {filteredCourses.length === 0 ? (
                  <NoSearchResults
                    onReset={handleResetFilters}
                    searchQuery={searchQuery}
                    hasFilter={currentFilter !== 'all'}
                  />
                ) : (
                  /* Course Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.map((course) => (
                      <EnrolledCourseCard
                        key={course.id}
                        course={course}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyLearningPage;
