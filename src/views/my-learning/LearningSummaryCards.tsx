"use client";
import React from 'react';
import { BookOpen, Clock, CheckCircle2, CircleDashed } from 'lucide-react';
import { UserEnrollmentRecord } from '../../api/paymentApi';

interface LearningSummaryCardsProps {
  enrollments: UserEnrollmentRecord[];
}

export const LearningSummaryCards: React.FC<LearningSummaryCardsProps> = ({ enrollments }) => {
  const enrolledCount = enrollments.length;

  const inProgressCount = enrollments.filter(
    (e) => e.status === 'ACTIVE' && (e.progressPercentage || 0) < 100 && (e.progressPercentage || 0) > 0
  ).length;

  const completedCount = enrollments.filter(
    (e) => e.status === 'COMPLETED' || (e.progressPercentage !== undefined && e.progressPercentage >= 100)
  ).length;

  const notStartedCount = enrollments.filter(
    (e) => (e.progressPercentage || 0) === 0 && e.status !== 'COMPLETED'
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Courses Enrolled */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:border-lime-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Courses Enrolled
          </span>
          <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {enrolledCount}
        </div>
        <p className="text-xs text-gray-400 mt-1">Total active enrollments</p>
      </div>

      {/* 2. In Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:border-amber-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            In Progress
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {inProgressCount}
        </div>
        <p className="text-xs text-gray-400 mt-1">Active learning courses</p>
      </div>

      {/* 3. Completed */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Completed
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {completedCount}
        </div>
        <p className="text-xs text-gray-400 mt-1">100% finished curriculum</p>
      </div>

      {/* 4. Not Started */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:border-slate-200 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Not Started
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <CircleDashed className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {notStartedCount}
        </div>
        <p className="text-xs text-gray-400 mt-1">Enrolled, ready to start</p>
      </div>
    </div>
  );
};
