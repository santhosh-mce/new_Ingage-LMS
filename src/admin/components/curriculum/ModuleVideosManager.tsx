import React, { useState, useRef } from 'react';
import {
  Video,
  Upload,
  Link as LinkIcon,
  Play,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  X,
  Loader2,
  Eye,
  FileVideo,
} from 'lucide-react';
import {
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  uploadMediaFile,
} from '@/api/adminApi';
import {
  formatDurationMMSS,
  formatDurationDigital,
  formatDurationHuman,
  parseDurationToSeconds,
  detectVideoDuration,
  extractYouTubeId,
} from '@/lib/duration';

interface ModuleVideosManagerProps {
  section: any;
  sectionIndex: number;
  courseId?: number | string | null;
  onUpdateSectionLessons: (sectionId: number | string, updatedLessons: any[]) => void;
  onBack: () => void;
  onSwitchTab: (tab: 'VIDEOS' | 'QUIZ' | 'PROJECTS' | 'LIVE_CLASSES') => void;
  onPreviewVideo: (url: string, title: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null>;
}

export const ModuleVideosManager: React.FC<ModuleVideosManagerProps> = ({
  section,
  sectionIndex,
  courseId,
  onUpdateSectionLessons,
  onBack,
  onSwitchTab,
  onPreviewVideo,
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  const allLessons = section.lessons || section.course_lessons || [];
  const videoLessons = allLessons.filter(
    (l: any) => (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase() === 'VIDEO'
  );

  // Calculate total video duration for this module
  const totalDurationSeconds = videoLessons.reduce((acc: number, l: any) => {
    return acc + parseDurationToSeconds(l.duration, l.durationSeconds || l.duration_seconds);
  }, 0);
  const formattedTotalDuration = formatDurationDigital(totalDurationSeconds);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [sourceType, setSourceType] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [detectedDuration, setDetectedDuration] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [freePreview, setFreePreview] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddForm = () => {
    setEditingLessonId(null);
    setVideoTitle('');
    setSourceType('upload');
    setVideoUrl('');
    setDetectedDuration('');
    setDurationSeconds(0);
    setFreePreview(false);
    setUploadedFileName('');
    setIsFormOpen(true);
  };

  const openEditForm = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setVideoTitle(lesson.title || '');
    const isYt = Boolean(extractYouTubeId(lesson.contentUrl || lesson.content_url || ''));
    setSourceType(isYt ? 'url' : 'upload');
    setVideoUrl(lesson.contentUrl || lesson.content_url || '');
    const sec = parseDurationToSeconds(lesson.duration, lesson.durationSeconds || lesson.duration_seconds);
    setDurationSeconds(sec);
    setDetectedDuration(formatDurationMMSS(sec));
    setFreePreview(Boolean(lesson.freePreview || lesson.free_preview));
    setUploadedFileName('');
    setIsFormOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsUploading(true);

    try {
      // 1. Auto-detect real video duration from file metadata
      const durSec = await detectVideoDuration(file);
      setDurationSeconds(durSec);
      setDetectedDuration(formatDurationMMSS(durSec));

      // 2. Upload video file to server
      const uploadRes = await uploadMediaFile(file, 'video');
      const fileUrl = uploadRes.contentUrl || uploadRes.url || uploadRes.fileUrl || '';
      if (!fileUrl) {
        throw new Error('Upload succeeded but no URL was returned');
      }
      setVideoUrl(fileUrl);

      // Auto-set title from file name if empty
      if (!videoTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setVideoTitle(cleanName);
      }

      if (onShowToast) onShowToast(`Video "${file.name}" uploaded (${formatDurationMMSS(durSec)})`, 'success');
    } catch (err: any) {
      console.error('Video upload error:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to upload video file', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveVideo = async () => {
    if (!videoTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a video title', 'error');
      return;
    }
    if (!videoUrl.trim()) {
      if (onShowToast) onShowToast('Please upload a video or provide a valid video URL', 'error');
      return;
    }

    let finalSec = durationSeconds;
    if (sourceType === 'url' && finalSec === 0) {
      finalSec = 600;
    }
    const finalDurationStr = formatDurationMMSS(finalSec);

    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        title: videoTitle.trim(),
        lessonType: 'VIDEO',
        lesson_type: 'VIDEO',
        contentUrl: videoUrl.trim(),
        content_url: videoUrl.trim(),
        duration: finalDurationStr,
        durationSeconds: finalSec,
        duration_seconds: finalSec,
        freePreview,
        free_preview: freePreview,
        required: true,
      };

      const ytId = extractYouTubeId(videoUrl);
      if (ytId) {
        payload.videoKey = ytId;
        payload.video_key = ytId;
      }

      if (editingLessonId) {
        const updated = await updateCourseLesson(editingLessonId, payload);
        const updatedLessons = allLessons.map((l: any) =>
          l.id === editingLessonId ? { ...l, ...updated, ...payload } : l
        );
        onUpdateSectionLessons(section.id, updatedLessons);
        if (onShowToast) onShowToast('Video lesson updated successfully! ✓', 'success');
      } else {
        payload.displayOrder = videoLessons.length;
        payload.display_order = videoLessons.length;

        const created = await addCourseLesson(section.id, payload);
        const updatedLessons = [...allLessons, { ...created, ...payload }];
        onUpdateSectionLessons(section.id, updatedLessons);
        if (onShowToast) onShowToast('Video lesson added successfully! ✓', 'success');
      }

      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save video lesson:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to save video lesson', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVideo = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this video lesson?')) return;

    setDeletingId(lessonId);
    try {
      await deleteCourseLesson(lessonId);
      const updatedLessons = allLessons.filter((l: any) => l.id !== lessonId);
      onUpdateSectionLessons(section.id, updatedLessons);
      if (onShowToast) onShowToast('Video lesson deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete video lesson:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to delete video lesson', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (reordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videoLessons.length) return;

    setReordering(true);
    const newVideoList = [...videoLessons];
    const [moved] = newVideoList.splice(index, 1);
    newVideoList.splice(targetIndex, 0, moved);

    let vIdx = 0;
    const reorderedAll = allLessons.map((l: any) => {
      const isVideo = (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase() === 'VIDEO';
      if (isVideo) {
        const item = newVideoList[vIdx];
        vIdx++;
        return { ...item, displayOrder: vIdx - 1, display_order: vIdx - 1 };
      }
      return l;
    });

    onUpdateSectionLessons(section.id, reorderedAll);

    try {
      await Promise.all([
        updateCourseLesson(moved.id, { displayOrder: targetIndex, display_order: targetIndex }),
        updateCourseLesson(videoLessons[targetIndex].id, { displayOrder: index, display_order: index }),
      ]);
    } catch (e) {
      console.warn('Could not persist new lesson order to backend:', e);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to All Modules"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                MODULE {sectionIndex + 1}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Management</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{section.title}</h2>
          </div>
        </div>

        {/* Action button */}
        {!isFormOpen && (
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Video</span>
          </button>
        )}
      </div>

      {/* Module Content Switcher Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSwitchTab('VIDEOS')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white text-green-800 shadow-xs cursor-pointer"
        >
          <Video className="w-4 h-4 text-green-600" />
          <span>Videos ({videoLessons.length})</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('QUIZ')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Quiz</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('PROJECTS')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Projects</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('LIVE_CLASSES')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Live Classes</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Module: {section.title}</div>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-3">
              <span>Total Videos: <strong className="text-green-400">{videoLessons.length}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Total Video Duration: <strong className="text-green-400 font-mono">{formattedTotalDuration}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          Auto-detected duration from uploaded files
        </div>
      </div>

      {/* Inline Dedicated Video Form (Add or Edit) */}
      {isFormOpen && (
        <div className="bg-white border-2 border-green-500/30 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingLessonId ? 'Edit Video Lesson' : 'Add New Video Lesson'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Field 1: Video Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Video Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. 01 — Introduction to Python"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden transition-colors"
                autoFocus
              />
            </div>

            {/* Field 2: Video Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Video Source
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="videoSource"
                    checked={sourceType === 'upload'}
                    onChange={() => setSourceType('upload')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span>Upload Video (MP4, WebM, MOV)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="videoSource"
                    checked={sourceType === 'url'}
                    onChange={() => setSourceType('url')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span>YouTube URL</span>
                </label>
              </div>
            </div>

            {/* Upload Area */}
            {sourceType === 'upload' ? (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isUploading
                      ? 'border-green-400 bg-green-50/40'
                      : 'border-slate-200 hover:border-green-500 hover:bg-slate-50'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-800">
                        Uploading video &amp; auto-detecting duration...
                      </p>
                      <p className="text-[11px] text-slate-500">{uploadedFileName}</p>
                    </div>
                  ) : videoUrl ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Video ready: <span className="text-green-700">{uploadedFileName || 'Uploaded Video'}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-green-800 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Detected Duration: {detectedDuration || formatDurationMMSS(durationSeconds)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Click to replace with another video</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-green-700">Click to upload video</span>
                        <span className="text-xs text-slate-500"> or drag and drop</span>
                      </div>
                      <p className="text-[11px] text-slate-400">Supported: MP4, WebM, MOV</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    const yt = extractYouTubeId(e.target.value);
                    if (yt && durationSeconds === 0) {
                      setDurationSeconds(600);
                      setDetectedDuration('10:00');
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden font-mono"
                />
                {extractYouTubeId(videoUrl) && (
                  <div className="text-[11px] text-green-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid YouTube ID: {extractYouTubeId(videoUrl)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Duration Display (Auto-detected, not manually entered) */}
            {durationSeconds > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Automatically Detected Duration:</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                  {detectedDuration || formatDurationMMSS(durationSeconds)}
                </div>
              </div>
            )}

            {/* Free Preview Option */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={freePreview}
                  onChange={(e) => setFreePreview(e.target.checked)}
                  className="rounded-sm text-green-600 focus:ring-green-500"
                />
                <span>Free Preview (allow non-enrolled students to watch this video)</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || isUploading || !videoTitle.trim() || !videoUrl.trim()}
              onClick={handleSaveVideo}
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingLessonId ? 'Update Video' : 'Save Video Lesson'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Videos List */}
      <div className="space-y-3">
        {videoLessons.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileVideo className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No videos in this module yet</p>
              <p className="text-xs text-slate-500 mt-0.5">Click &quot;+ Add Video&quot; above to upload your first lesson video.</p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Video</span>
            </button>
          </div>
        ) : (
          videoLessons.map((lesson: any, idx: number) => {
            const sec = parseDurationToSeconds(lesson.duration, lesson.durationSeconds || lesson.duration_seconds);
            const durDisplay = formatDurationMMSS(sec);
            const isYt = Boolean(extractYouTubeId(lesson.contentUrl || lesson.content_url || ''));

            return (
              <div
                key={lesson.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-all"
              >
                {/* Left: Index badge & Title & Duration */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 font-bold text-xs flex items-center justify-center shrink-0 border border-green-200">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Video {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {lesson.title}
                      </span>
                      {lesson.freePreview || lesson.free_preview ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Free Preview
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duration: {durDisplay}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-emerald-700 font-medium">Status: Published</span>
                      </span>
                      {isYt && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">YouTube</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Reorder Up / Down */}
                  <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5 mr-1">
                    <button
                      type="button"
                      disabled={idx === 0 || reordering}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === videoLessons.length - 1 || reordering}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => onPreviewVideo(lesson.contentUrl || lesson.content_url || '', lesson.title)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                    title="Preview Video"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditForm(lesson)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit Video"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={deletingId === lesson.id}
                    onClick={() => handleDeleteVideo(lesson.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Video"
                  >
                    {deletingId === lesson.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
