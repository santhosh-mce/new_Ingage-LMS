"use client";
import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface NoSearchResultsProps {
  onReset: () => void;
  searchQuery?: string;
  hasFilter?: boolean;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  onReset,
  searchQuery,
  hasFilter,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
        <SearchX className="w-7 h-7" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
        No courses found
      </h3>

      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1.5 mb-6">
        {searchQuery
          ? `No courses match "${searchQuery}". Try a different keyword or reset the filter.`
          : 'No courses match the selected status filter.'}
      </p>

      <button
        id="reset-search-filters-btn"
        onClick={onReset}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
      >
        <RotateCcw className="w-4 h-4 text-gray-500" />
        <span>Reset Search & Filters</span>
      </button>
    </div>
  );
};
