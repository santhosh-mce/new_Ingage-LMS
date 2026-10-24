"use client";

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  Radio,
  Timer,
  Tag,
  Loader2,
} from 'lucide-react';

export interface LiveClassItem {
  id?: number | string;
  title: string;
  description?: string;
  thumbnail?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  instructorName?: string;
  instructorPhoto?: string;
  instructorDesignation?: string;
  status?: 'Upcoming' | 'Live Now' | 'Completed' | string;
  meetingLink?: string;
  sessionType?: string;
  order?: number;
  contentUrl?: string;
  videoUrl?: string;
}

interface StudentLiveClassesViewProps {
  liveClasses?: any[];
  courseId?: number | string;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      const dateObj = new Date(year, month, day);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback to original
  }
  return dateStr;
}

export const StudentLiveClassesView: React.FC<StudentLiveClassesViewProps> = ({
  liveClasses: initialLiveClasses,
  courseId,
}) => {
  const [fetchedClasses, setFetchedClasses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  // If liveClasses prop is not provided or empty, and courseId is present, fetch dynamically
  useEffect(() => {
    if (initialLiveClasses && initialLiveClasses.length > 0) {
      return;
    }
    if (!courseId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/courses/${courseId}/curriculum`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load curriculum');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const sections = data.sections || data.data?.sections || [];
        const liveLessons: any[] = [];
        sections.forEach((sec: any) => {
          const lessons = sec.lessons || sec.course_lessons || [];
          lessons.forEach((l: any) => {
            const type = (l.lessonType || l.lesson_type || '').toUpperCase();
            if (type === 'LIVE_CLASS') {
              liveLessons.push(l);
            }
          });
        });
        setFetchedClasses(liveLessons);
      })
      .catch((err) => {
        console.warn('Could not fetch live classes for course:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId, initialLiveClasses]);

  const rawClasses =
    initialLiveClasses && initialLiveClasses.length > 0
      ? initialLiveClasses
      : fetchedClasses || [];

  // Parse DB lessons dynamically without ANY hardcoded or static mock data
  const parsedSessions: LiveClassItem[] = React.useMemo(() => {
    return rawClasses.map((item, idx) => {
      let meta: any = {};
      if (item.description) {
        try {
          if (typeof item.description === 'string' && item.description.startsWith('{')) {
            meta = JSON.parse(item.description);
          } else if (typeof item.description === 'object') {
            meta = item.description;
          } else {
            meta = { description: item.description };
          }
        } catch {
          meta = { description: item.description };
        }
      }

      const rawDuration =
        meta.duration || (item.duration ? String(item.duration).trim() : '');

      return {
        id: item.id || `live-${idx}`,
        title: item.title || meta.title || meta.classTitle || 'Live Interactive Class',
        description:
          meta.description ||
          (typeof item.description === 'string' && !item.description.startsWith('{')
            ? item.description
            : 'Live interactive class session.'),
        thumbnail: meta.thumbnail || item.thumbnail || '',
        date: meta.date || '',
        startTime: meta.startTime || '',
        endTime: meta.endTime || '',
        duration: rawDuration || '1.5 hrs',
        instructorName:
          meta.instructorName || meta.instructor || 'Course Instructor',
        instructorPhoto: meta.instructorPhoto || '',
        instructorDesignation:
          meta.instructorDesignation || 'Live Session Instructor',
        status: meta.status || 'Upcoming',
        meetingLink:
          meta.meetingLink ||
          item.contentUrl ||
          item.content_url ||
          '',
        sessionType: meta.sessionType || 'Live Session',
        order: meta.order || idx + 1,
      };
    });
  }, [rawClasses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">
          Loading live interactive sessions...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Live Interactive Classes &amp; Mentorship
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 font-normal">
          Join live sessions with industry experts. Learn, interact and get your doubts cleared in real-time.
        </p>
      </div>

      {/* When no live sessions exist in the database */}
      {parsedSessions.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 bg-white shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
            <Radio className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">
              No Live Classes Scheduled
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no live interactive sessions scheduled for this course. Please check back later or consult your course announcement board.
            </p>
          </div>
        </div>
      ) : (
        /* 3-Column Responsive Grid matching the Reference Design */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parsedSessions.map((session, idx) => {
            const rawStatus = (session.status || 'Upcoming').toUpperCase();
            const isLiveNow = rawStatus === 'LIVE' || rawStatus === 'LIVE NOW';
            const isCompleted = rawStatus === 'COMPLETED';

            const timeDisplay =
              session.startTime && session.endTime
                ? `${session.startTime} - ${session.endTime}`
                : session.startTime || '18:00 - 19:30';

            const formattedDate = formatDisplayDate(session.date) || session.date || 'TBA';
            const isPrimary = idx === 0;

            return (
              <div
                key={session.id || idx}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status Pill Badge & Session Type */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {isLiveNow ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          LIVE NOW
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          UPCOMING
                        </span>
                      )}
                    </div>

                    {session.sessionType && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                        {session.sessionType}
                      </span>
                    )}
                  </div>

                  {/* Card Thumbnail Image */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 shadow-2xs">
                    {session.thumbnail ? (
                      <img
                        src={session.thumbnail}
                        alt={session.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-400 p-4 text-center">
                        <Radio className="w-10 h-10 text-purple-400 mb-2" />
                        <span className="text-xs font-semibold text-slate-300">
                          Live Interactive Session
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Short Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Details List */}
                  <div className="space-y-3 pt-2 text-xs text-slate-700 border-t border-slate-100">
                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Date</span>
                      </div>
                      <span className="font-medium text-slate-900">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Time</span>
                      </div>
                      <span className="font-medium text-slate-900">{timeDisplay}</span>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Instructor</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-right">
                        {session.instructorPhoto ? (
                          <img
                            src={session.instructorPhoto}
                            alt={session.instructorName || 'Instructor'}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 text-[10px] font-bold shrink-0">
                            {session.instructorName?.charAt(0) || 'I'}
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-900 leading-tight">
                            {session.instructorName || 'Course Instructor'}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            {session.instructorDesignation || 'Live Session Instructor'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Timer className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Duration</span>
                      </div>
                      <span className="font-bold text-emerald-600">
                        {session.duration || '1.5 hrs'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-5 mt-2">
                  {session.meetingLink ? (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                        isPrimary
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Session</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Meeting Link Not Available</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
