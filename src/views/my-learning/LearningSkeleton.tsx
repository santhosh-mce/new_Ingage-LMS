"use client";
import React from 'react';

export const LearningSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-gray-200 rounded w-2/3"></div>
              <div className="w-8 h-8 rounded-xl bg-gray-100"></div>
            </div>
            <div className="h-7 bg-gray-200 rounded w-1/3 mt-3"></div>
            <div className="h-2.5 bg-gray-100 rounded w-3/4 mt-2"></div>
          </div>
        ))}
      </div>

      {/* Skeleton Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <div className="h-10 bg-gray-200/80 rounded-2xl w-full sm:w-96"></div>
        <div className="h-10 bg-gray-200/80 rounded-xl w-full sm:w-72"></div>
      </div>

      {/* Skeleton Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
            <div className="h-44 bg-gray-200"></div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-2 bg-gray-200 rounded w-full mt-4"></div>
              <div className="h-9 bg-gray-200 rounded-xl w-full mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
