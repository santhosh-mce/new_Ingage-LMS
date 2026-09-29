"use client";
import React from 'react';
import { Search, X } from 'lucide-react';

interface CourseSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CourseSearchBar: React.FC<CourseSearchBarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="relative w-full sm:w-72 lg:w-80">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        id="course-search-input"
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search your courses..."
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#8DB600] focus:ring-2 focus:ring-lime-100 transition-all shadow-2xs"
      />

      {searchQuery && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="Clear search input"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
