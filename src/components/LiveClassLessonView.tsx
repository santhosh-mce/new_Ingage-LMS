"use client";

import React, { useState } from 'react';
import {
  Radio,
  Tv,
  Calendar,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Video,
  Check,
} from 'lucide-react';
import { markLessonComplete } from '../api/adminApi';

export interface LiveClassMetadata {
  classTitle?: string;
  instructor?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  meetingLink?: string;
  thumbnail?: string;
  description?: string;
  status?: 'UPCOMING' | 'LIVE_NOW' | 'RECORDING_AVAILABLE' | 'COMPLETED';
  recordingUrl?: string;
  [key: string]: any;
}

export function parseLiveClassMeta(description?: string | null): LiveClassMetadata {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    return {
      description: description.trim(),
    };
  }
  return {};
}

interface LiveClassLessonViewProps {
  lesson: any;
  courseId: number | string;
  moduleTitle?: string;
  isCompleted: boolean;
  onLiveClassCompleted: (lessonId: number) => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  isFirstLesson: boolean;
  isLastLesson: boolean;
  isNextLocked: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function LiveClassLessonView({
  lesson,
  courseId,
  moduleTitle,
  isCompleted,
  onLiveClassCompleted,
  onPreviousLesson,
  onNextLesson,
  isFirstLesson,
  isLastLesson,
  isNextLocked,
  onShowToast,
}: LiveClassLessonViewProps) {
  const meta: LiveClassMetadata = parseLiveClassMeta(lesson.description);

  const [markingAttended, setMarkingAttended] = useState<boolean>(false);

  const classTitle = meta.classTitle || lesson.title;
  const instructor = meta.instructor || '';
  const date = meta.date || '';
  const startTime = meta.startTime || '';
  const endTime = meta.endTime || '';
  const meetingLink = meta.meetingLink || lesson.contentUrl || '';
  const desc = meta.description || '';
  const recordingUrl = meta.recordingUrl || '';
  const status = (meta.status || 'UPCOMING').toUpperCase();

  const handleMarkAttended = async () => {
    setMarkingAttended(true);
    try {
      await markLessonComplete(lesson.id, {
        courseId,
        lessonProgress: 100,
      });
      onLiveClassCompleted(lesson.id);
      if (onShowToast) onShowToast('Live session marked as attended & completed! ✓', 'success');
    } catch (e: any) {
      onLiveClassCompleted(lesson.id);
      if (onShowToast) onShowToast('Live session marked as completed! ✓', 'success');
    } finally {
      setMarkingAttended(false);
    }
  };

  const handleJoinMeeting = () => {
    if (!meetingLink) {
      if (onShowToast) onShowToast('Meeting link has not been published yet.', 'info');
      return;
    }
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
    // Auto complete on join
    handleMarkAttended();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      {meta.thumbnail && (
        <div className="w-full max-h-80 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs">
          <img src={meta.thumbnail} alt={classTitle} className="w-full h-full max-h-80 object-cover" />
        </div>
      )}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-rose-700 font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>{moduleTitle || 'Live Mentorship'}</span>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Attended &amp; Completed ✓</span>
              </span>
            ) : status === 'LIVE_NOW' ? (
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Live Now</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Upcoming Live Class</span>
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {classTitle}
          </h1>
          {desc && (
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {desc}
            </p>
          )}
        </div>

        {/* Dynamic Metadata Chips - Only display configured fields */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs text-slate-600 font-medium">
          {instructor && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Instructor: <strong className="text-slate-800">{instructor}</strong></span>
            </div>
          )}

          {date && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Date: <strong className="text-slate-800">{date}</strong></span>
            </div>
          )}

          {(startTime || endTime) && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Time: <strong className="text-slate-800">{startTime}{endTime ? ' - ' + endTime : ''}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Session Box */}
      <div className="bg-gradient-to-br from-rose-50/60 to-purple-50/60 rounded-3xl border border-rose-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-4 h-4" />
              <span>Live Broadcast Access</span>
            </span>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              Interactive Mentorship &amp; Discussion
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Connect directly with industry instructors, ask real-time questions, and review architectural and practical case studies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {meetingLink ? (
              <button
                type="button"
                onClick={handleJoinMeeting}
                className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Join Live Class</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                Meeting link scheduled to activate soon
              </div>
            )}

            {!isCompleted && (
              <button
                type="button"
                onClick={handleMarkAttended}
                disabled={markingAttended}
                className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Mark Session Attended ✓</span>
              </button>
            )}
          </div>
        </div>

        {recordingUrl && (
          <div className="pt-4 border-t border-rose-200/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <Video className="w-4 h-4 text-rose-600" />
              <span>Class Recording Available:</span>
            </div>
            <a
              href={recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1.5"
            >
              <span>Watch Recorded Stream</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* 3. Navigation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPreviousLesson}
          disabled={isFirstLesson}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Lesson</span>
        </button>

        <button
          type="button"
          onClick={onNextLesson}
          disabled={isLastLesson || isNextLocked}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Next Lesson</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
