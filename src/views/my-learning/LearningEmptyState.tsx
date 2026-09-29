"use client";
import React from 'react';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface LearningEmptyStateProps {
  onNavigate: (path: string) => void;
}

export const LearningEmptyState: React.FC<LearningEmptyStateProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-lime-50 text-lime-700 flex items-center justify-center mx-auto mb-4 border border-lime-200/60 shadow-2xs">
        <BookOpen className="w-8 h-8" />
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
        No courses yet
      </h3>

      <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
        You haven't enrolled in any courses yet. Explore available industry-aligned courses and start learning today.
      </p>

      <button
        id="empty-browse-courses-btn"
        onClick={() => onNavigate('/courses')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-sm shadow-xs hover:shadow-md transition-all cursor-pointer"
      >
        <span>Browse Courses</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
