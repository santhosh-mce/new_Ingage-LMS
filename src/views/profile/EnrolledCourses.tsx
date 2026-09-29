"use client";
import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, CheckCircle2, PlayCircle, Layers, Calendar } from 'lucide-react';
import { UserEnrollmentRecord } from '../../api/paymentApi';
import { getAccessibleImageUrl } from '../../api/authApi';

interface EnrolledCoursesProps {
  enrollments: UserEnrollmentRecord[];
  onNavigate: (path: string) => void;
  loading?: boolean;
}

export const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({
  enrollments,
  onNavigate,
  loading,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (id: number) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getStatusDisplay = (enr: UserEnrollmentRecord) => {
    const progress = enr.progressPercentage || 0;
    if (enr.status === 'COMPLETED' || progress >= 100) {
      return {
        label: 'Completed',
        badge: 'bg-emerald-600 text-white',
        icon: CheckCircle2,
      };
    }
    if (progress > 0) {
      return {
        label: 'In Progress',
        badge: 'bg-[#8DB600] text-gray-900',
        icon: PlayCircle,
      };
    }
    return {
      label: 'Not Started',
      badge: 'bg-gray-800 text-white',
      icon: Clock,
    };
  };

  const formatLastAccessed = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8DB600] shrink-0" />
              <span>Skill Forge — My Enrolled Courses</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Hands-on technical courses and interactive coding curriculum
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs bg-lime-100 text-lime-800 font-bold px-3 py-1 rounded-full border border-lime-200/60">
              {enrollments.length} {enrollments.length === 1 ? 'Course' : 'Courses'}
            </span>
            <button
              onClick={() => onNavigate('/courses')}
              className="text-xs sm:text-sm font-semibold text-[#8DB600] hover:text-[#7ba000] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore Skill Forge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Courses Content */}
        {enrollments.length === 0 ? (
          <div className="py-8 px-4 rounded-xl bg-gray-50/70 border border-dashed border-gray-200 text-center my-4">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2.5" />
            <h3 className="text-base font-bold text-gray-800">No courses enrolled yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto mb-5">
              Explore Skill Forge and start learning.
            </p>
            <button
              onClick={() => onNavigate('/courses')}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className={
              enrollments.length === 1
                ? 'w-full max-w-[340px]'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6'
            }
          >
            {enrollments.map((enr) => {
              const statusInfo = getStatusDisplay(enr);
              const StatusIcon = statusInfo.icon;
              const progress = enr.progressPercentage || 0;
              const isCompleted = statusInfo.label === 'Completed';
              const hasError = imageErrors[enr.id];

              return (
                <div
                  key={enr.id}
                  className="group bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-lime-400 transition-all duration-300 flex flex-col overflow-hidden w-full"
                >
                  {/* Course Thumbnail (16:9 aspect ratio, max-h-44) */}
                  <div className="relative w-full aspect-video max-h-44 bg-gray-100 overflow-hidden shrink-0">
                    {enr.thumbnail && !hasError ? (
                      <img
                        src={getAccessibleImageUrl(enr.thumbnail)}
                        alt={enr.courseTitle}
                        onError={() => handleImageError(enr.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-lime-50 to-emerald-100 text-lime-800 p-4">
                        <BookOpen className="w-9 h-9 mb-1 opacity-80" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {enr.category || 'Skill Forge'}
                        </span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${statusInfo.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Level Badges */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2 flex-wrap gap-1.5">
                        <span className="font-semibold text-lime-900 bg-lime-50 border border-lime-200/80 px-2.5 py-0.5 rounded-md text-xs">
                          {enr.category || 'Data & Analytics'}
                        </span>
                        {enr.accessType === 'CAREER_PATH_INCLUDED' ? (
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {enr.careerPathName || 'Career Path'}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-500">
                            {enr.level || 'Beginner'}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-[#6d8d00] transition-colors mb-2">
                        {enr.courseTitle || `Course #${enr.courseId}`}
                      </h3>

                      {/* Last Accessed */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last accessed: {formatLastAccessed(enr.lastAccessedAt)}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Continue Learning CTA */}
                    <div className="mt-2 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-bold text-lime-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3.5">
                        <div
                          className="bg-[#8DB600] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(progress, progress > 0 ? progress : 3)}%` }}
                        />
                      </div>

                      <button
                        onClick={() => onNavigate(`/courses/${enr.courseId}`)}
                        className="w-full inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 rounded-xl bg-gray-900 hover:bg-black active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs hover:shadow-md"
                      >
                        <span>{isCompleted ? 'Review Course' : 'Continue Learning'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-lime-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
