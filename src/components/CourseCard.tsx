"use client";
import React, { useState } from 'react';
import { Clock, User, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { CourseDto } from '../api/courseApi';
import { getAccessibleImageUrl } from '../api/authApi';

interface CourseCardProps {
  key?: React.Key;
  course: CourseDto;
  onViewCourse?: (course: CourseDto) => void;
}

export function CourseCard({ course, onViewCourse }: CourseCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'advanced':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleClick = () => {
    if (onViewCourse) {
      onViewCourse(course);
    }
  };

  return (
    <div
      data-testid={`course-card-${course.id}`}
      className="group bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-xl hover:border-lime-300 transition-all duration-300 flex flex-col overflow-hidden h-full"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden shrink-0">
        {course.thumbnail && !imageError ? (
          <img
            src={getAccessibleImageUrl(course.thumbnail)}
            alt={course.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-lime-50 to-emerald-100 text-lime-700">
            <BookOpen className="w-12 h-12 mb-2 opacity-70" />
            <span className="text-xs font-semibold uppercase tracking-wider">{course.category || 'Course'}</span>
          </div>
        )}

        {/* Category Pill Over Image */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-full shadow-xs border border-white/40">
          <Layers className="w-3 h-3 text-lime-600" />
          <span className="text-xs font-semibold text-gray-800 tracking-tight">{course.category}</span>
        </div>

        {/* Level Pill */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs ${getLevelBadgeColor(
              course.level
            )}`}
          >
            {course.level}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Course Title */}
          <h3 className="text-[17px] sm:text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-lime-700 transition-colors mb-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {course.description}
          </p>

          {/* Meta Information: Duration & Instructor */}
          <div className="flex items-center justify-between text-[13px] text-gray-500 py-2.5 border-t border-b border-gray-100 mb-4">
            <div className="flex items-center gap-1.5" title="Course Duration">
              <Clock className="w-3.5 h-3.5 text-lime-600 shrink-0" />
              <span className="font-normal text-gray-700">{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate max-w-[50%]" title={course.instructor}>
              <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="font-normal text-gray-700 truncate">{course.instructor}</span>
            </div>
          </div>
        </div>

        {/* Footer: Price & View Course Action */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium block">Price</span>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              {formatPrice(course.price)}
            </span>
          </div>

          <button
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8DB600] hover:bg-[#7a9f00] text-white text-sm font-semibold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer group-hover:translate-x-0.5"
            aria-label={`View course ${course.title}`}
          >
            <span>View Course</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
