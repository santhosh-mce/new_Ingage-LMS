"use client";
import React from 'react';
import { BookOpen, CheckCircle2, FolderGit2, Award, TrendingUp, Sparkles } from 'lucide-react';
import { DashboardSummaryDto } from '../../api/profileApi';

interface ProfileSummaryCardsProps {
  summary?: DashboardSummaryDto | null;
  onNavigateTab?: (tab: string) => void;
}

export const ProfileSummaryCards: React.FC<ProfileSummaryCardsProps> = ({
  summary,
  onNavigateTab,
}) => {
  const cards = [
    {
      id: 'learning',
      label: 'Learning',
      title: 'Courses Enrolled',
      value: summary?.coursesEnrolled ?? 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      tab: 'learning',
    },
    {
      id: 'completed',
      label: 'Completed',
      title: 'Courses Completed',
      value: summary?.coursesCompleted ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      tab: 'learning',
    },
    {
      id: 'projects',
      label: 'Projects',
      title: 'Projects Completed',
      value: summary?.projectsCompleted ?? 0,
      icon: FolderGit2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      tab: 'projects',
    },
    {
      id: 'credentials',
      label: 'Credentials',
      title: 'Credentials Earned',
      value: summary?.credentialsEarned ?? 0,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      tab: 'credentials',
    },
    {
      id: 'career',
      label: 'Career',
      title: 'Career Readiness',
      value: `${summary?.careerReadinessPercentage ?? 0}%`,
      icon: TrendingUp,
      color: 'text-[#8DB600]',
      bgColor: 'bg-lime-50',
      borderColor: 'border-lime-200',
      tab: 'career',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigateTab && onNavigateTab(card.tab)}
            className={`p-4 rounded-2xl bg-white border ${card.borderColor} shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.bgColor} ${card.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                {card.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
