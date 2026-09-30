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
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  Upload,
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
  Clock,
  X,
} from 'lucide-react';


// Video duration detection and formatting utilities
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
      const newSec = await addCourseSection(activeId!, {
        title: newSectionTitle.trim(),
        description: newSectionDesc.trim(),
      });
      setSections([...sections, { ...newSec, lessons: [] }]);
      setNewSectionTitle('');
      setNewSectionDesc('');
      setIsAddingSection(false);
      if (onShowToast) onShowToast('Section added!');
    } catch {
      if (onShowToast) onShowToast('Failed to add section.');
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
    setEditSectionDesc(sec.description || '');
  };

  const handleSaveEditSection = async () => {
    if (!editingSection || !editSectionTitle.trim()) return;
    try {
      const updated = await updateCourseSection(editingSection.id, {
        title: editSectionTitle.trim(),
        description: editSectionDesc.trim(),
      });
      setSections(
        sections.map((s) => (s.id === editingSection.id ? { ...s, title: updated.title, description: updated.description } : s))
      );
      setEditingSection(null);
      if (onShowToast) onShowToast('Section updated successfully!');
    } catch {
      if (onShowToast) onShowToast('Failed to update section.');
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
        {/* Header & Course Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              3. Curriculum & Content Builder
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize course into modules and lessons (Video, Text, PDF, Quiz, Assignment)
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!savedCourseId) {
                handleSaveDraft();
              }
              setIsAddingSection(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl border border-green-200 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
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
                <h3 className="text-sm font-bold text-white tracking-wide">Course Curriculum Summary</h3>
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

              return (
                <div
                  key={sec.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Module / Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-green-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {secIdx + 1}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-green-800">
                          Module {secIdx + 1}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{sec.title}</h3>
                        {sec.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{sec.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 self-end sm:self-auto">
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

                      {/* Primary Green Action: + Add Video Lesson */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionForVideoLesson(sec);
                          setVideoLessonForm({
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
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>+ Add Video Lesson</span>
                      </button>

                      {/* Secondary: Other Content Types */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionForLesson(sec);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        title="Add PDF, Quiz, Text, or Assignment"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Other Lesson</span>
                      </button>

                      {/* Delete Section */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List in Section */}
                  <div className="space-y-2.5">
                    {!sec.lessons || sec.lessons.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2 bg-white">
                        <p className="font-semibold text-slate-600">No lessons added yet.</p>
                        <p className="text-[11px] text-slate-400">Click below to upload the first video lesson for this module.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionForVideoLesson(sec);
                            setVideoLessonForm({
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
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer mt-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>+ Add Video Lesson</span>
                        </button>
                      </div>
                    ) : (
                      sec.lessons.map((les: any, lesIdx: number) => {
                        const displayDuration = les.duration || (les.durationSeconds ? formatDurationMMSS(les.durationSeconds) : '00:00');

                        return (
                          <div
                            key={les.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 bg-white border border-slate-200 rounded-xl text-xs hover:border-green-300 transition-all shadow-xs gap-3"
                          >
                            {/* Lesson Number, Icon & Title */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-slate-400 font-bold shrink-0 text-xs">
                                Lesson {lesIdx + 1}
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
                                  <Code className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                              )}

                              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900 truncate">
                                  {les.title}
                                </span>
                                {les.freePreview && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 uppercase font-bold shrink-0">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Duration & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              {/* Video Duration */}
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{displayDuration}</span>
                              </div>

                              {/* Ordering & Management Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveLesson(sec.id, lesIdx, 'up')}
                                  disabled={lesIdx === 0}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move Lesson Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMoveLesson(sec.id, lesIdx, 'down')}
                                  disabled={lesIdx === (sec.lessons?.length || 1) - 1}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move Lesson Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLesson(sec.id, les)}
                                  className="p-1.5 text-slate-400 hover:text-green-700 transition-colors cursor-pointer"
                                  title="Edit Lesson"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(sec.id, les.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Module Footer: Total Duration & Add Lesson */}
                  {sec.lessons && sec.lessons.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Total video duration:</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                          {digitalModuleDuration}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({humanModuleDuration})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionForVideoLesson(sec);
                          setVideoLessonForm({
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
                        }}
                        className="inline-flex items-center gap-1.5 text-green-700 hover:text-green-800 font-bold cursor-pointer text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Video Lesson</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Section */}
      {isAddingSection && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Curriculum Module / Section</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Section Title *</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Module 1: Architecture & System Setup"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Module Description</label>
                <input
                  type="text"
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  placeholder="Brief objectives of this module"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      {/* Modal: Dedicated Add Video Lesson */}
      {activeSectionForVideoLesson && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Video Lesson</h3>
                  <p className="text-xs text-slate-500">Module: {activeSectionForVideoLesson.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSectionForVideoLesson(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Lesson Title */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={videoLessonForm.title}
                  onChange={(e) =>
                    setVideoLessonForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Introduction to Deep Learning"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Video Upload Area */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Video *
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-green-400 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
                  <input
                    type="file"
                    id="video-lesson-file-input"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
                    onChange={handleVideoFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="video-lesson-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {videoLessonForm.fileName ? 'Change Selected Video' : 'Upload Video'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supported video formats: MP4 / WebM / MOV
                      </p>
                    </div>
                  </label>
                </div>

                {/* Detected Duration & File Info */}
                {videoLessonForm.fileName && (
                  <div className="mt-3 p-3 bg-green-50/80 border border-green-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Uploaded Video:</span>
                      <span className="font-medium text-slate-900 truncate max-w-[200px]">
                        {videoLessonForm.fileName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-green-200/60">
                      <span className="font-semibold text-green-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-green-600" />
                        Detected Duration:
                      </span>
                      <span className="font-mono font-bold text-green-800 bg-white px-2 py-0.5 rounded border border-green-300">
                        {videoLessonForm.detectedDurationFormatted || (videoLessonForm.uploadStatus === 'detecting' ? 'Detecting...' : '00:00')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {videoLessonForm.uploadStatus === 'uploading' && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Uploading...</span>
                      <span>{videoLessonForm.uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${videoLessonForm.uploadPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {videoLessonForm.errorMessage && (
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {videoLessonForm.errorMessage}
                  </p>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoLessonForm.freePreview}
                    onChange={(e) =>
                      setVideoLessonForm((prev) => ({ ...prev, freePreview: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Mark as Free Preview</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoLessonForm.required}
                    onChange={(e) =>
                      setVideoLessonForm((prev) => ({ ...prev, required: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Required for Completion</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSectionForVideoLesson(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                disabled={videoLessonForm.uploadStatus === 'uploading'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadAndCreateVideoLesson}
                disabled={videoLessonForm.uploadStatus === 'uploading'}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {videoLessonForm.uploadStatus === 'uploading' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading & Creating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Create Lesson</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Other Lesson (Text, PDF, Quiz, Assignment) */}
      {activeSectionForLesson && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Add Lesson to {activeSectionForLesson.title}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Lesson Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Microservices Architecture Documentation"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Lesson Type</label>
                  <select
                    value={lessonForm.lessonType}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="TEXT">TEXT</option>
                    <option value="PDF">PDF / DOCUMENT</option>
                    <option value="QUIZ">QUIZ</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (e.g. 15m)</label>
                  <input
                    type="text"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    placeholder="15m"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>
              </div>

              {/* Content URL */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Content / Document URL</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={lessonForm.contentUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                    placeholder="https://... or upload PDF"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                  />
                  <label className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="application/pdf,video/*"
                      onChange={(e) => handleFileUpload(e, 'lessonVideo')}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadProgress && (
                  <p className="text-[11px] text-green-600 mt-1 animate-pulse">{uploadProgress}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description / Summary</label>
                <textarea
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Key topics covered in this lesson..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonForm.freePreview}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, freePreview: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Mark as Free Preview</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonForm.required}
                    onChange={(e) => setLessonForm({ ...lessonForm, required: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Required for Completion</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSectionForLesson(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLesson}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Save Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Section */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Edit Module / Section</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Section Title *</label>
                <input
                  type="text"
                  value={editSectionTitle}
                  onChange={(e) => setEditSectionTitle(e.target.value)}
                  placeholder="Module title"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Module Description</label>
                <input
                  type="text"
                  value={editSectionDesc}
                  onChange={(e) => setEditSectionDesc(e.target.value)}
                  placeholder="Module description"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

      {/* Modal: Edit Lesson */}
      {editingLesson && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Edit Lesson
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Lesson Title *</label>
                <input
                  type="text"
                  value={editLessonForm.title}
                  onChange={(e) => setEditLessonForm({ ...editLessonForm, title: e.target.value })}
                  placeholder="Lesson title"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Lesson Type</label>
                  <select
                    value={editLessonForm.lessonType}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, lessonType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="TEXT">TEXT</option>
                    <option value="PDF">PDF / DOCUMENT</option>
                    <option value="QUIZ">QUIZ</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (e.g. 15m or 12:34)</label>
                  <input
                    type="text"
                    value={editLessonForm.duration}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, duration: e.target.value })}
                    placeholder="12:34"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>
              </div>

              {/* Video upload / URL */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Content / Video URL (URL or Upload) *</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editLessonForm.contentUrl}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, contentUrl: e.target.value })}
                    placeholder="https://... or upload file"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                  />
                  <label className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 transition shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="video/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'editLessonVideo')}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadProgress && (
                  <p className="text-[11px] text-green-600 mt-1 animate-pulse">{uploadProgress}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description / Summary</label>
                <textarea
                  rows={2}
                  value={editLessonForm.description}
                  onChange={(e) => setEditLessonForm({ ...editLessonForm, description: e.target.value })}
                  placeholder="Key topics covered..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editLessonForm.freePreview}
                    onChange={(e) =>
                      setEditLessonForm({ ...editLessonForm, freePreview: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Mark as Free Preview</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editLessonForm.required}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, required: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                  />
                  <span>Required for Completion</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditLesson}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Update Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAddCoursePage;
