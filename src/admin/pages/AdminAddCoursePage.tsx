"use client";
import React, { useState, useEffect } from 'react';
import { AdminCurriculumBuilder } from '../components/AdminCurriculumBuilder';
import { useSearchParams } from 'next/navigation';
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
  courseId: propCourseId,
  onNavigate,
  onShowToast,
}) => {
  let paramCourseId: string | undefined = undefined;
  try {
    const searchParams = useSearchParams();
    paramCourseId = searchParams?.get('id') || searchParams?.get('courseId') || undefined;
  } catch {}

  const courseId = propCourseId || paramCourseId;
  const isEditing = Boolean(courseId);
  const [loadingCourse, setLoadingCourse] = useState(Boolean(courseId));


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
  const [courseStatus, setCourseStatus] = useState<string>('DRAFT');
  const [isPublishedCourse, setIsPublishedCourse] = useState<boolean>(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (onShowToast) onShowToast(msg);
    setLocalToast({ message: msg, type });
    setTimeout(() => {
      setLocalToast((prev) => (prev?.message === msg ? null : prev));
    }, 4000);
  };

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
      setLoadingCourse(true);
      getAdminCourseById(courseId)
        .then((data) => {
          if (!data) return;
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setIsManualSlug(Boolean(data.slug));
          setShortDescription(data.shortDescription || data.short_description || '');
          setDescription(data.description || '');
          setCategory(data.category || 'Data Science & AI');
          setLevel(data.level || 'Intermediate');
          setLanguage(data.language || 'English');
          setDuration(data.duration || '12 hours');
          setInstructor(data.instructor || 'InGage Lead Instructor');
          setThumbnail(data.thumbnail || '');
          setBanner(data.banner || '');
          const rawPrice = Number(data.price);
          setPrice(isNaN(rawPrice) ? 0 : rawPrice);
          setIsFree(rawPrice === 0);
          const rawDiscType = data.discountType || data.discount_type;
          if (rawDiscType === 'PERCENTAGE' || rawDiscType === 'FIXED_AMOUNT') {
            setDiscountType(rawDiscType);
          } else {
            setDiscountType('PERCENTAGE');
          }
          if (data.discountValue !== undefined || data.discount_value !== undefined) setDiscountValue(Number(data.discountValue ?? data.discount_value ?? 0));
          if (data.status) setCourseStatus(data.status);
          if (data.published !== undefined) setIsPublishedCourse(Boolean(data.published));
          if (Array.isArray(data.sections)) setSections(data.sections);
          setSavedCourseId(courseId);
        })
        .catch((err) => {
          console.error('Failed to load course details', err);
          if (typeof triggerToast === 'function') triggerToast('Failed to load course details.', 'error');
        })
        .finally(() => {
          setLoadingCourse(false);
        });
    } else {
      setLoadingCourse(false);
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
        discountType: !isFree && discountValue > 0 && (discountType === 'PERCENTAGE' || discountType === 'FIXED_AMOUNT') ? discountType : null,
        discountValue: isFree ? 0 : discountValue,
        status: isEditing ? (courseStatus || 'PUBLISHED') : 'DRAFT',
        published: isEditing ? isPublishedCourse : false,
      };

      let result;
      if (savedCourseId) {
        result = await updateAdminCourse(savedCourseId, payload);
      } else {
        result = await createAdminCourse(payload);
        setSavedCourseId(result.id);
      }

      if (typeof triggerToast === 'function') {
        triggerToast(isEditing ? 'Course updated successfully!' : 'Course created successfully!');
      } else if (onShowToast) {
        onShowToast(isEditing ? 'Course updated successfully!' : 'Course created successfully!');
      }

      if (isEditing) {
        setTimeout(() => {
          onNavigate('/admin/courses/ingage');
        }, 800);
      }
    } catch (err: any) {
      console.error('Save course error:', err);
      if (typeof triggerToast === 'function') {
        triggerToast(isEditing ? 'Failed to update course.' : 'Failed to save draft.', 'error');
      } else if (onShowToast) {
        onShowToast('Failed to save course.');
      }
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

  if (loadingCourse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading course data & curriculum...</p>
      </div>
    );
  }

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
              {isEditing ? 'Edit Course' : 'Add Course'}
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 transition-all cursor-pointer shadow-xs disabled:opacity-60"
            title={isEditing ? 'Update course details & pricing' : 'Save draft'}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <Save className="w-4 h-4 text-slate-600" />}
            <span>{saving ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}</span>
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

      
      {/* 3. Curriculum & Content Builder */}
      <AdminCurriculumBuilder
        courseId={savedCourseId || courseId}
        sections={sections}
        setSections={setSections}
        courseInstructor={instructor}
        onShowToast={triggerToast}
        onSaveDraftIfNeeded={async () => {
          await handleSaveDraft();
          return savedCourseId || courseId;
        }}
      />

      {/* Floating Toast Notification */}
      {localToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            localToast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white border border-slate-700'
          }`}
        >
          {localToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          )}
          <span>{localToast.message}</span>
          <button
            onClick={() => setLocalToast(null)}
            className="ml-2 hover:opacity-75 cursor-pointer p-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAddCoursePage;
