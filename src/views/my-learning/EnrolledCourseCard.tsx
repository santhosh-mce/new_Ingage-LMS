"use client";
import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Award,
  CircleDashed,
  ExternalLink
} from 'lucide-react';
import { UserEnrollmentRecord } from '../../api/paymentApi';
import { getAccessibleImageUrl } from '../../api/authApi';

interface EnrolledCourseCardProps {
  course: UserEnrollmentRecord;
  onNavigate: (path: string, param?: string) => void;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ course, onNavigate }) => {
  const [imageError, setImageError] = useState(false);

  // Safe percentage calculation
  const rawProgress = typeof course.progressPercentage === 'number' ? course.progressPercentage : 0;
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));

  const isCompleted = course.status === 'COMPLETED' || progress >= 100;
  const isNotStarted = !isCompleted && progress === 0;
  const isInProgress = !isCompleted && !isNotStarted;

  const targetPath = `/courses/${course.courseSlug || course.courseId}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedEnrolledDate = formatDate(course.enrolledAt);
  const formattedLastAccessed = formatDate(course.lastAccessedAt);

  return (
    <div
      data-testid={`enrolled-course-${course.courseId}`}
      className="group bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-lime-300 transition-all duration-300 flex flex-col overflow-hidden h-full justify-between"
    >
      <div>
        {/* Course Thumbnail */}
        <div className="relative w-full h-44 bg-gray-100 overflow-hidden shrink-0">
          {course.thumbnail && !imageError ? (
            <img
              src={getAccessibleImageUrl(course.thumbnail)}
              alt={course.courseTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-lime-50 to-emerald-100 text-lime-800">
              <BookOpen className="w-12 h-12 mb-1 opacity-70" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {course.category || 'Curriculum'}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </span>
            ) : isInProgress ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#8DB600] text-gray-900 shadow-xs">
                <PlayCircle className="w-3.5 h-3.5" />
                In Progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-white shadow-xs">
                <CircleDashed className="w-3.5 h-3.5" />
                Not Started
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Category & Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2 gap-2 flex-wrap">
            <span className="font-semibold text-lime-800 bg-lime-50 px-2.5 py-0.5 rounded-md border border-lime-100">
              {course.category || 'General'}
            </span>

            {course.accessType === 'CAREER_PATH_INCLUDED' ? (
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Included with {course.careerPathName || 'Career Path'}
              </span>
            ) : course.accessType === 'BOTH' ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Direct & Career Included
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                Purchased Course
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 group-hover:text-lime-800 transition-colors leading-snug">
            {course.courseTitle || `Course #${course.courseId}`}
          </h3>

          {/* Instructor (if provided) */}
          {course.instructor && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Instructor: {course.instructor}</span>
            </div>
          )}

          {/* Date Information */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-2.5 border-t border-gray-100">
            {formattedEnrolledDate && (
              <span>Enrolled: {formattedEnrolledDate}</span>
            )}
            {formattedLastAccessed && (
              <span className="text-right ml-auto">Accessed: {formattedLastAccessed}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Progress Bar & Action Buttons */}
      <div className="p-5 pt-0">
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-gray-500">Progress</span>
            <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-lime-700'}`}>
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-emerald-500' : 'bg-[#8DB600]'
              }`}
              style={{ width: `${Math.max(progress, isNotStarted ? 0 : 3)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isInProgress && (
            <>
              <button
                onClick={() => onNavigate(targetPath)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate(targetPath)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                title="View course curriculum"
              >
                View
              </button>
            </>
          )}

          {isCompleted && (
            <>
              <button
                onClick={() => onNavigate(targetPath)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <span>View Course</span>
              </button>
              <button
                onClick={() => onNavigate('/profile/certificates')}
                className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                title="View Course Certificate"
              >
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Certificate</span>
              </button>
            </>
          )}

          {isNotStarted && (
            <>
              <button
                onClick={() => onNavigate(targetPath)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Start Learning</span>
              </button>
              <button
                onClick={() => onNavigate(targetPath)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                title="View course curriculum"
              >
                View
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
