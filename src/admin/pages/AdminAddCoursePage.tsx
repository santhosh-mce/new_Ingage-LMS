"use client";
import React, { useState, useEffect } from 'react';
import {
  createAdminCourse,
  updateAdminCourse,
  getAdminCourseById,
  publishAdminCourse,
  addCourseSection,
  updateCourseSection,
  deleteCourseSection,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  uploadMediaFile,
  getCourseCategories,
} from '../../api/adminApi';
import { getAccessibleImageUrl } from '../../api/authApi';
import {
  BookOpen,
  ArrowLeft,
  Save,
  CheckCircle2,
  Check,
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  Upload,
  Loader2,
  Layers,
  Sparkles,
  AlertCircle,
  FolderPlus,
  Edit2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Code,
  FileCheck,
  CheckSquare,
  ListOrdered,
  ExternalLink,
  FileUp,
  Award,
  Calendar,
  ChevronRight,
  Paperclip,
  Youtube,
  Link2,
  Eye,
  GripVertical,
  Play,
  Clock,
  X,
} from 'lucide-react';


// Video duration detection and formatting utilities

export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
};

export const detectVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const durationSec = Math.round(video.duration || 0);
        resolve(durationSec);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
    } catch {
      resolve(0);
    }
  });
};

export const formatDurationMMSS = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDurationDigital = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const formatDurationHuman = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 min';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }
  if (mins > 0) {
    return `${mins} min`;
  }
  return `${secs} sec`;
};

export const parseDurationToSeconds = (dur: any, durationSeconds?: any): number => {
  if (durationSeconds && typeof durationSeconds === 'number' && durationSeconds > 0) {
    return durationSeconds;
  }
  if (!dur) return 0;
  if (typeof dur === 'number') return dur;
  const str = String(dur).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) {
      return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
  }
  let total = 0;
  const hrMatch = str.match(/(\d+)\s*(?:hr|hour|h)/i);
  if (hrMatch) total += parseInt(hrMatch[1], 10) * 3600;
  const minMatch = str.match(/(\d+)\s*(?:min|m)/i);
  if (minMatch) total += parseInt(minMatch[1], 10) * 60;
  const secMatch = str.match(/(\d+)\s*(?:sec|s)/i);
  if (secMatch) total += parseInt(secMatch[1], 10);
  return total;
};

export interface AdminAddCoursePageProps {
  courseId?: string | number;
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminAddCoursePage: React.FC<AdminAddCoursePageProps> = ({
  courseId,
  onNavigate,
  onShowToast,
}) => {
  const isEditing = Boolean(courseId);


  // Module Expansion State
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSectionExpand = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === false ? true : false,
    }));
  };

  // Drag and Drop state for sections and lessons
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [draggedLessonInfo, setDraggedLessonInfo] = useState<{ sectionId: number; lessonIdx: number } | null>(null);

  const handleSectionDragStart = (idx: number) => {
    setDraggedSectionIdx(idx);
  };

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSectionDrop = async (targetIdx: number) => {
    if (draggedSectionIdx === null || draggedSectionIdx === targetIdx) return;
    const reordered = [...sections];
    const [moved] = reordered.splice(draggedSectionIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((sec, idx) => ({ ...sec, displayOrder: idx }));
    setSections(updated);
    setDraggedSectionIdx(null);
    try {
      await Promise.all(
        updated.map((s, idx) =>
          updateCourseSection(s.id, { title: s.title, description: s.description, displayOrder: idx } as any)
        )
      );
      if (onShowToast) onShowToast('Module order updated!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonDragStart = (sectionId: number, lessonIdx: number) => {
    setDraggedLessonInfo({ sectionId, lessonIdx });
  };

  const handleLessonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleLessonDrop = async (sectionId: number, targetLessonIdx: number) => {
    if (!draggedLessonInfo || draggedLessonInfo.sectionId !== sectionId || draggedLessonInfo.lessonIdx === targetLessonIdx) {
      return;
    }
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec || !sec.lessons) return;

    const reordered = [...sec.lessons];
    const [moved] = reordered.splice(draggedLessonInfo.lessonIdx, 1);
    reordered.splice(targetLessonIdx, 0, moved);

    const updatedLessons = reordered.map((les, idx) => ({ ...les, displayOrder: idx }));

    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, lessons: updatedLessons } : s))
    );
    setDraggedLessonInfo(null);

    try {
      await Promise.all(
        updatedLessons.map((l, idx) =>
          updateCourseLesson(l.id, { displayOrder: idx })
        )
      );
      if (onShowToast) onShowToast('Lesson order updated!');
    } catch (err) {
      console.error(err);
    }
  };

  // Module modal extended fields
  const [sectionStatus, setSectionStatus] = useState<'PUBLISHED' | 'DRAFT'>('DRAFT');
  const [sectionIsFreePreview, setSectionIsFreePreview] = useState(false);
  const [sectionThumbnail, setSectionThumbnail] = useState('');

  // Comprehensive Add/Edit Lesson Modal State
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModalMode, setLessonModalMode] = useState<'create' | 'edit'>('create');
  const [currentSectionForLesson, setCurrentSectionForLesson] = useState<any>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const [lessonFormState, setLessonFormState] = useState<{
    title: string;
    description: string;
    lessonType: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT';
    status: 'PUBLISHED' | 'DRAFT';
    freePreview: boolean;
    required: boolean;
    duration: string;
    durationSeconds: number;
    contentUrl: string;

    // Video
    videoTitle: string;
    videoSource: 'UPLOAD' | 'YOUTUBE';
    videoFile: File | null;
    videoFileName: string;
    videoThumbnailUrl?: string;
    youtubeUrl: string;
    youtubeVideoId: string;
    videoUploadPercent: number;
    videoUploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';
    videoUploadError: string | null;
    videoPreviewActive: boolean;

    // Text
    textContent: string;
    textTab: 'write' | 'preview';

    // PDF
    pdfFile: File | null;
    pdfFileName: string;
    pdfUploadPercent: number;
    pdfUploadStatus: 'idle' | 'uploading' | 'uploaded' | 'error';

    // Quiz
    quizTitle: string;
    quizDescription: string;
    passingScore: number;
    timeLimit: number;
    maxAttempts: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    quizQuestions: Array<{
      id?: number;
      questionText: string;
      questionType: 'MCQ' | 'MULTIPLE' | 'TRUE_FALSE';
      options: string[];
      correctAnswer: number;
      marks: number;
      explanation: string;
    }>;

    // Assignment
    assignmentTitle: string;
    assignmentInstructions: string;
    assignmentSubmissionType: 'FILE' | 'TEXT' | 'LINK';
    assignmentMaxMarks: number;
    assignmentDueDate: string;
    assignmentAllowResubmission: boolean;
    assignmentAttachmentUrl: string;
  }>({
    title: '',
    description: '',
    lessonType: 'VIDEO',
    status: 'PUBLISHED',
    freePreview: false,
    required: true,
    duration: '00:00',
    durationSeconds: 0,
    contentUrl: '',

    videoTitle: '',
    videoSource: 'UPLOAD',
    videoFile: null,
    videoFileName: '',
    videoThumbnailUrl: '',
    youtubeUrl: '',
    youtubeVideoId: '',
    videoUploadPercent: 0,
    videoUploadStatus: 'idle',
    videoUploadError: null,
    videoPreviewActive: false,

    textContent: '',
    textTab: 'write',

    pdfFile: null,
    pdfFileName: '',
    pdfUploadPercent: 0,
    pdfUploadStatus: 'idle',

    quizTitle: '',
    quizDescription: '',
    passingScore: 70,
    timeLimit: 30,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    quizQuestions: [
      {
        questionText: 'What is the primary concept covered in this lesson?',
        questionType: 'MCQ',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        marks: 1,
        explanation: 'Option A provides the foundational definition.',
      },
    ],

    assignmentTitle: '',
    assignmentInstructions: '',
    assignmentSubmissionType: 'FILE',
    assignmentMaxMarks: 100,
    assignmentDueDate: '',
    assignmentAllowResubmission: true,
    assignmentAttachmentUrl: '',
  });

  // Open Lesson Modal for Create
  const handleOpenAddLessonModal = (sec: any, defaultType: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT' = 'VIDEO') => {
    setCurrentSectionForLesson(sec);
    setLessonModalMode('create');
    setEditingLessonId(null);
    setLessonFormState({
      title: '',
      description: '',
      lessonType: defaultType,
      status: 'PUBLISHED',
      freePreview: false,
      required: true,
      duration: '00:00',
      durationSeconds: 0,
      contentUrl: '',

      videoTitle: '',
      videoSource: 'UPLOAD',
      videoFile: null,
      videoFileName: '',
            youtubeUrl: '',
      youtubeVideoId: '',
      videoUploadPercent: 0,
      videoUploadStatus: 'idle',
      videoUploadError: null,
      videoPreviewActive: false,

      textContent: '',
      textTab: 'write',

      pdfFile: null,
      pdfFileName: '',
      pdfUploadPercent: 0,
      pdfUploadStatus: 'idle',

      quizTitle: '',
      quizDescription: '',
      passingScore: 70,
      timeLimit: 30,
      maxAttempts: 3,
      shuffleQuestions: false,
      shuffleOptions: false,
      quizQuestions: [
        {
          questionText: 'What is the primary concept covered in this lesson?',
          questionType: 'MCQ',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          marks: 1,
          explanation: '',
        },
      ],

      assignmentTitle: '',
      assignmentInstructions: '',
      assignmentSubmissionType: 'FILE',
      assignmentMaxMarks: 100,
      assignmentDueDate: '',
      assignmentAllowResubmission: true,
      assignmentAttachmentUrl: '',
    });
    setLessonModalOpen(true);
  };

  // Open Lesson Modal for Edit
  const handleOpenEditLessonModal = (sec: any, les: any) => {
    setCurrentSectionForLesson(sec);
    setLessonModalMode('edit');
    setEditingLessonId(les.id);

    const isYt = Boolean(les.videoKey || (les.contentUrl && /youtube\.com|youtu\.be/i.test(les.contentUrl)));
    const ytId = les.videoKey || extractYouTubeId(les.contentUrl || '') || '';

    let parsedMeta: any = null;
    try {
      if (les.description && les.description.startsWith('{') && les.description.endsWith('}')) {
        parsedMeta = JSON.parse(les.description);
      }
    } catch {}

    setLessonFormState({
      title: les.title || '',
      description: parsedMeta?.description || les.description || '',
      lessonType: les.lessonType || 'VIDEO',
      status: 'PUBLISHED',
      freePreview: Boolean(les.freePreview),
      required: les.required !== false,
      duration: les.duration || '00:00',
      durationSeconds: les.durationSeconds || 0,
      contentUrl: les.contentUrl || '',

      videoTitle: les.title || '',
      videoSource: isYt ? 'YOUTUBE' : 'UPLOAD',
      videoFile: null,
      videoFileName: les.contentUrl ? les.contentUrl.split('/').pop() || '' : '',
      videoThumbnailUrl: parsedMeta?.thumbnailUrl || '',
      youtubeUrl: isYt ? les.contentUrl || '' : '',
      youtubeVideoId: ytId,
      videoUploadPercent: 100,
      videoUploadStatus: 'idle',
      videoUploadError: null,
      videoPreviewActive: false,

      textContent: parsedMeta?.textContent || les.description || '',
      textTab: 'write',

      pdfFile: null,
      pdfFileName: les.lessonType === 'PDF' && les.contentUrl ? les.contentUrl.split('/').pop() || '' : '',
      pdfUploadPercent: 100,
      pdfUploadStatus: 'idle',

      quizTitle: les.title || '',
      quizDescription: parsedMeta?.quizDescription || '',
      passingScore: parsedMeta?.passingScore || 70,
      timeLimit: parsedMeta?.timeLimit || 30,
      maxAttempts: parsedMeta?.maxAttempts || 3,
      shuffleQuestions: Boolean(parsedMeta?.shuffleQuestions),
      shuffleOptions: Boolean(parsedMeta?.shuffleOptions),
      quizQuestions: les.quizQuestions && les.quizQuestions.length > 0 ? les.quizQuestions : [
        {
          questionText: 'What is the primary concept covered in this lesson?',
          questionType: 'MCQ',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          marks: 1,
          explanation: '',
        },
      ],

      assignmentTitle: les.title || '',
      assignmentInstructions: parsedMeta?.assignmentInstructions || les.description || '',
      assignmentSubmissionType: parsedMeta?.assignmentSubmissionType || 'FILE',
      assignmentMaxMarks: parsedMeta?.assignmentMaxMarks || 100,
      assignmentDueDate: parsedMeta?.assignmentDueDate || '',
      assignmentAllowResubmission: parsedMeta?.assignmentAllowResubmission !== false,
      assignmentAttachmentUrl: les.contentUrl || '',
    });
    setLessonModalOpen(true);
  };

  // Upload video via POST /api/uploads/video
  const handleLessonVideoUpload = async (file: File) => {
    setLessonFormState((prev) => ({
      ...prev,
      videoFile: file,
      videoFileName: file.name,
            videoTitle: prev.videoTitle.trim() ? prev.videoTitle : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      videoUploadStatus: 'uploading',
      videoUploadPercent: 20,
      videoUploadError: null,
    }));

    try {
      const durSec = await detectVideoDuration(file);
      if (durSec > 0) {
        setLessonFormState((prev) => ({
          ...prev,
          durationSeconds: durSec,
          duration: formatDurationMMSS(durSec),
        }));
      }
    } catch {}

    const formData = new FormData();
    formData.append('file', file);
    if (savedCourseId) formData.append('courseId', String(savedCourseId));
    if (currentSectionForLesson) formData.append('lessonId', String(currentSectionForLesson.id));

    try {
      setLessonFormState((prev) => ({ ...prev, videoUploadPercent: 50 }));
      const res = await fetch('/api/uploads/video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Video upload failed.');
      }

      setLessonFormState((prev) => ({
        ...prev,
        contentUrl: data.url,
        videoUploadPercent: 100,
        videoUploadStatus: 'uploaded',
      }));
      if (onShowToast) onShowToast('Video uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setLessonFormState((prev) => ({
        ...prev,
        videoUploadStatus: 'error',
        videoUploadError: err.message || 'Failed to upload video.',
      }));
    }
  };

  // Upload PDF via POST /api/uploads/pdf
  const handleLessonPdfUpload = async (file: File) => {
    setLessonFormState((prev) => ({
      ...prev,
      pdfFile: file,
      pdfFileName: file.name,
      title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      pdfUploadStatus: 'uploading',
      pdfUploadPercent: 30,
    }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads/pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'PDF upload failed.');
      }

      setLessonFormState((prev) => ({
        ...prev,
        contentUrl: data.url,
        pdfUploadPercent: 100,
        pdfUploadStatus: 'uploaded',
      }));
      if (onShowToast) onShowToast('PDF uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setLessonFormState((prev) => ({
        ...prev,
        pdfUploadStatus: 'error',
      }));
      alert(err.message || 'PDF upload failed.');
    }
  };

  // Save Lesson (Create or Update)
  const handleSaveLessonModal = async () => {
    if (!currentSectionForLesson) return;
    if (!lessonFormState.title.trim()) {
      alert('Lesson title is required.');
      return;
    }

    let finalContentUrl = lessonFormState.contentUrl;
    let finalVideoKey: string | undefined = undefined;

    if (lessonFormState.lessonType === 'VIDEO') {
      if (lessonFormState.videoSource === 'YOUTUBE') {
        const ytId = extractYouTubeId(lessonFormState.youtubeUrl);
        if (!ytId) {
          alert('Please enter a valid YouTube video URL.');
          return;
        }
        finalContentUrl = lessonFormState.youtubeUrl;
        finalVideoKey = ytId;
      } else {
        if (!finalContentUrl) {
          alert('Please upload a video or provide a valid video URL.');
          return;
        }
      }
    }

    if (lessonFormState.lessonType === 'PDF' && !finalContentUrl) {
      alert('Please upload a PDF document.');
      return;
    }

    let metaDescription = lessonFormState.description;
    if (lessonFormState.lessonType === 'VIDEO') {
      metaDescription = JSON.stringify({
        description: lessonFormState.description,
        thumbnailUrl: lessonFormState.videoThumbnailUrl || '',
      });
    } else if (lessonFormState.lessonType === 'TEXT') {
      metaDescription = lessonFormState.textContent || lessonFormState.description;
    } else if (lessonFormState.lessonType === 'QUIZ') {
      metaDescription = JSON.stringify({
        quizDescription: lessonFormState.quizDescription,
        passingScore: lessonFormState.passingScore,
        timeLimit: lessonFormState.timeLimit,
        maxAttempts: lessonFormState.maxAttempts,
        shuffleQuestions: lessonFormState.shuffleQuestions,
        shuffleOptions: lessonFormState.shuffleOptions,
      });
    } else if (lessonFormState.lessonType === 'ASSIGNMENT') {
      metaDescription = JSON.stringify({
        assignmentInstructions: lessonFormState.assignmentInstructions,
        assignmentSubmissionType: lessonFormState.assignmentSubmissionType,
        assignmentMaxMarks: lessonFormState.assignmentMaxMarks,
        assignmentDueDate: lessonFormState.assignmentDueDate,
        assignmentAllowResubmission: lessonFormState.assignmentAllowResubmission,
      });
    }

    const payload: any = {
      title: lessonFormState.title.trim(),
      description: metaDescription,
      lessonType: lessonFormState.lessonType,
      contentUrl: finalContentUrl,
      duration: lessonFormState.duration || '10:00',
      durationSeconds: lessonFormState.durationSeconds || 0,
      freePreview: lessonFormState.freePreview,
      required: lessonFormState.required,
      videoKey: finalVideoKey,
      quizQuestions: lessonFormState.lessonType === 'QUIZ' ? lessonFormState.quizQuestions : undefined,
    };

    try {
      if (lessonModalMode === 'create') {
        const created = await addCourseLesson(currentSectionForLesson.id, payload);
        setSections(
          sections.map((s) => {
            if (s.id === currentSectionForLesson.id) {
              return {
                ...s,
                lessons: [...(s.lessons || []), { ...created, quizQuestions: payload.quizQuestions }],
              };
            }
            return s;
          })
        );
        if (onShowToast) onShowToast('Lesson created successfully!');
      } else if (editingLessonId) {
        const updated = await updateCourseLesson(editingLessonId, payload);
        setSections(
          sections.map((s) => {
            if (s.id === currentSectionForLesson.id) {
              return {
                ...s,
                lessons: (s.lessons || []).map((l: any) =>
                  l.id === editingLessonId ? { ...l, ...updated, quizQuestions: payload.quizQuestions } : l
                ),
              };
            }
            return s;
          })
        );
        if (onShowToast) onShowToast('Lesson updated successfully!');
      }

      setLessonModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Failed to save lesson: ' + (err?.response?.data?.error || err.message));
    }
  };




  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Data Science & AI');
  const [level, setLevel] = useState('Intermediate');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('12 hours');
  const [instructor, setInstructor] = useState('InGage Lead Instructor');
  const [thumbnail, setThumbnail] = useState('');
  const [banner, setBanner] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState<number>(1999);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);

  // Categories list
  const [categories, setCategories] = useState<any[]>([]);

  // Sections & Lessons builder
  const [sections, setSections] = useState<any[]>([]);
  const [savedCourseId, setSavedCourseId] = useState<number | string | null>(courseId || null);

  // Active Modals
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');

  const [isManualSlug, setIsManualSlug] = useState(Boolean(courseId));

  // Section edit modal
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editSectionDesc, setEditSectionDesc] = useState('');
  const [editSectionStatus, setEditSectionStatus] = useState<'PUBLISHED' | 'DRAFT'>('DRAFT');
  const [editSectionIsFreePreview, setEditSectionIsFreePreview] = useState(false);
  const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<{ url: string; title: string } | null>(null);
  const [adminPreviewContent, setAdminPreviewContent] = useState<{ title: string; content: string } | null>(null);

  const getSectionMeta = (sec: any) => {
    try {
      if (sec.description && typeof sec.description === 'string' && sec.description.startsWith('{')) {
        const parsed = JSON.parse(sec.description);
        return {
          status: (parsed.status || 'DRAFT') as 'PUBLISHED' | 'DRAFT',
          freePreview: Boolean(parsed.freePreview),
        };
      }
    } catch {}
    return {
      status: ((sec.status as string) || 'DRAFT') as 'PUBLISHED' | 'DRAFT',
      freePreview: Boolean(sec.freePreview || sec.isFreePreview),
    };
  };

  // Lesson edit modal
  const [editingLesson, setEditingLesson] = useState<{ sectionId: number; lesson: any } | null>(null);
  const [editLessonForm, setEditLessonForm] = useState({
    title: '',
    description: '',
    lessonType: 'VIDEO',
    contentUrl: '',
    duration: '10m',
    durationSeconds: 600,
    freePreview: false,
    required: true,
  });

  
  // Dedicated Video Lesson Modal State
  const [activeSectionForVideoLesson, setActiveSectionForVideoLesson] = useState<any>(null);
  const [videoLessonForm, setVideoLessonForm] = useState<{
    title: string;
    file: File | null;
    fileName: string;
    videoUrl: string;
    duration: string;
    durationSeconds: number;
    detectedDurationFormatted: string;
    uploadPercent: number;
    uploadStatus: 'idle' | 'detecting' | 'uploading' | 'uploaded' | 'error';
    errorMessage: string | null;
    freePreview: boolean;
    required: boolean;
  }>({
    title: '',
    file: null,
    fileName: '',
    videoUrl: '',
    duration: '00:00',
    durationSeconds: 0,
    detectedDurationFormatted: '',
    uploadPercent: 0,
    uploadStatus: 'idle',
    errorMessage: null,
    freePreview: false,
    required: true,
  });

  // Calculate total duration in seconds for a specific module/section
  const calculateSectionVideoDuration = (sec: any): number => {
    if (!sec || !sec.lessons) return 0;
    return sec.lessons.reduce((total: number, les: any) => {
      if (les.lessonType === 'VIDEO') {
        return total + parseDurationToSeconds(les.duration, les.durationSeconds);
      }
      return total;
    }, 0);
  };

  // Calculate course totals across all sections
  const courseStats = React.useMemo(() => {
    let totalLessonsCount = 0;
    let totalVideoLessonsCount = 0;
    let totalVideoDurationSec = 0;

    sections.forEach((sec) => {
      (sec.lessons || []).forEach((les: any) => {
        totalLessonsCount += 1;
        if (les.lessonType === 'VIDEO') {
          totalVideoLessonsCount += 1;
          totalVideoDurationSec += parseDurationToSeconds(les.duration, les.durationSeconds);
        }
      });
    });

    return {
      modulesCount: sections.length,
      lessonsCount: totalLessonsCount,
      videoLessonsCount: totalVideoLessonsCount,
      totalVideoSeconds: totalVideoDurationSec,
      formattedTotalDuration: formatDurationHuman(totalVideoDurationSec),
      formattedDigitalTotal: formatDurationDigital(totalVideoDurationSec),
    };
  }, [sections]);

  const [activeSectionForLesson, setActiveSectionForLesson] = useState<any>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    lessonType: 'VIDEO',
    contentUrl: '',
    duration: '10m',
    durationSeconds: 600,
    freePreview: false,
    required: true,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate final price automatically
  const calculateFinalPrice = (): number => {
    if (isFree || price <= 0) return 0;
    if (!discountValue || discountValue <= 0) return price;

    if (discountType === 'PERCENTAGE') {
      const discounted = price - price * (discountValue / 100);
      return Math.max(0, Math.round(discounted * 100) / 100);
    } else {
      return Math.max(0, price - discountValue);
    }
  };

  const finalPrice = calculateFinalPrice();

  const generateSlugFromTitle = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isManualSlug) {
      setSlug(generateSlugFromTitle(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setIsManualSlug(true);
  };

  const handleResetSlug = () => {
    setIsManualSlug(false);
    setSlug(generateSlugFromTitle(title));
  };

  useEffect(() => {
    getCourseCategories()
      .then((cats) => {
        if (Array.isArray(cats)) {
          setCategories(cats);
          if (!courseId && cats.length > 0) {
            setCategory((prev) => prev && cats.some((c: any) => c.name === prev) ? prev : cats[0].name);
          }
        }
      })
      .catch(() => {});

    if (courseId) {
      getAdminCourseById(courseId)
        .then((data) => {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setIsManualSlug(Boolean(data.slug));
          setShortDescription(data.shortDescription || '');
          setDescription(data.description || '');
          setCategory(data.category || 'Data Science & AI');
          setLevel(data.level || 'Intermediate');
          setLanguage(data.language || 'English');
          setDuration(data.duration || '12 hours');
          setInstructor(data.instructor || 'InGage Lead Instructor');
          setThumbnail(data.thumbnail || '');
          setBanner(data.banner || '');
          setPrice(data.price || 0);
          setIsFree(data.price === 0);
          if (data.discountType) setDiscountType(data.discountType);
          if (data.discountValue) setDiscountValue(data.discountValue);
          setSections(data.sections || []);
          setSavedCourseId(courseId);
        })
        .catch((err) => {
          console.error('Failed to load course details', err);
        });
    }
  }, [courseId]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'thumbnail' | 'banner' | 'lessonVideo' | 'editLessonVideo'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can pick the same file again if desired
    e.target.value = '';

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const categoryType = (target === 'lessonVideo' || target === 'editLessonVideo') ? 'video' : 'thumbnail';
      // Automatically detect video duration if video is uploaded for a lesson
      let detectedSec = 0;
      if (target === 'lessonVideo' || target === 'editLessonVideo') {
        try {
          detectedSec = await detectVideoDuration(file);
        } catch {}
      }

      const res = await uploadMediaFile(file, categoryType);
      if (res && res.url) {
        if (target === 'thumbnail') setThumbnail(res.url);
        else if (target === 'banner') setBanner(res.url);
        else if (target === 'lessonVideo') {
          setLessonForm((prev) => ({
            ...prev,
            contentUrl: res.url,
            ...(detectedSec > 0 ? { durationSeconds: detectedSec, duration: formatDurationMMSS(detectedSec) } : {}),
          }));
        } else if (target === 'editLessonVideo') {
          setEditLessonForm((prev) => ({
            ...prev,
            contentUrl: res.url,
            ...(detectedSec > 0 ? { durationSeconds: detectedSec, duration: formatDurationMMSS(detectedSec) } : {}),
          }));
        }
        if (onShowToast) onShowToast('File uploaded successfully!');
      } else {
        const errorMsg = res?.error || 'Upload failed.';
        if (onShowToast) onShowToast(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Upload failed.';
      if (onShowToast) onShowToast(`Upload error: ${msg}`);
      else alert(`Upload error: ${msg}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Please enter a course title.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        shortDescription,
        description,
        category,
        level,
        language,
        duration,
        instructor,
        thumbnail,
        banner,
        price: isFree ? 0 : price,
        discountType: isFree ? null : discountType,
        discountValue: isFree ? 0 : discountValue,
        status: 'DRAFT',
      };

      let result;
      if (savedCourseId) {
        result = await updateAdminCourse(savedCourseId, payload);
      } else {
        result = await createAdminCourse(payload);
        setSavedCourseId(result.id);
      }

      if (onShowToast) onShowToast('Course draft saved successfully!');
    } catch {
      if (onShowToast) onShowToast('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setValidationErrors([]);
    const errors: string[] = [];

    if (!title.trim()) errors.push('Course title is required');
    if (!description.trim()) errors.push('Course description is required');
    if (!category.trim()) errors.push('Category is required');
    if (!thumbnail.trim()) errors.push('Course thumbnail is required');
    if (!isFree && (price == null || price <= 0))
      errors.push('Valid price is required for paid courses');
    if (sections.length === 0) errors.push('Course must have at least one section/module');
    const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
    if (totalLessons === 0)
      errors.push('Course must contain at least one lesson before publishing');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        shortDescription,
        description,
        category,
        level,
        language,
        duration,
        instructor,
        thumbnail,
        banner,
        price: isFree ? 0 : price,
        discountType: isFree ? null : discountType,
        discountValue: isFree ? 0 : discountValue,
      };

      let activeId = savedCourseId;
      if (activeId) {
        await updateAdminCourse(activeId, payload);
      } else {
        const created = await createAdminCourse(payload);
        activeId = created.id;
        setSavedCourseId(activeId);
      }

      const res = await publishAdminCourse(activeId!);
      if (res.success) {
        if (onShowToast) onShowToast('Course published successfully to public catalog!');
        onNavigate('/admin/courses');
      } else {
        if (onShowToast) onShowToast(res.message || 'Validation failed.');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Publish failed.';
      if (onShowToast) onShowToast(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) {
      alert('Section title is required.');
      return;
    }

    let activeId = savedCourseId;
    if (!activeId) {
      if (!title.trim()) {
        alert('Please provide a course title first.');
        return;
      }
      try {
        const created = await createAdminCourse({
          title,
          category,
          price: isFree ? 0 : price,
          status: 'DRAFT',
        });
        activeId = created.id;
        setSavedCourseId(activeId);
      } catch {
        alert('Failed to initialize course record.');
        return;
      }
    }

    try {
      const payloadDesc = JSON.stringify({
        status: 'DRAFT',
        freePreview: Boolean(sectionIsFreePreview),
      });
      const newSec = await addCourseSection(activeId!, {
        title: newSectionTitle.trim(),
        description: payloadDesc,
      });
      const createdModule = {
        ...newSec,
        description: payloadDesc,
        status: 'DRAFT',
        freePreview: false,
        lessons: [],
      };
      setSections([...sections, createdModule]);
      setExpandedSections((prev) => ({ ...prev, [createdModule.id]: true }));
      setNewSectionTitle('');
      setNewSectionDesc('');
      setIsAddingSection(false);
      if (onShowToast) onShowToast('Module created as Draft!');
      // Immediately open Video Upload editor for newly created module
      handleOpenAddLessonModal(createdModule, 'VIDEO');
    } catch {
      if (onShowToast) onShowToast('Failed to add module.');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm('Delete this entire module section and its lessons?')) return;
    try {
      await deleteCourseSection(sectionId);
      setSections(sections.filter((s) => s.id !== sectionId));
      if (onShowToast) onShowToast('Section deleted.');
    } catch {
      if (onShowToast) onShowToast('Failed to delete section.');
    }
  };

  
  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validExtensions = /\.(mp4|webm|mov|mkv)$/i;
    const isVideoMime = file.type.startsWith('video/') || validExtensions.test(file.name);
    if (!isVideoMime) {
      setVideoLessonForm((prev) => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: 'Unsupported video format. Please upload MP4, WebM, or MOV.',
      }));
      return;
    }

    const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();

    setVideoLessonForm((prev) => ({
      ...prev,
      file,
      fileName: file.name,
      title: prev.title.trim() ? prev.title : cleanFileName,
      uploadStatus: 'detecting',
      uploadPercent: 0,
      errorMessage: null,
    }));

    try {
      const durationSec = await detectVideoDuration(file);
      const formatted = formatDurationMMSS(durationSec);
      setVideoLessonForm((prev) => ({
        ...prev,
        durationSeconds: durationSec,
        duration: formatted,
        detectedDurationFormatted: formatted,
        uploadStatus: 'idle',
      }));
    } catch {
      setVideoLessonForm((prev) => ({
        ...prev,
        uploadStatus: 'idle',
      }));
    }
  };

  const handleUploadAndCreateVideoLesson = async () => {
    if (!activeSectionForVideoLesson) return;
    if (!videoLessonForm.title.trim()) {
      alert('Lesson title is required.');
      return;
    }
    if (!videoLessonForm.file && !videoLessonForm.videoUrl) {
      alert('Please select a video file or provide a video URL.');
      return;
    }

    try {
      setVideoLessonForm((prev) => ({ ...prev, uploadStatus: 'uploading', uploadPercent: 25 }));
      let finalUrl = videoLessonForm.videoUrl;

      if (videoLessonForm.file) {
        setVideoLessonForm((prev) => ({ ...prev, uploadPercent: 45 }));
        const res = await uploadMediaFile(videoLessonForm.file, 'video');
        if (!res || !res.url) {
          throw new Error(res?.error || 'Video upload failed.');
        }
        finalUrl = res.url;
        setVideoLessonForm((prev) => ({ ...prev, uploadPercent: 85 }));
      }

      const payload = {
        title: videoLessonForm.title.trim(),
        lessonType: 'VIDEO',
        contentUrl: finalUrl,
        duration: videoLessonForm.duration || '00:00',
        durationSeconds: videoLessonForm.durationSeconds || 0,
        freePreview: videoLessonForm.freePreview,
        required: videoLessonForm.required,
      };

      const created = await addCourseLesson(activeSectionForVideoLesson.id, payload);

      setSections(
        sections.map((s) => {
          if (s.id === activeSectionForVideoLesson.id) {
            return {
              ...s,
              lessons: [...(s.lessons || []), created],
            };
          }
          return s;
        })
      );

      setActiveSectionForVideoLesson(null);
      setVideoLessonForm({
        title: '',
        file: null,
        fileName: '',
        videoUrl: '',
        duration: '00:00',
        durationSeconds: 0,
        detectedDurationFormatted: '',
        uploadPercent: 100,
        uploadStatus: 'idle',
        errorMessage: null,
        freePreview: false,
        required: true,
      });

      if (onShowToast) onShowToast('Video lesson created successfully!');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || 'Video upload failed.';
      setVideoLessonForm((prev) => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: msg,
      }));
      if (onShowToast) onShowToast(`Error: ${msg}`);
    }
  };

  const handleAddLesson = async () => {
    if (!activeSectionForLesson) return;
    if (!lessonForm.title.trim()) {
      alert('Lesson title is required.');
      return;
    }

    try {
      const created = await addCourseLesson(activeSectionForLesson.id, lessonForm);
      setSections(
        sections.map((s) => {
          if (s.id === activeSectionForLesson.id) {
            return {
              ...s,
              lessons: [...(s.lessons || []), created],
            };
          }
          return s;
        })
      );
      setActiveSectionForLesson(null);
      setLessonForm({
        title: '',
        description: '',
        lessonType: 'VIDEO',
        contentUrl: '',
        duration: '10m',
        durationSeconds: 600,
        freePreview: false,
        required: true,
      });
      if (onShowToast) onShowToast('Lesson added!');
    } catch {
      if (onShowToast) onShowToast('Failed to add lesson.');
    }
  };

  const handleDeleteLesson = async (sectionId: number, lessonId: number) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await deleteCourseLesson(lessonId);
      setSections(
        sections.map((s) => {
          if (s.id === sectionId) {
            return {
              ...s,
              lessons: (s.lessons || []).filter((l: any) => l.id !== lessonId),
            };
          }
          return s;
        })
      );
      if (onShowToast) onShowToast('Lesson removed');
    } catch {
      if (onShowToast) onShowToast('Failed to delete lesson.');
    }
  };

  const handleMoveSection = async (sectionIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? sectionIdx - 1 : sectionIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[sectionIdx];
    newSections[sectionIdx] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    const updated = newSections.map((s, idx) => ({ ...s, displayOrder: idx }));
    setSections(updated);

    try {
      await Promise.all([
        updateCourseSection(updated[sectionIdx].id, { title: updated[sectionIdx].title, description: updated[sectionIdx].description, displayOrder: sectionIdx } as any),
        updateCourseSection(updated[targetIdx].id, { title: updated[targetIdx].title, description: updated[targetIdx].description, displayOrder: targetIdx } as any),
      ]);
    } catch (err) {
      console.error('Failed to sync section reorder', err);
    }
  };

  const handleMoveLesson = async (sectionId: number, lessonIdx: number, direction: 'up' | 'down') => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.lessons) return;

    const targetIdx = direction === 'up' ? lessonIdx - 1 : lessonIdx + 1;
    if (targetIdx < 0 || targetIdx >= section.lessons.length) return;

    const newLessons = [...section.lessons];
    const temp = newLessons[lessonIdx];
    newLessons[lessonIdx] = newLessons[targetIdx];
    newLessons[targetIdx] = temp;

    const updatedLessons = newLessons.map((l, idx) => ({ ...l, displayOrder: idx }));

    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, lessons: updatedLessons };
        }
        return s;
      })
    );

    try {
      await Promise.all([
        updateCourseLesson(updatedLessons[lessonIdx].id, { displayOrder: lessonIdx }),
        updateCourseLesson(updatedLessons[targetIdx].id, { displayOrder: targetIdx }),
      ]);
    } catch (err) {
      console.error('Failed to sync lesson reorder', err);
    }
  };

  const handleOpenEditSection = (sec: any) => {
    setEditingSection(sec);
    setEditSectionTitle(sec.title || '');
    const meta = getSectionMeta(sec);
    setEditSectionStatus(meta.status);
    setEditSectionIsFreePreview(meta.freePreview);
  };

  const handleSaveEditSection = async () => {
    if (!editingSection || !editSectionTitle.trim()) return;
    try {
      const payloadDesc = JSON.stringify({
        status: editSectionStatus,
        freePreview: editSectionIsFreePreview,
      });
      const updated = await updateCourseSection(editingSection.id, {
        title: editSectionTitle.trim(),
        description: payloadDesc,
      });
      setSections(
        sections.map((s) =>
          s.id === editingSection.id
            ? {
                ...s,
                title: updated.title,
                description: payloadDesc,
                status: editSectionStatus,
                freePreview: editSectionIsFreePreview,
              }
            : s
        )
      );
      setEditingSection(null);
      if (onShowToast) onShowToast('Module updated successfully!');
    } catch {
      if (onShowToast) onShowToast('Failed to update module.');
    }
  };

  const handleOpenEditLesson = (sectionId: number, lesson: any) => {
    setEditingLesson({ sectionId, lesson });
    setEditLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      lessonType: lesson.lessonType || 'VIDEO',
      contentUrl: lesson.contentUrl || '',
      duration: lesson.duration || '10m',
      durationSeconds: lesson.durationSeconds || 600,
      freePreview: Boolean(lesson.freePreview),
      required: lesson.required !== false,
    });
  };

  const handleSaveEditLesson = async () => {
    if (!editingLesson || !editLessonForm.title.trim()) return;
    try {
      const computedSec = parseDurationToSeconds(editLessonForm.duration, editLessonForm.durationSeconds);
      const payloadToSave = {
        ...editLessonForm,
        durationSeconds: computedSec,
        duration: editLessonForm.duration || formatDurationMMSS(computedSec),
      };
      const updated = await updateCourseLesson(editingLesson.lesson.id, payloadToSave);
      setSections(
        sections.map((s) => {
          if (s.id === editingLesson.sectionId) {
            return {
              ...s,
              lessons: (s.lessons || []).map((l: any) => (l.id === editingLesson.lesson.id ? { ...l, ...updated } : l)),
            };
          }
          return s;
        })
      );
      setEditingLesson(null);
      if (onShowToast) onShowToast('Lesson updated successfully!');
    } catch {
      if (onShowToast) onShowToast('Failed to update lesson.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/courses')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            title="Back to courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Course Curriculum & Pricing' : 'Course Creation Studio'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure InGage course details, pricing discounts, and multi-module lesson content.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4" />
            <span>Cannot publish course. Please address the following issues:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-rose-700">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          1. Basic Course Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Course Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Master Enterprise Python, Docker & Microservices"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Slug (URL identifier)</label>
              <button
                type="button"
                onClick={handleResetSlug}
                className="text-[11px] text-green-700 hover:text-green-800 font-semibold flex items-center gap-1 cursor-pointer"
                title="Auto-generate from title"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-sync</span>
              </button>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. enterprise-python-docker (auto-generated from title)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
            >
              {categories && categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value={category || 'Web Development'}>{category || 'Web Development'}</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Language</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Estimated Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 14 hours / 6 weeks"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Lead Instructor</label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Instructor Name"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief 1-2 sentence hook for course cards..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Full Description *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comprehensive syllabus, target audience, and prerequisites..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          {/* Thumbnail & Banner Uploaders */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Thumbnail Image (Paste URL or Upload) *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://... or click Upload to select image"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              />
              <label className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 transition shadow-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'thumbnail')}
                  className="hidden"
                />
              </label>
            </div>
            {thumbnail && (
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={getAccessibleImageUrl(thumbnail)}
                  alt="Thumbnail preview"
                  className="w-24 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setThumbnail('')}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Course Banner Image (Paste URL or Upload)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="Header cover photo URL or click Upload"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              />
              <label className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 transition shadow-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner')}
                  className="hidden"
                />
              </label>
            </div>
            {banner && (
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={getAccessibleImageUrl(banner)}
                  alt="Banner preview"
                  className="w-32 h-16 object-cover rounded-lg border border-slate-200 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setBanner('')}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Remove banner
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Discount Engine */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            2. Pricing & Promotional Discount
          </h2>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
            />
            <span>Mark as FREE Course</span>
          </label>
        </div>

        {!isFree && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Base Price (₹) *</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Discount Type</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
              >
                <option value="PERCENTAGE">PERCENTAGE (%)</option>
                <option value="FIXED_AMOUNT">FIXED AMOUNT (₹)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Discount Value</label>
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
              />
            </div>
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Automatic Price Calculation
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600">
                Original Price: <b className="text-slate-900">₹{isFree ? 0 : price}</b>
              </span>
              {!isFree && discountValue > 0 && (
                <span className="text-amber-700 font-medium">
                  Discount: {discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Student Pays:</span>
            <span className="text-xl font-bold text-green-700">
              {isFree || finalPrice === 0 ? 'FREE' : `₹${finalPrice.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      
      {/* Course Content Builder (Sections & Lessons) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header & Course Summary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              3. Curriculum &amp; Content Builder
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize course into modules and lessons (Video, Text, PDF, Quiz, Assignment)
            </p>
          </div>

          {/* + Add Module / Section Button */}
            <button
              type="button"
              onClick={() => {
                if (!savedCourseId) {
                  handleSaveDraft();
                }
                setNewSectionTitle('');
                setNewSectionDesc('');
                setSectionStatus('DRAFT');
                setSectionIsFreePreview(false);
                setIsAddingSection(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl border border-green-200 transition-colors cursor-pointer shadow-2xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Add Module / Section</span>
            </button>
        </div>

        {/* Top Curriculum Statistics Banner */}
        {sections.length > 0 && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Curriculum Overview</h3>
                <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                  <span><strong>{courseStats.modulesCount}</strong> {courseStats.modulesCount === 1 ? 'Module' : 'Modules'}</span>
                  <span className="text-slate-500">•</span>
                  <span><strong>{courseStats.lessonsCount}</strong> {courseStats.lessonsCount === 1 ? 'Lesson' : 'Lessons'}</span>
                  <span className="text-slate-500">•</span>
                  <span><strong>{courseStats.videoLessonsCount}</strong> Video {courseStats.videoLessonsCount === 1 ? 'Lesson' : 'Lessons'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 shrink-0">
              <Video className="w-4 h-4 text-green-400 shrink-0" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Video Duration</div>
                <div className="text-xs sm:text-sm font-mono font-bold text-green-400">
                  {courseStats.formattedTotalDuration}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sections List */}
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-2xs border border-slate-200">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-700">No curriculum sections created yet.</p>
                <p className="text-slate-400 mt-0.5">Click &quot;+ Add Module / Section&quot; to begin building lessons.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!savedCourseId) {
                    handleSaveDraft();
                  }
                  setNewSectionTitle('');
                  setNewSectionDesc('');
                  setSectionStatus('DRAFT');
                  setSectionIsFreePreview(false);
                  setIsAddingSection(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Add Module / Section</span>
              </button>
            </div>
          ) : (
            sections.map((sec, secIdx) => {
              const moduleVideoSeconds = calculateSectionVideoDuration(sec);
              const digitalModuleDuration = formatDurationDigital(moduleVideoSeconds);
              const humanModuleDuration = formatDurationHuman(moduleVideoSeconds);
              const isExpanded = expandedSections[sec.id] !== false;

              return (
                <div
                  key={sec.id}
                  draggable={true}
                  onDragStart={() => handleSectionDragStart(secIdx)}
                  onDragOver={handleSectionDragOver}
                  onDrop={() => handleSectionDrop(secIdx)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Module / Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1" title="Drag to reorder module">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-green-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {secIdx + 1}
                      </span>
                      {(() => {
                        const secMeta = getSectionMeta(sec);
                        return (
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-green-800">
                                Module {secIdx + 1}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                secMeta.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {secMeta.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                              </span>
                              {secMeta.freePreview && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">{sec.title}</h3>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
                      {/* Duration & Lesson stats */}
                      <span className="text-xs text-slate-500 font-semibold px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        {sec.lessons?.length || 0} Lessons • {humanModuleDuration}
                      </span>

                      {/* Reorder Section Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        disabled={secIdx === 0}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Module Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Reorder Section Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        disabled={secIdx === sections.length - 1}
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Module Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Edit Section */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditSection(sec)}
                        className="p-1.5 text-slate-500 hover:text-green-700 transition-colors cursor-pointer"
                        title="Edit Module Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* + Add Video Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddLessonModal(sec, 'VIDEO')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        title="Upload Video directly into this module"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>+ Add Video</span>
                      </button>

                      {/* + Add Content Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddLessonModal(sec, 'TEXT')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                        title="Add Reading / Text Content to this module"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>+ Add Content</span>
                      </button>

                      {/* Delete Section */}
                      <button
                        type="button"
                        onClick={() => setDeletingSectionId(sec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Expand / Collapse Chevron */}
                      <button
                        type="button"
                        onClick={() => toggleSectionExpand(sec.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse Module' : 'Expand Module'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Lessons List in Section (if expanded) */}
                  {isExpanded && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-bold border-b border-slate-200/60 pb-2">
                        <span className="uppercase tracking-wider text-slate-700 font-extrabold">Lessons ({sec.lessons?.length || 0})</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenAddLessonModal(sec, 'VIDEO')}
                            className="text-green-700 hover:text-green-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>+ Add Video</span>
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddLessonModal(sec, 'TEXT')}
                            className="text-amber-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>+ Add Content</span>
                          </button>
                        </div>
                      </div>
                      {!sec.lessons || sec.lessons.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2.5 bg-white p-6">
                          <p className="font-semibold text-slate-600 text-sm">No lessons added yet.</p>
                          <p className="text-[11px] text-slate-400">Click below to upload a course video or add reading material directly to this module.</p>
                          <div className="flex items-center justify-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAddLessonModal(sec, 'VIDEO')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>+ Add Video</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAddLessonModal(sec, 'TEXT')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>+ Add Content</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        sec.lessons.map((les: any, lesIdx: number) => {
                          const displayDuration = les.duration || (les.durationSeconds ? formatDurationMMSS(les.durationSeconds) : '10:00');

                          return (
                            <div
                              key={les.id}
                              draggable={true}
                              onDragStart={() => handleLessonDragStart(sec.id, lesIdx)}
                              onDragOver={handleLessonDragOver}
                              onDrop={() => handleLessonDrop(sec.id, lesIdx)}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 bg-white border border-slate-200 rounded-xl text-xs hover:border-green-300 transition-all shadow-xs gap-3"
                            >
                              {/* Lesson Number, Icon & Title */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0" title="Drag to reorder lesson">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-mono text-slate-500 font-bold shrink-0 text-xs">
                                  {String(lesIdx + 1).padStart(2, '0')}
                                </span>

                                {les.lessonType === 'VIDEO' ? (
                                  <div className="w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                    <Video className="w-3.5 h-3.5" />
                                  </div>
                                ) : les.lessonType === 'QUIZ' ? (
                                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </div>
                                ) : les.lessonType === 'PDF' ? (
                                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                                    <FileCheck className="w-3.5 h-3.5" />
                                  </div>
                                ) : les.lessonType === 'ASSIGNMENT' ? (
                                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Award className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900 truncate">
                                      {les.title}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase shrink-0">
                                      {les.lessonType || 'VIDEO'}
                                    </span>
                                    {les.freePreview && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 uppercase font-bold shrink-0">
                                        Free Preview
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                    <span>{les.lessonType === 'VIDEO' ? '🎥 Video' : les.lessonType === 'TEXT' ? '📄 Content' : les.lessonType}</span>
                                    {les.lessonType === 'VIDEO' && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono text-slate-600 font-semibold">{displayDuration}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Duration & Actions */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{displayDuration}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {les.lessonType === 'VIDEO' && les.contentUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setAdminPreviewVideo({ url: les.contentUrl, title: les.title })}
                                      className="px-2.5 py-1 text-xs font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                      title="Preview Video Player"
                                    >
                                      <Play className="w-3 h-3 text-green-600" />
                                      <span>Preview</span>
                                    </button>
                                  )}

                                  {les.lessonType === 'TEXT' && (
                                    <button
                                      type="button"
                                      onClick={() => setAdminPreviewContent({ title: les.title, content: les.textContent || les.description || '' })}
                                      className="px-2.5 py-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                      title="View Content Reading Material"
                                    >
                                      <BookOpen className="w-3 h-3 text-amber-600" />
                                      <span>View</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditLessonModal(sec, les)}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                    title="Edit Lesson"
                                  >
                                    <Edit2 className="w-3 h-3 text-slate-500" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(sec.id, les.id)}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                    title="Delete Lesson"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    <span>Delete</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(sec.id, lesIdx, 'up')}
                                    disabled={lesIdx === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(sec.id, lesIdx, 'down')}
                                    disabled={lesIdx === (sec.lessons?.length || 1) - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Module Footer: Total Duration & Add Lesson */}
                  {sec.lessons && sec.lessons.length > 0 && isExpanded && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Total module duration:</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          {digitalModuleDuration}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({humanModuleDuration})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddLessonModal(sec, 'VIDEO')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>+ Add Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddLessonModal(sec, 'TEXT')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>+ Add Content</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Module / Section (Only Module Title *) */}
      {isAddingSection && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Module / Section</h3>
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Module 1 — Introduction to Python"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Create Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Module (Only Module Title *) */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Module</h3>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  value={editSectionTitle}
                  onChange={(e) => setEditSectionTitle(e.target.value)}
                  placeholder="e.g. Module 1 — Introduction to Python"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditSection}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Update Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Module Confirmation */}
      {deletingSectionId !== null && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Module</h3>
                <p className="text-xs text-slate-500">Confirm irreversible action</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this module and all of its lessons?
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSectionId(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const idToDelete = deletingSectionId;
                  setDeletingSectionId(null);
                  try {
                    await deleteCourseSection(idToDelete);
                    setSections(sections.filter((s) => s.id !== idToDelete));
                    if (onShowToast) onShowToast('Module deleted.');
                  } catch {
                    if (onShowToast) onShowToast('Failed to delete module.');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Delete Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Video Player Preview */}
      {adminPreviewVideo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{adminPreviewVideo.title || 'Video Player'}</h4>
                  <p className="text-[11px] text-slate-400">Admin Video Verification Preview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminPreviewVideo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
              {adminPreviewVideo.url.includes('youtube.com') || adminPreviewVideo.url.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(adminPreviewVideo.url)}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video
                  src={adminPreviewVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setAdminPreviewVideo(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Content Reader Preview */}
      {adminPreviewContent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{adminPreviewContent.title}</h4>
                  <p className="text-[11px] text-slate-400">Content Reading Material</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminPreviewContent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {adminPreviewContent.content || 'No text content available for this lesson.'}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setAdminPreviewContent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Comprehensive Add / Edit Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-3xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-700 border border-green-200 flex items-center justify-center font-bold shrink-0">
                  {lessonFormState.lessonType === 'VIDEO' ? <Video className="w-5 h-5 text-green-600" /> :
                   lessonFormState.lessonType === 'QUIZ' ? <HelpCircle className="w-5 h-5 text-purple-600" /> :
                   lessonFormState.lessonType === 'PDF' ? <FileCheck className="w-5 h-5 text-sky-600" /> :
                   lessonFormState.lessonType === 'ASSIGNMENT' ? <Award className="w-5 h-5 text-emerald-600" /> :
                   <FileText className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {lessonFormState.lessonType === 'VIDEO'
                      ? (lessonModalMode === 'create' ? 'Add Video Lesson' : 'Edit Video Lesson')
                      : lessonFormState.lessonType === 'TEXT'
                      ? (lessonModalMode === 'create' ? 'Add Content Lesson' : 'Edit Content Lesson')
                      : (lessonModalMode === 'create' ? 'Add Lesson / Content' : 'Edit Lesson / Content')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Module: <span className="font-semibold text-slate-700">{currentSectionForLesson?.title}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Lesson Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lessonFormState.lessonType === 'VIDEO' ? 'Video Title *' :
                   lessonFormState.lessonType === 'TEXT' ? 'Content Title *' :
                   'Lesson Title *'}
                </label>
                <input
                  type="text"
                  value={lessonFormState.title}
                  onChange={(e) => setLessonFormState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={
                    lessonFormState.lessonType === 'VIDEO'
                      ? 'e.g. Introduction to Python'
                      : lessonFormState.lessonType === 'TEXT'
                      ? 'e.g. Python Variables and Data Types'
                      : 'e.g. Lesson Title'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Content Type *
                </label>
                <select
                  value={lessonFormState.lessonType}
                  onChange={(e: any) => setLessonFormState((prev) => ({ ...prev, lessonType: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 font-semibold"
                >
                  <option value="VIDEO">🎥 Video Lesson</option>
                  <option value="TEXT">📝 Text / Reading Lesson</option>
                  <option value="PDF">📄 PDF / Document Lesson</option>
                  <option value="QUIZ">❓ Quiz &amp; Assessment</option>
                  <option value="ASSIGNMENT">📋 Project / Assignment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Status
                </label>
                <select
                  value={lessonFormState.status}
                  onChange={(e: any) => setLessonFormState((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>

            {/* Dynamic Content Type Sections */}

            {/* 1. VIDEO CONTENT TYPE */}
            {lessonFormState.lessonType === 'VIDEO' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-green-600" />
                    Video Settings &amp; Source
                  </span>

                  {/* Video Source Radio */}
                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setLessonFormState((prev) => ({ ...prev, videoSource: 'UPLOAD' }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        lessonFormState.videoSource === 'UPLOAD'
                          ? 'bg-green-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Local Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonFormState((prev) => ({ ...prev, videoSource: 'YOUTUBE' }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        lessonFormState.videoSource === 'YOUTUBE'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      YouTube URL
                    </button>
                  </div>
                </div>

                {/* Upload Video Section */}
                {lessonFormState.videoSource === 'UPLOAD' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
                        Upload Video *
                      </label>
                      <span className="text-[11px] text-slate-400">Supported: MP4, WebM, MOV</span>
                    </div>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLessonVideoUpload(file);
                      }}
                      className="border-2 border-dashed border-slate-200 hover:border-green-500 rounded-2xl p-6 text-center bg-white transition-colors shadow-2xs group"
                    >
                      <input
                        type="file"
                        id="lesson-video-picker"
                        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLessonVideoUpload(file);
                        }}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {lessonFormState.videoFileName ? lessonFormState.videoFileName : 'Upload Course Video'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Drag &amp; drop video here or
                          </p>
                        </div>
                        <label
                          htmlFor="lesson-video-picker"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Video</span>
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          MP4, WebM, MOV • Max 2GB
                        </p>
                      </div>
                    </div>

                    {/* Upload progress indicator */}
                    {lessonFormState.videoUploadStatus === 'uploading' && (
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                            Uploading video... {lessonFormState.videoFileName}
                          </span>
                          <span className="font-mono text-green-700 font-bold">{lessonFormState.videoUploadPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lessonFormState.videoUploadPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error state alert */}
                    {lessonFormState.videoUploadStatus === 'error' && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{lessonFormState.videoUploadError || 'Unable to upload video. Please try again.'}</span>
                        </div>
                        <label
                          htmlFor="lesson-video-picker"
                          className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-bold cursor-pointer transition text-[11px]"
                        >
                          Retry
                        </label>
                      </div>
                    )}

                    {/* Uploaded state card */}
                    {lessonFormState.contentUrl && lessonFormState.videoSource === 'UPLOAD' && (
                      <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-900">Video uploaded successfully</span>
                          </div>
                          <span className="font-mono text-xs text-green-800 font-bold bg-white px-2 py-0.5 rounded border border-green-300">
                            Duration: {lessonFormState.duration || '00:00'}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-600 truncate">
                          {lessonFormState.contentUrl}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setLessonFormState((prev) => ({
                                ...prev,
                                videoPreviewActive: !prev.videoPreviewActive,
                              }))
                            }
                            className="text-xs font-bold text-green-700 hover:text-green-900 bg-white px-3 py-1 rounded-lg border border-green-300 cursor-pointer shadow-2xs"
                          >
                            {lessonFormState.videoPreviewActive ? 'Hide Preview' : 'Preview Video'}
                          </button>
                          <label
                            htmlFor="lesson-video-picker"
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 cursor-pointer shadow-2xs"
                          >
                            Replace Video
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setLessonFormState((prev) => ({
                                ...prev,
                                contentUrl: '',
                                videoFileName: '',
                                videoUploadStatus: 'idle',
                                videoPreviewActive: false,
                              }))
                            }
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white px-3 py-1 rounded-lg border border-rose-200 cursor-pointer shadow-2xs"
                          >
                            Delete Video
                          </button>
                        </div>

                        {/* Interactive Player Preview */}
                        {lessonFormState.videoPreviewActive && (
                          <div className="pt-2">
                            <video
                              src={lessonFormState.contentUrl}
                              controls
                              className="w-full aspect-video rounded-xl bg-black object-contain shadow-md"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube Video Section */}
                {lessonFormState.videoSource === 'YOUTUBE' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        YouTube Video URL *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Youtube className="w-4 h-4 text-red-600 absolute left-3 top-3 pointer-events-none" />
                          <input
                            type="text"
                            value={lessonFormState.youtubeUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              const ytId = extractYouTubeId(val);
                              setLessonFormState((prev) => ({
                                ...prev,
                                youtubeUrl: val,
                                youtubeVideoId: ytId || '',
                                contentUrl: val,
                              }));
                            }}
                            placeholder="https://www.youtube.com/watch?v=XXXXXXXX or https://youtu.be/XXXXXXXX"
                            className="w-full pl-9 pr-3 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                          />
                        </div>
                      </div>
                      {lessonFormState.youtubeVideoId && (
                        <p className="text-[11px] text-green-700 font-semibold mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          YouTube Video ID extracted: <span className="font-mono">{lessonFormState.youtubeVideoId}</span>
                        </p>
                      )}
                    </div>

                    {/* YouTube Preview */}
                    {lessonFormState.youtubeVideoId && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
                        <iframe
                          src={`https://www.youtube.com/embed/${lessonFormState.youtubeVideoId}`}
                          className="w-full h-full"
                          title="YouTube preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Video Thumbnail */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Optional Video Thumbnail
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lessonFormState.videoThumbnailUrl || ''}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({ ...prev, videoThumbnailUrl: e.target.value }))
                      }
                      placeholder="Paste image URL or browse an image..."
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                    <input
                      type="file"
                      id="video-thumb-upload"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/uploads/thumbnail', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.url) {
                              setLessonFormState((prev) => ({ ...prev, videoThumbnailUrl: data.url }));
                            }
                          } catch {}
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="video-thumb-upload"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition"
                    >
                      Browse Image
                    </label>
                  </div>
                </div>

                {/* Video Description if needed */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Video Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={lessonFormState.description}
                    onChange={(e) =>
                      setLessonFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Key concepts or summary covered in this video..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                {/* Video Duration (Auto-detected or Manual) */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Video Duration (MM:SS or HH:MM:SS)
                    </label>
                    <input
                      type="text"
                      value={lessonFormState.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sec = parseDurationToSeconds(val);
                        setLessonFormState((prev) => ({
                          ...prev,
                          duration: val,
                          durationSeconds: sec,
                        }));
                      }}
                      placeholder="e.g. 12:35 or 01:15:42"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Duration in Seconds (Stored internally)
                    </label>
                    <input
                      type="number"
                      value={lessonFormState.durationSeconds}
                      onChange={(e) => {
                        const sec = parseInt(e.target.value, 10) || 0;
                        setLessonFormState((prev) => ({
                          ...prev,
                          durationSeconds: sec,
                          duration: formatDurationMMSS(sec),
                        }));
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. TEXT CONTENT TYPE */}
            {lessonFormState.lessonType === 'TEXT' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Rich Text Content &amp; Reading Material
                  </span>

                  {/* Write / Preview Tab */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setLessonFormState((prev) => ({ ...prev, textTab: 'write' }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        lessonFormState.textTab === 'write'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonFormState((prev) => ({ ...prev, textTab: 'preview' }))}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        lessonFormState.textTab === 'preview'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {lessonFormState.textTab === 'write' ? (
                  <div className="space-y-2">
                    {/* Formatting Helpers */}
                    <div className="flex items-center gap-1 flex-wrap bg-white p-1.5 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + '\n# Heading 1\n',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded font-bold text-slate-700"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + '\n## Heading 2\n',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded font-bold text-slate-700"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + ' **bold text** ',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded font-bold text-slate-700"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + ' *italic text* ',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded italic text-slate-700"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + '\n- Item 1\n- Item 2\n',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLessonFormState((prev) => ({
                            ...prev,
                            textContent: prev.textContent + ' [Link Title](https://example.com) ',
                          }))
                        }
                        className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Link</span>
                      </button>
                    </div>

                    <textarea
                      rows={8}
                      value={lessonFormState.textContent}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({
                          ...prev,
                          textContent: e.target.value,
                          description: e.target.value.substring(0, 150),
                        }))
                      }
                      placeholder="Write comprehensive lesson reading material, notes, code snippets, and explanations..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl min-h-[160px] prose prose-sm max-w-none text-slate-800">
                    {lessonFormState.textContent ? (
                      <div className="whitespace-pre-wrap">{lessonFormState.textContent}</div>
                    ) : (
                      <p className="text-slate-400 italic">No text content written yet. Switch to &quot;Write&quot; tab to add content.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. PDF CONTENT TYPE */}
            {lessonFormState.lessonType === 'PDF' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                  PDF Document Upload
                </span>

                <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-5 text-center bg-white transition-colors">
                  <input
                    type="file"
                    id="lesson-pdf-picker"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLessonPdfUpload(file);
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="lesson-pdf-picker"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {lessonFormState.pdfFileName ? 'Change PDF Document' : 'Click to Upload PDF'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PDF files are stored securely in <span className="font-mono text-slate-500">uploads/pdf/</span>
                      </p>
                    </div>
                  </label>
                </div>

                {lessonFormState.contentUrl && lessonFormState.lessonType === 'PDF' && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-sky-900">PDF Ready:</span>
                      <span className="font-mono text-slate-700 truncate max-w-[200px]">{lessonFormState.contentUrl}</span>
                    </div>
                    <a
                      href={lessonFormState.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-sky-100 text-sky-800 font-bold rounded border border-sky-300 transition"
                    >
                      View PDF
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* 4. QUIZ CONTENT TYPE */}
            {lessonFormState.lessonType === 'QUIZ' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                    Assessment &amp; Quiz Configuration
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLessonFormState((prev) => ({
                        ...prev,
                        quizQuestions: [
                          ...prev.quizQuestions,
                          {
                            questionText: `Question ${prev.quizQuestions.length + 1}`,
                            questionType: 'MCQ',
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            correctAnswer: 0,
                            marks: 1,
                            explanation: '',
                          },
                        ],
                      }));
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {/* Quiz Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Passing Score %</label>
                    <input
                      type="number"
                      value={lessonFormState.passingScore}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({ ...prev, passingScore: Number(e.target.value) || 0 }))
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Time Limit (mins)</label>
                    <input
                      type="number"
                      value={lessonFormState.timeLimit}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({ ...prev, timeLimit: Number(e.target.value) || 0 }))
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Max Attempts</label>
                    <input
                      type="number"
                      value={lessonFormState.maxAttempts}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({ ...prev, maxAttempts: Number(e.target.value) || 0 }))
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonFormState.shuffleQuestions}
                        onChange={(e) =>
                          setLessonFormState((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))
                        }
                        className="rounded text-purple-600"
                      />
                      <span>Shuffle</span>
                    </label>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold text-slate-800">
                    Questions ({lessonFormState.quizQuestions.length})
                  </div>

                  {lessonFormState.quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Question {qIdx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          <select
                            value={q.questionType}
                            onChange={(e: any) => {
                              const newType = e.target.value;
                              const updatedQs = [...lessonFormState.quizQuestions];
                              updatedQs[qIdx] = {
                                ...updatedQs[qIdx],
                                questionType: newType,
                                options: newType === 'TRUE_FALSE' ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'],
                                correctAnswer: 0,
                              };
                              setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                            }}
                            className="text-[11px] p-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700"
                          >
                            <option value="MCQ">Single Choice / MCQ</option>
                            <option value="MULTIPLE">Multiple Choice</option>
                            <option value="TRUE_FALSE">True / False</option>
                          </select>

                          {/* Move up */}
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => {
                              const updatedQs = [...lessonFormState.quizQuestions];
                              const temp = updatedQs[qIdx];
                              updatedQs[qIdx] = updatedQs[qIdx - 1];
                              updatedQs[qIdx - 1] = temp;
                              setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move down */}
                          <button
                            type="button"
                            disabled={qIdx === lessonFormState.quizQuestions.length - 1}
                            onClick={() => {
                              const updatedQs = [...lessonFormState.quizQuestions];
                              const temp = updatedQs[qIdx];
                              updatedQs[qIdx] = updatedQs[qIdx + 1];
                              updatedQs[qIdx + 1] = temp;
                              setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedQs = lessonFormState.quizQuestions.filter((_, idx) => idx !== qIdx);
                              setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => {
                          const updatedQs = [...lessonFormState.quizQuestions];
                          updatedQs[qIdx] = { ...updatedQs[qIdx], questionText: e.target.value };
                          setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                        }}
                        placeholder="Enter question statement..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              q.correctAnswer === optIdx
                                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-ans-${qIdx}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() => {
                                const updatedQs = [...lessonFormState.quizQuestions];
                                updatedQs[qIdx] = { ...updatedQs[qIdx], correctAnswer: optIdx };
                                setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                              }}
                              className="text-emerald-600"
                              title="Set as correct answer"
                            />
                            <span className="text-[11px] font-bold text-slate-500 w-5">
                              {String.fromCharCode(65 + optIdx)}:
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updatedQs = [...lessonFormState.quizQuestions];
                                const updatedOpts = [...updatedQs[qIdx].options];
                                updatedOpts[optIdx] = e.target.value;
                                updatedQs[qIdx] = { ...updatedQs[qIdx], options: updatedOpts };
                                setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                              }}
                              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const updatedQs = [...lessonFormState.quizQuestions];
                          updatedQs[qIdx] = { ...updatedQs[qIdx], explanation: e.target.value };
                          setLessonFormState((prev) => ({ ...prev, quizQuestions: updatedQs }));
                        }}
                        placeholder="Optional explanation shown after answering..."
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ASSIGNMENT CONTENT TYPE */}
            {lessonFormState.lessonType === 'ASSIGNMENT' && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Practical Assignment &amp; Project Task
                </span>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Assignment Instructions *
                  </label>
                  <textarea
                    rows={4}
                    value={lessonFormState.assignmentInstructions}
                    onChange={(e) =>
                      setLessonFormState((prev) => ({ ...prev, assignmentInstructions: e.target.value }))
                    }
                    placeholder="Provide detailed instructions, grading criteria, deliverables, and guidelines..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Submission Type
                    </label>
                    <select
                      value={lessonFormState.assignmentSubmissionType}
                      onChange={(e: any) =>
                        setLessonFormState((prev) => ({ ...prev, assignmentSubmissionType: e.target.value }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      <option value="FILE">File Upload (ZIP, PDF, Repo)</option>
                      <option value="TEXT">Text Submission</option>
                      <option value="LINK">External Link (GitHub, URL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      value={lessonFormState.assignmentMaxMarks}
                      onChange={(e) =>
                        setLessonFormState((prev) => ({ ...prev, assignmentMaxMarks: Number(e.target.value) || 0 }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonFormState.assignmentAllowResubmission}
                        onChange={(e) =>
                          setLessonFormState((prev) => ({ ...prev, assignmentAllowResubmission: e.target.checked }))
                        }
                        className="rounded text-emerald-600"
                      />
                      <span>Allow Resubmission</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* General Toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lessonFormState.freePreview}
                  onChange={(e) =>
                    setLessonFormState((prev) => ({ ...prev, freePreview: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                />
                <span>Free Preview Lesson</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lessonFormState.required}
                  onChange={(e) =>
                    setLessonFormState((prev) => ({ ...prev, required: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                />
                <span>Required for Course Completion</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLessonModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLessonModal}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {lessonFormState.lessonType === 'VIDEO'
                    ? (lessonModalMode === 'create' ? 'Save Video' : 'Update Video')
                    : lessonFormState.lessonType === 'TEXT'
                    ? (lessonModalMode === 'create' ? 'Save Content' : 'Update Content')
                    : (lessonModalMode === 'create' ? 'Create Lesson' : 'Update Lesson')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminAddCoursePage;
