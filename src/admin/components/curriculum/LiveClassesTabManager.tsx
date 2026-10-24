"use client";

import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  User,
  Upload,
  Link as LinkIcon,
  Lock,
  ImageIcon,
  ChevronDown,
} from 'lucide-react';
import {
  addCourseSection,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  uploadMediaFile,
} from '@/api/adminApi';

export interface LiveClassData {
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  instructorName: string;
  instructorPhoto: string;
  instructorDesignation: string;
  status: 'Upcoming' | 'Live Now' | 'Completed';
  meetingLink: string;
  sessionType: string;
  order: number;
  recordingUrl?: string;
}

const DEFAULT_LIVE_CLASS: LiveClassData = {
  title: 'Introduction to IoT — Live Session',
  description: 'Interactive live session with real-time doubt clearing.',
  thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
  date: '2026-10-04',
  startTime: '18:00',
  endTime: '19:30',
  duration: '1.5 hrs',
  instructorName: 'Arjun Mehta',
  instructorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
  instructorDesignation: 'IoT Solutions Architect',
  status: 'Upcoming',
  meetingLink: 'https://meet.google.com/rob-artw-xvd',
  sessionType: 'Live Session',
  order: 1,
  recordingUrl: '',
};

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '1.5 hrs';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '1.5 hrs';
  let diffMinutes = eh * 60 + em - (sh * 60 + sm);
  if (diffMinutes <= 0) return '0 hrs';
  const hours = diffMinutes / 60;
  if (hours === 1) return '1 hr';
  if (hours % 1 === 0) return `${hours} hrs`;
  return `${hours.toFixed(1)} hrs`;
}

interface LiveClassesTabManagerProps {
  courseId?: number | string | null;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  courseInstructor?: string;
  onShowToast?: (msg: string, type?: any) => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null | undefined>;
}

export const LiveClassesTabManager: React.FC<LiveClassesTabManagerProps> = ({
  courseId,
  sections,
  setSections,
  courseInstructor = 'Arjun Mehta',
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  // Extract all live classes from sections
  const allLiveClasses: { liveClass: any; sectionId: number | string }[] = [];
  sections.forEach((sec) => {
    const lessons = sec.lessons || sec.course_lessons || [];
    lessons.forEach((l: any) => {
      const type = (l.lessonType || l.lesson_type || '').toUpperCase();
      if (type === 'LIVE_CLASS') {
        allLiveClasses.push({ liveClass: l, sectionId: sec.id });
      }
    });
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ liveClass: any; sectionId: number | string } | null>(null);
  const [formData, setFormData] = useState<LiveClassData>(DEFAULT_LIVE_CLASS);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [classToDelete, setClassToDelete] = useState<{ liveClass: any; sectionId: number | string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if End Time is before or equal to Start Time
  const isEndTimeInvalid = React.useMemo(() => {
    if (!formData.startTime || !formData.endTime) return false;
    const [sh, sm] = formData.startTime.split(':').map(Number);
    const [eh, em] = formData.endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;
    return eh * 60 + em <= sh * 60 + sm;
  }, [formData.startTime, formData.endTime]);

  const getOrCreateLiveSection = async (): Promise<number | string> => {
    if (sections.length > 0) return sections[0].id;

    let activeCourseId = courseId;
    if (!activeCourseId && onSaveDraftIfNeeded) {
      activeCourseId = await onSaveDraftIfNeeded();
    }
    if (activeCourseId) {
      const res = await addCourseSection(activeCourseId, {
        title: 'Live Interactive Sessions',
        displayOrder: 0,
      });
      const created = res.data || res;
      const newSec = {
        id: created.id || Date.now(),
        title: created.title || 'Live Interactive Sessions',
        displayOrder: 0,
        lessons: [],
      };
      setSections([newSec]);
      return newSec.id;
    }
    const localSec = {
      id: `draft-sec-${Date.now()}`,
      title: 'Live Interactive Sessions',
      displayOrder: 0,
      lessons: [],
    };
    setSections([localSec]);
    return localSec.id;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      ...DEFAULT_LIVE_CLASS,
      title: 'Introduction to IoT — Live Session',
      description: 'Interactive live session with real-time doubt clearing.',
      instructorName: courseInstructor || 'Arjun Mehta',
      instructorDesignation: 'IoT Solutions Architect',
      meetingLink: 'https://meet.google.com/rob-artw-xvd',
      order: allLiveClasses.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: { liveClass: any; sectionId: number | string }) => {
    let parsed: any = {};
    if (item.liveClass.description) {
      try {
        if (typeof item.liveClass.description === 'string' && item.liveClass.description.startsWith('{')) {
          parsed = JSON.parse(item.liveClass.description);
        } else if (typeof item.liveClass.description === 'object') {
          parsed = item.liveClass.description;
        } else {
          parsed = { description: item.liveClass.description };
        }
      } catch {
        parsed = { description: item.liveClass.description };
      }
    }

    const start = parsed.startTime || '18:00';
    const end = parsed.endTime || '19:30';
    const dur = parsed.duration || calculateDuration(start, end);

    const initialData: LiveClassData = {
      title: item.liveClass.title || parsed.title || parsed.classTitle || '',
      description:
        parsed.description !== undefined
          ? parsed.description
          : typeof item.liveClass.description === 'string' && !item.liveClass.description.startsWith('{')
          ? item.liveClass.description
          : '',
      thumbnail: parsed.thumbnail || item.liveClass.thumbnail || '',
      date: parsed.date || '2026-10-04',
      startTime: start,
      endTime: end,
      duration: dur,
      instructorName: parsed.instructorName || parsed.instructor || courseInstructor || 'Arjun Mehta',
      instructorPhoto: parsed.instructorPhoto || '',
      instructorDesignation: parsed.instructorDesignation || 'IoT Solutions Architect',
      status: parsed.status || 'Upcoming',
      meetingLink: parsed.meetingLink || item.liveClass.contentUrl || item.liveClass.content_url || '',
      sessionType: parsed.sessionType || 'Live Session',
      order: parsed.order || 1,
      recordingUrl: parsed.recordingUrl || '',
    };

    setEditingItem(item);
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const start = type === 'start' ? val : formData.startTime;
    const end = type === 'end' ? val : formData.endTime;
    const dur = calculateDuration(start, end);
    setFormData((prev) => ({
      ...prev,
      [type === 'start' ? 'startTime' : 'endTime']: val,
      duration: dur,
    }));
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumb(true);
    try {
      const res = await uploadMediaFile(file, 'thumbnail');
      const url = res.url || res.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, thumbnail: url }));
        if (onShowToast) onShowToast('Thumbnail uploaded successfully!', 'success');
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, thumbnail: localUrl }));
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await uploadMediaFile(file, 'thumbnail');
      const url = res.url || res.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, instructorPhoto: url }));
        if (onShowToast) onShowToast('Instructor photo uploaded!', 'success');
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, instructorPhoto: localUrl }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.title.trim()) {
      if (onShowToast) onShowToast('Please enter a session title', 'error');
      return;
    }
    if (!formData.date) {
      if (onShowToast) onShowToast('Please select a session date', 'error');
      return;
    }
    if (!formData.startTime) {
      if (onShowToast) onShowToast('Please select a start time', 'error');
      return;
    }
    if (!formData.endTime) {
      if (onShowToast) onShowToast('Please select an end time', 'error');
      return;
    }

    if (isEndTimeInvalid) {
      if (onShowToast) onShowToast('End time must be after start time', 'error');
      return;
    }

    if (!formData.instructorName.trim()) {
      if (onShowToast) onShowToast('Please enter instructor name', 'error');
      return;
    }
    if (!formData.instructorDesignation.trim()) {
      if (onShowToast) onShowToast('Please enter instructor designation', 'error');
      return;
    }
    if (!formData.meetingLink.trim()) {
      if (onShowToast) onShowToast('Please provide a meeting join link', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const computedDuration = calculateDuration(formData.startTime, formData.endTime);

      const meta = {
        title: formData.title.trim(),
        classTitle: formData.title.trim(),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: computedDuration || '1.5 hrs',
        instructorName: formData.instructorName.trim(),
        instructor: formData.instructorName.trim(),
        instructorPhoto: formData.instructorPhoto.trim(),
        instructorDesignation: formData.instructorDesignation.trim(),
        status: formData.status,
        meetingLink: formData.meetingLink.trim(),
        sessionType: formData.sessionType,
        order: Number(formData.order) || 1,
        recordingUrl: formData.recordingUrl?.trim() || '',
      };

      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      let durationSec = 5400;
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em) && eh * 60 + em > sh * 60 + sm) {
        durationSec = (eh * 60 + em - (sh * 60 + sm)) * 60;
      }

      const payload = {
        title: formData.title.trim(),
        lessonType: 'LIVE_CLASS',
        lesson_type: 'LIVE_CLASS',
        description: JSON.stringify(meta),
        contentUrl: formData.meetingLink.trim(),
        content_url: formData.meetingLink.trim(),
        duration: computedDuration || '1.5 hrs',
        durationSeconds: durationSec,
        duration_seconds: durationSec,
        required: false,
      };

      if (editingItem?.liveClass?.id) {
        // UPDATE (PUT)
        if (!String(editingItem.liveClass.id).startsWith('draft-')) {
          await updateCourseLesson(editingItem.liveClass.id, payload);
        }

        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== editingItem.sectionId) return sec;
            const currentLessons = sec.lessons || sec.course_lessons || [];
            const updated = currentLessons.map((l: any) =>
              l.id === editingItem.liveClass.id ? { ...l, ...payload } : l
            );
            return { ...sec, lessons: updated, course_lessons: updated };
          })
        );
        if (onShowToast) onShowToast('Live session updated successfully.', 'success');
      } else {
        // CREATE (POST)
        const sectionId = await getOrCreateLiveSection();
        let createdLesson: any = null;

        if (!String(sectionId).startsWith('draft-')) {
          const res = await addCourseLesson(sectionId, payload);
          createdLesson = res.data || res;
        }

        const newLesson = {
          id: createdLesson?.id || `draft-live-${Date.now()}`,
          ...payload,
        };

        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const currentLessons = sec.lessons || sec.course_lessons || [];
            return {
              ...sec,
              lessons: [...currentLessons, newLesson],
              course_lessons: [...currentLessons, newLesson],
            };
          })
        );
        if (onShowToast) onShowToast('Live session created successfully.', 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save live session error:', err);
      if (onShowToast) onShowToast('Failed to save live session', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLiveClass = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      if (!String(classToDelete.liveClass.id).startsWith('draft-')) {
        await deleteCourseLesson(classToDelete.liveClass.id);
      }
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== classToDelete.sectionId) return sec;
          const currentLessons = sec.lessons || sec.course_lessons || [];
          const updated = currentLessons.filter((l: any) => l.id !== classToDelete.liveClass.id);
          return { ...sec, lessons: updated, course_lessons: updated };
        })
      );
      if (onShowToast) onShowToast('Live session deleted successfully.', 'info');
      setClassToDelete(null);
    } catch {
      if (onShowToast) onShowToast('Failed to delete live session', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0 shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Live Interactive Classes
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {allLiveClasses.length} {allLiveClasses.length === 1 ? 'Live Class' : 'Live Classes'} scheduled for this course
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      {/* Sessions Grid in Admin */}
      {allLiveClasses.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Live Sessions Added Yet</h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              Click &quot;Schedule Live Class&quot; to configure and publish live classes for this course.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Live Class</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allLiveClasses.map((item, idx) => {
            let meta: any = {};
            if (item.liveClass.description) {
              try {
                if (typeof item.liveClass.description === 'string' && item.liveClass.description.startsWith('{')) {
                  meta = JSON.parse(item.liveClass.description);
                } else if (typeof item.liveClass.description === 'object') {
                  meta = item.liveClass.description;
                } else {
                  meta = { description: item.liveClass.description };
                }
              } catch {
                meta = { description: item.liveClass.description };
              }
            }

            const rawStatus = (meta.status || 'Upcoming').toUpperCase();
            const isLive = rawStatus === 'LIVE' || rawStatus === 'LIVE NOW';
            const isCompleted = rawStatus === 'COMPLETED';

            const sessionDate = meta.date || '2026-10-04';
            const sessionTime = meta.startTime && meta.endTime ? `${meta.startTime} - ${meta.endTime}` : '18:00 - 19:30';

            return (
              <div
                key={item.liveClass.id || idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Session Number & Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-600 tracking-wide uppercase">
                      Session {idx + 1}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isLive
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isLive ? 'bg-rose-600' : isCompleted ? 'bg-slate-500' : 'bg-purple-600'
                        }`}
                      />
                      {meta.status ? meta.status.toUpperCase() : 'UPCOMING'}
                    </span>
                  </div>

                  {/* Thumbnail Preview (if present) */}
                  {meta.thumbnail && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={meta.thumbnail}
                        alt={item.liveClass.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Title & Desc */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {item.liveClass.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {meta.description || 'Live interactive class session.'}
                    </p>
                  </div>

                  {/* Details: Date & Time */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{sessionDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{sessionTime}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row: [Join Meeting Link] [Edit] [Delete] */}
                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100">
                  {meta.meetingLink ? (
                    <a
                      href={meta.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 hover:text-purple-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting Link</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Meeting Link</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClassToDelete(item)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                    title="Delete Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: MODERN, CLEAN, FULLY VISIBLE SAAS MODAL (NO BOTTOM CUT-OFF)   */}
      {/* ------------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header (Sticky Top) */}
            <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {editingItem ? 'Edit Live Session' : 'Create Live Session'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure interactive session details, timing, and instructor info.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container with Scrollable Body and Sticky Footer */}
            <form onSubmit={handleSaveLiveClass} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* ================= LEFT COLUMN ================= */}
                  <div className="space-y-4">
                    {/* 1. Session Title * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Session Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Introduction to IoT — Live Session"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    {/* 2. Thumbnail Image upload with preview */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Thumbnail Image
                      </label>
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-2xl p-3 bg-slate-50/50 hover:bg-purple-50/20 transition cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadThumbnail}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                            {isUploadingThumb ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-[10px] text-slate-400">PNG or JPG (Max. 2MB)</p>
                          </div>
                          {formData.thumbnail && (
                            <div className="ml-auto w-12 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900 shadow-2xs">
                              <img
                                src={formData.thumbnail}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Start Time * and End Time * side-by-side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Start Time <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => handleTimeChange('start', e.target.value)}
                            required
                            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                          />
                          <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          End Time <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => handleTimeChange('end', e.target.value)}
                            required
                            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                          />
                          <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {isEndTimeInvalid && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            End time must be after start time.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 4. Instructor Name * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Instructor Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.instructorName}
                        onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                        required
                        placeholder="e.g. Arjun Mehta"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    {/* 5. Instructor Designation * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Instructor Designation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.instructorDesignation}
                        onChange={(e) =>
                          setFormData({ ...formData, instructorDesignation: e.target.value })
                        }
                        required
                        placeholder="e.g. IoT Solutions Architect"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    {/* 6. Join Link * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Join Link <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="url"
                          value={formData.meetingLink}
                          onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                          required
                          placeholder="https://meet.google.com/rob-artw-xvd"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ================= RIGHT COLUMN ================= */}
                  <div className="space-y-4">
                    {/* 1. Short Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Short Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Interactive live session with real-time doubt clearing."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs resize-none"
                      />
                    </div>

                    {/* 2. Session Date * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Session Date <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs pr-10"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* 3. Duration (Auto-calculated, locked) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Duration
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={formData.duration}
                          className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs sm:text-sm font-semibold text-purple-950 focus:outline-none shadow-2xs cursor-not-allowed pr-10"
                        />
                        <Lock className="w-4 h-4 text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* 4. Instructor Photo upload with preview */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Instructor Photo
                      </label>
                      <div className="relative border border-slate-200 hover:border-purple-300 rounded-xl p-2.5 bg-white hover:bg-purple-50/20 transition cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadAvatar}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            {isUploadingAvatar ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">Upload photo</p>
                            <p className="text-[10px] text-slate-400">JPG or PNG (Max. 2MB)</p>
                          </div>
                          {formData.instructorPhoto && (
                            <img
                              src={formData.instructorPhoto}
                              alt="Avatar"
                              className="ml-auto w-8 h-8 rounded-full object-cover border border-purple-200 shadow-2xs shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Status * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Status <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value as any })
                          }
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs appearance-none pr-10 cursor-pointer"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Live Now">Live Now</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* 6. Session Type * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Session Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.sessionType}
                          onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs appearance-none pr-10 cursor-pointer"
                        >
                          <option value="Live Session">Live Session</option>
                          <option value="Mentorship">Mentorship</option>
                          <option value="Architecture Review">Architecture Review</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Q&A Session">Q&amp;A Session</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Footer matching User Prompt */}
              <div className="px-6 py-4 sm:px-8 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
                {/* Cancel button (left) */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Purple "Save Live Session" / "Save Changes" button (right) */}
                <button
                  type="submit"
                  disabled={isSaving || !formData.title.trim() || !formData.meetingLink.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingItem ? 'Save Changes' : 'Save Live Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Live Session?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete &ldquo;{classToDelete.liveClass.title}&rdquo;?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLiveClass}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
