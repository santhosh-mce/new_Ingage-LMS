"use client";
import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { ProfileDto } from '../../api/profileApi';

interface ProfileCompletionCardProps {
  profile: ProfileDto | null;
  onNavigateTab: (tab: string) => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  profile,
  onNavigateTab,
}) => {
  const percentage = profile?.profileCompletionPercentage ?? 0;
  const completedList = profile?.completedSections ?? [];
  const missingList = profile?.missingSections ?? [];

  // Map section name to tab id
  const getTabForSection = (sectionName: string) => {
    const lower = sectionName.toLowerCase();
    if (lower.includes('personal')) return 'personal';
    if (lower.includes('education')) return 'education';
    if (lower.includes('career')) return 'career';
    if (lower.includes('skill')) return 'skills';
    if (lower.includes('project')) return 'projects';
    if (lower.includes('resume')) return 'resume';
    if (lower.includes('link')) return 'personal';
    return 'personal';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-lime-100 text-[#8DB600]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-gray-900">
              Profile Strength & Completeness
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Complete your profile to increase visibility to recruiters and unlock targeted recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">{percentage}%</div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {percentage >= 80 ? 'All-Star' : percentage >= 50 ? 'Intermediate' : 'Beginner'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-5">
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8DB600] to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Completed Sections */}
        {completedList.map((item, idx) => (
          <div
            key={`completed-${idx}`}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{item}</span>
            <span className="ml-auto text-[10px] font-bold uppercase text-emerald-600">Done</span>
          </div>
        ))}

        {/* Missing Sections */}
        {missingList.map((item, idx) => {
          const targetTab = getTabForSection(item);
          return (
            <div
              key={`missing-${idx}`}
              onClick={() => onNavigateTab(targetTab)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 hover:bg-amber-100/60 transition-colors cursor-pointer group"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{item}</span>
              <span className="ml-auto flex items-center gap-1 font-bold text-[#8DB600] group-hover:underline">
                Complete <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
