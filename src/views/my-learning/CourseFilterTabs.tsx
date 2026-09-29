"use client";
import React from 'react';

export type CourseStatusFilter = 'all' | 'in-progress' | 'completed' | 'not-started';

interface CourseFilterTabsProps {
  currentFilter: CourseStatusFilter;
  onFilterChange: (filter: CourseStatusFilter) => void;
  counts: {
    all: number;
    inProgress: number;
    completed: number;
    notStarted: number;
  };
}

export const CourseFilterTabs: React.FC<CourseFilterTabsProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const tabs: Array<{ id: CourseStatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'All Courses', count: counts.all },
    { id: 'in-progress', label: 'In Progress', count: counts.inProgress },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'not-started', label: 'Not Started', count: counts.notStarted },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-2xl overflow-x-auto scrollbar-none w-full sm:w-auto">
      {tabs.map((tab) => {
        const isActive = currentFilter === tab.id;
        return (
          <button
            key={tab.id}
            id={`filter-tab-${tab.id}`}
            onClick={() => onFilterChange(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                isActive
                  ? 'bg-lime-100 text-lime-800'
                  : 'bg-gray-200/80 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
