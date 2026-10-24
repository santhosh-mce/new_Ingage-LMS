"use client";

import React, { useState, useMemo } from 'react';
import {
  Video,
  HelpCircle,
  FolderArchive,
  Radio,
  Layers,
  BookOpen,
} from 'lucide-react';
import { VideosTabManager } from './curriculum/VideosTabManager';
import { QuizzesTabManager } from './curriculum/QuizzesTabManager';
import { ProjectsTabManager } from './curriculum/ProjectsTabManager';
import { LiveClassesTabManager } from './curriculum/LiveClassesTabManager';

export interface AdminCurriculumBuilderProps {
  courseId?: number | string | null;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  courseInstructor?: string;
  onShowToast?: (msg: string, type?: any) => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null | undefined>;
}

export type AdminCurriculumTab = 'VIDEOS' | 'QUIZZES' | 'PROJECTS' | 'LIVE_CLASSES';

export const AdminCurriculumBuilder: React.FC<AdminCurriculumBuilderProps> = ({
  courseId,
  sections,
  setSections,
  courseInstructor = 'InGage Lead Instructor',
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  const [activeTab, setActiveTab] = useState<AdminCurriculumTab>('VIDEOS');

  // Compute counts for all 4 content types across all sections
  const counts = useMemo(() => {
    let videoCount = 0;
    let quizCount = 0;
    let projectCount = 0;
    let liveCount = 0;

    sections.forEach((sec) => {
      const lessons = sec.lessons || sec.course_lessons || [];
      lessons.forEach((l: any) => {
        const type = (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase();
        if (type === 'VIDEO') videoCount++;
        else if (type === 'QUIZ') quizCount++;
        else if (type === 'PROJECT' || type === 'ASSIGNMENT') projectCount++;
        else if (type === 'LIVE_CLASS') liveCount++;
      });
    });

    return { videoCount, quizCount, projectCount, liveCount };
  }, [sections]);

  const tabs: {
    id: AdminCurriculumTab;
    label: string;
    icon: React.ElementType;
    count: number;
    activeClass: string;
    activeBadgeClass: string;
  }[] = [
    {
      id: 'VIDEOS',
      label: 'Videos',
      icon: Video,
      count: counts.videoCount,
      activeClass: 'bg-emerald-600 text-white shadow-sm',
      activeBadgeClass: 'bg-emerald-800/40 text-emerald-100',
    },
    {
      id: 'QUIZZES',
      label: 'Quizzes',
      icon: HelpCircle,
      count: counts.quizCount,
      activeClass: 'bg-amber-600 text-white shadow-sm',
      activeBadgeClass: 'bg-amber-800/40 text-amber-100',
    },
    {
      id: 'PROJECTS',
      label: 'Projects',
      icon: FolderArchive,
      count: counts.projectCount,
      activeClass: 'bg-indigo-600 text-white shadow-sm',
      activeBadgeClass: 'bg-indigo-800/40 text-indigo-100',
    },
    {
      id: 'LIVE_CLASSES',
      label: 'Live Classes',
      icon: Radio,
      count: counts.liveCount,
      activeClass: 'bg-sky-600 text-white shadow-sm',
      activeBadgeClass: 'bg-sky-800/40 text-sky-100',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200/90 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Curriculum & Content Architecture
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Independent management for course content. Videos, Quizzes, Projects, and Live Classes are structured into dedicated, isolated workflows.
            </p>
          </div>

          {/* 4 Dedicated Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? tab.activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                      isActive ? tab.activeBadgeClass : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content View */}
      <div className="p-5 sm:p-6">
        {activeTab === 'VIDEOS' && (
          <VideosTabManager
            courseId={courseId}
            sections={sections}
            setSections={setSections}
            onShowToast={onShowToast}
            onSaveDraftIfNeeded={onSaveDraftIfNeeded}
          />
        )}

        {activeTab === 'QUIZZES' && (
          <QuizzesTabManager
            courseId={courseId}
            sections={sections}
            setSections={setSections}
            onShowToast={onShowToast}
            onSaveDraftIfNeeded={onSaveDraftIfNeeded}
          />
        )}

        {activeTab === 'PROJECTS' && (
          <ProjectsTabManager
            courseId={courseId}
            sections={sections}
            setSections={setSections}
            onShowToast={onShowToast}
            onSaveDraftIfNeeded={onSaveDraftIfNeeded}
          />
        )}

        {activeTab === 'LIVE_CLASSES' && (
          <LiveClassesTabManager
            courseId={courseId}
            sections={sections}
            setSections={setSections}
            courseInstructor={courseInstructor}
            onShowToast={onShowToast}
            onSaveDraftIfNeeded={onSaveDraftIfNeeded}
          />
        )}
      </div>
    </div>
  );
};
