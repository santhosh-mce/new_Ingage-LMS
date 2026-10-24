import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
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
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  uploadMediaFile,
} from '@/api/adminApi';

interface LiveClassData {
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

interface ModuleLiveClassesManagerProps {
  section: any;
  sectionIndex: number;
  courseId?: number | string | null;
  courseInstructor?: string;
  onUpdateSectionLessons: (sectionId: number | string, updatedLessons: any[]) => void;
  onBack: () => void;
  onSwitchTab: (tab: 'VIDEOS' | 'QUIZ' | 'PROJECTS' | 'LIVE_CLASSES') => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null>;
}

export const ModuleLiveClassesManager: React.FC<ModuleLiveClassesManagerProps> = ({
  section,
  sectionIndex,
  courseId,
  courseInstructor = 'Arjun Mehta',
  onUpdateSectionLessons,
  onBack,
  onSwitchTab,
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  const allLessons = section.lessons || section.course_lessons || [];
  const liveLessons = allLessons.filter((l: any) => {
    const t = (l.lessonType || l.lesson_type || '').toUpperCase();
    return t === 'LIVE_CLASS' || t === 'LIVE';
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form State
  const [form, setForm] = useState<LiveClassData>({
    title: 'Introduction to IoT — Live Session',
    description: 'Interactive live session with real-time doubt clearing',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
    date: '2026-10-04',
    startTime: '18:00',
    endTime: '19:30',
    duration: '1.5 hrs',
    instructorName: courseInstructor,
    instructorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    instructorDesignation: 'IoT Solutions Architect',
    status: 'Upcoming',
    meetingLink: 'https://ingage.live/session/iot-intro',
    sessionType: 'Live Session',
    order: 1,
    recordingUrl: '',
  });

  const parseLiveData = (lesson: any): LiveClassData => {
    let parsed: any = {};
    if (lesson.description) {
      try {
        if (typeof lesson.description === 'string' && lesson.description.startsWith('{')) {
          parsed = JSON.parse(lesson.description);
        } else if (typeof lesson.description === 'object') {
          parsed = lesson.description;
        } else {
          parsed = { description: lesson.description };
        }
      } catch {
        parsed = { description: lesson.description };
      }
    }

    const start = parsed.startTime || '18:00';
    const end = parsed.endTime || '19:30';
    const dur = parsed.duration || lesson.duration || calculateDuration(start, end);

    return {
      title: lesson.title || parsed.title || parsed.classTitle || '',
      description: parsed.description || '',
      thumbnail: parsed.thumbnail || lesson.thumbnail || '',
      date: parsed.date || new Date().toISOString().split('T')[0],
      startTime: start,
      endTime: end,
      duration: dur,
      instructorName: parsed.instructorName || parsed.instructor || courseInstructor,
      instructorPhoto: parsed.instructorPhoto || '',
      instructorDesignation: parsed.instructorDesignation || 'IoT Solutions Architect',
      status: (parsed.status as any) || 'Upcoming',
      meetingLink: lesson.contentUrl || lesson.content_url || parsed.meetingLink || '',
      sessionType: parsed.sessionType || 'Live Session',
      order: parsed.order || 1,
      recordingUrl: parsed.recordingUrl || '',
    };
  };

  const openAddForm = () => {
    setEditingLessonId(null);
    setForm({
      title: `${section.title} — Live Session`,
      description: 'Interactive live session with real-time doubt clearing',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      duration: '1.5 hrs',
      instructorName: courseInstructor,
      instructorPhoto: '',
      instructorDesignation: 'IoT Solutions Architect',
      status: 'Upcoming',
      meetingLink: 'https://ingage.live/session/iot-intro',
      sessionType: 'Live Session',
      order: liveLessons.length + 1,
      recordingUrl: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (lesson: any) => {
    const data = parseLiveData(lesson);
    setEditingLessonId(lesson.id);
    setForm(data);
    setIsFormOpen(true);
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const start = type === 'start' ? val : form.startTime;
    const end = type === 'end' ? val : form.endTime;
    const dur = calculateDuration(start, end);
    setForm((prev) => ({
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
        setForm((prev) => ({ ...prev, thumbnail: url }));
        if (onShowToast) onShowToast('Thumbnail uploaded!', 'success');
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, thumbnail: localUrl }));
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
        setForm((prev) => ({ ...prev, instructorPhoto: url }));
        if (onShowToast) onShowToast('Photo uploaded!', 'success');
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, instructorPhoto: localUrl }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      if (onShowToast) onShowToast('Please enter a live class title', 'error');
      return;
    }
    if (!form.meetingLink.trim()) {
      if (onShowToast) onShowToast('Please provide a meeting join link', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const meta = {
        title: form.title.trim(),
        classTitle: form.title.trim(),
        description: form.description.trim(),
        thumbnail: form.thumbnail.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        duration: form.duration.trim() || '1.5 hrs',
        instructorName: form.instructorName.trim() || courseInstructor,
        instructor: form.instructorName.trim() || courseInstructor,
        instructorPhoto: form.instructorPhoto.trim(),
        instructorDesignation: form.instructorDesignation.trim(),
        status: form.status,
        meetingLink: form.meetingLink.trim(),
        sessionType: form.sessionType,
        order: Number(form.order) || 1,
        recordingUrl: form.recordingUrl?.trim() || '',
      };

      const payload = {
        title: form.title.trim(),
        lessonType: 'LIVE_CLASS',
        lesson_type: 'LIVE_CLASS',
        description: JSON.stringify(meta),
        contentUrl: form.meetingLink.trim(),
        content_url: form.meetingLink.trim(),
        duration: form.duration.trim() || '1.5 hrs',
        durationSeconds: 5400,
        duration_seconds: 5400,
        required: false,
      };

      if (editingLessonId) {
        if (!String(editingLessonId).startsWith('draft-')) {
          await updateCourseLesson(editingLessonId, payload);
        }
        const updated = allLessons.map((l: any) =>
          l.id === editingLessonId ? { ...l, ...payload } : l
        );
        onUpdateSectionLessons(section.id, updated);
        if (onShowToast) onShowToast('Live session updated successfully.', 'success');
      } else {
        let createdLesson: any = null;
        if (!String(section.id).startsWith('draft-')) {
          const res = await addCourseLesson(section.id, payload);
          createdLesson = res.data || res;
        }
        const newLesson = {
          id: createdLesson?.id || `draft-live-${Date.now()}`,
          ...payload,
        };
        onUpdateSectionLessons(section.id, [...allLessons, newLesson]);
        if (onShowToast) onShowToast('Live session created successfully.', 'success');
      }

      setIsFormOpen(false);
    } catch {
      if (onShowToast) onShowToast('Failed to save live session', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    setDeletingId(lessonId);
    try {
      if (!String(lessonId).startsWith('draft-')) {
        await deleteCourseLesson(lessonId);
      }
      const updated = allLessons.filter((l: any) => l.id !== lessonId);
      onUpdateSectionLessons(section.id, updated);
      if (onShowToast) onShowToast('Live session deleted successfully.', 'info');
    } catch {
      if (onShowToast) onShowToast('Failed to delete live class', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Module {sectionIndex + 1} Overview</span>
        </button>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onSwitchTab('VIDEOS')}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Videos
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('QUIZ')}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Quiz
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('PROJECTS')}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Project
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-purple-700 shadow-2xs"
          >
            Live Class
          </button>
        </div>
      </div>

      {/* Module Title Banner */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wide">
              Module {sectionIndex + 1} • Live Interactive Classes
            </div>
            <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Live Class</span>
        </button>
      </div>

      {/* Live Classes List */}
      {liveLessons.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3 bg-slate-50/30">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Live Classes in this Module</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule webinars, live Q&amp;A, and architecture reviews for this specific module.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddForm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Live Class</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveLessons.map((lesson: any, lIdx: number) => {
            const data = parseLiveData(lesson);
            return (
              <div
                key={lesson.id || lIdx}
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:shadow-xs transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      {data.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(lesson)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                        title="Edit Session"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lesson.id)}
                        disabled={deletingId === lesson.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Session"
                      >
                        {deletingId === lesson.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {data.thumbnail && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                      <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{data.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{data.description}</p>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-semibold text-slate-800">{data.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time:</span>
                      <span className="font-semibold text-slate-800">{data.startTime} - {data.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Instructor:</span>
                      <span className="font-semibold text-slate-800">{data.instructorName}</span>
                    </div>
                  </div>
                </div>

                {data.meetingLink && (
                  <a
                    href={data.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 hover:text-purple-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition mt-2"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CREATE / EDIT LIVE SESSION (CLEAN, BALANCED & FULLY VISIBLE) */}
      {/* ============================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Sticky Top) */}
            <div className="px-6 py-4 sm:px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingLessonId ? 'Edit Live Session' : 'Create Live Session'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure real-time interactive class details for students
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveLiveClass} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                        placeholder="Introduction to IoT — Live Session"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                      />
                    </div>

                    {/* 2. Thumbnail Image upload area with preview */}
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
                          {form.thumbnail && (
                            <div className="ml-auto w-12 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900 shadow-2xs">
                              <img
                                src={form.thumbnail}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Start Time * and End Time * (Side-by-side) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Start Time <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={form.startTime}
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
                            value={form.endTime}
                            onChange={(e) => handleTimeChange('end', e.target.value)}
                            required
                            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                          />
                          <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* 4. Instructor Name * */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Instructor Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.instructorName}
                        onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
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
                        value={form.instructorDesignation}
                        onChange={(e) =>
                          setForm({ ...form, instructorDesignation: e.target.value })
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
                          value={form.meetingLink}
                          onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
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
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                          value={form.duration}
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
                          {form.instructorPhoto && (
                            <img
                              src={form.instructorPhoto}
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
                          value={form.status}
                          onChange={(e) =>
                            setForm({ ...form, status: e.target.value as any })
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
                          value={form.sessionType}
                          onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
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

              {/* Bottom Sticky Footer */}
              <div className="px-6 py-4 sm:px-8 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
                {/* Cancel button (left) */}
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Purple "Save Live Session" / "Save Changes" button (right) */}
                <button
                  type="submit"
                  disabled={isSaving || !form.title.trim() || !form.meetingLink.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingLessonId ? 'Save Changes' : 'Save Live Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
