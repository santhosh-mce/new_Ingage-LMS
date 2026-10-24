'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  UploadCloud,
  Link as LinkIcon,
  Play,
  Check,
  AlertCircle,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  GripVertical
} from 'lucide-react';

import {
  addCourseSection,
  updateCourseSection,
  deleteCourseSection,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  uploadMediaFile
} from '@/api/adminApi';

import {
  detectVideoDuration,
  formatDurationDigital,
  parseDurationToSeconds,
  extractYouTubeId
} from '@/lib/duration';

export interface ModalVideoItem {
  id: string;
  isNew?: boolean;
  isDeleted?: boolean;
  isModified?: boolean;
  title: string;
  sourceType: 'upload' | 'url';
  contentUrl: string;
  duration: string;
  durationSeconds: number;
  uploadedFileName?: string;
  isUploading?: boolean;
}

export interface VideosTabManagerProps {
  courseId?: number | string | null;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  courseInstructor?: string;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null | undefined>;
}

export function VideosTabManager({
  courseId,
  sections,
  setSections,
  onShowToast,
  onSaveDraftIfNeeded
}: VideosTabManagerProps) {
  const toast = (
    msg: string,
    type: 'success' | 'error' = 'success'
  ) => {
    if (onShowToast) {
      onShowToast(msg, type);
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
  };

  // ============================================================================
  // CREATE / EDIT MODULE MODAL
  // ============================================================================

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [modalModuleTitle, setModalModuleTitle] = useState('');
  const [modalVideos, setModalVideos] = useState<ModalVideoItem[]>([]);
  const [deletedLessonIds, setDeletedLessonIds] = useState<string[]>([]);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [savingStatusText, setSavingStatusText] = useState('');

  const fileInputRefs = useRef<{
    [key: string]: HTMLInputElement | null;
  }>({});

  // ============================================================================
  // DELETE STATES
  // ============================================================================

  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);

  const [deletingVideoInfo, setDeletingVideoInfo] = useState<{
    moduleId: string;
    videoId: string;
    title: string;
  } | null>(null);

  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  // ============================================================================
  // VIDEO PREVIEW
  // ============================================================================

  const [previewVideo, setPreviewVideo] = useState<{
    title: string;
    url: string;
  } | null>(null);

  // ============================================================================
  // ACCORDION
  // ============================================================================

  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]:
        prev[sectionId] === undefined ? false : !prev[sectionId]
    }));
  };

  // ============================================================================
  // DRAG AND DROP REORDERING STATES & HANDLERS
  // ============================================================================

  // Module drag and drop
  const [draggedModuleIndex, setDraggedModuleIndex] = useState<number | null>(null);
  const [dragOverModuleIndex, setDragOverModuleIndex] = useState<number | null>(null);

  // Video drag and drop (within same module & across modules)
  const [draggedVideoInfo, setDraggedVideoInfo] = useState<{
    sectionId: string | number;
    videoIndex: number;
    videoId: string | number;
    title: string;
  } | null>(null);

  const [dragOverVideoInfo, setDragOverVideoInfo] = useState<{
    sectionId: string | number;
    videoIndex: number;
  } | null>(null);

  const [dragOverSectionId, setDragOverSectionId] = useState<string | number | null>(null);

  // Modal video details drag and drop
  const [draggedModalVideoIndex, setDraggedModalVideoIndex] = useState<number | null>(null);
  const [dragOverModalVideoIndex, setDragOverModalVideoIndex] = useState<number | null>(null);

  // Module Drag Handlers
  const handleModuleDragStart = (e: React.DragEvent, sectionIndex: number) => {
    e.stopPropagation();
    setDraggedModuleIndex(sectionIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(sectionIndex));
  };

  const handleModuleDragOver = (e: React.DragEvent, sectionIndex: number) => {
    if (draggedModuleIndex !== null) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverModuleIndex !== sectionIndex) {
        setDragOverModuleIndex(sectionIndex);
      }
    }
  };

  const handleModuleDragLeave = (e: React.DragEvent, sectionIndex: number) => {
    if (dragOverModuleIndex === sectionIndex) {
      setDragOverModuleIndex(null);
    }
  };

  const handleModuleDrop = async (e: React.DragEvent, targetSectionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedModuleIndex === null || draggedModuleIndex === targetSectionIndex) {
      setDraggedModuleIndex(null);
      setDragOverModuleIndex(null);
      return;
    }

    const sourceSection = videoModules[draggedModuleIndex];
    const targetSection = videoModules[targetSectionIndex];
    if (!sourceSection || !targetSection) {
      setDraggedModuleIndex(null);
      setDragOverModuleIndex(null);
      return;
    }

    const newSections = [...sections];
    const fromIndex = newSections.findIndex(s => s.id === sourceSection.id);
    const toIndex = newSections.findIndex(s => s.id === targetSection.id);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedModuleIndex(null);
      setDragOverModuleIndex(null);
      return;
    }

    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);

    const reorderedSections = newSections.map((sec, idx) => ({
      ...sec,
      displayOrder: idx + 1,
      display_order: idx + 1,
    }));

    setSections(reorderedSections);
    setDraggedModuleIndex(null);
    setDragOverModuleIndex(null);

    toast(`Module "${moved.title || 'Module'}" reordered to MODULE ${targetSectionIndex + 1}!`, 'success');

    // Persist new section order in backend
    try {
      for (let i = 0; i < reorderedSections.length; i++) {
        const s = reorderedSections[i];
        if (s.id && (typeof s.id === 'number' || (typeof s.id === 'string' && !s.id.startsWith('temp_')))) {
          await updateCourseSection(s.id, {
            displayOrder: i + 1,
            display_order: i + 1,
          });
        }
      }
    } catch (err) {
      console.error('Failed to persist module reordering:', err);
    }
  };

  const handleModuleDragEnd = () => {
    setDraggedModuleIndex(null);
    setDragOverModuleIndex(null);
  };

  // Video Drag Handlers
  const handleVideoDragStart = (
    e: React.DragEvent,
    sectionId: string | number,
    videoIndex: number,
    video: any
  ) => {
    e.stopPropagation();
    const info = {
      sectionId,
      videoIndex,
      videoId: video.id,
      title: video.title || 'Video'
    };
    setDraggedVideoInfo(info);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(info));
  };

  const handleVideoDragOver = (
    e: React.DragEvent,
    sectionId: string | number,
    videoIndex: number
  ) => {
    if (draggedVideoInfo) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDragOverVideoInfo({ sectionId, videoIndex });
      setDragOverSectionId(sectionId);
    }
  };

  const handleSectionDragOverForVideos = (
    e: React.DragEvent,
    sectionId: string | number
  ) => {
    if (draggedVideoInfo) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDragOverSectionId(sectionId);
    }
  };

  const handleVideoDrop = async (
    e: React.DragEvent,
    targetSectionId: string | number,
    targetVideoIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedVideoInfo) return;

    const { sectionId: sourceSectionId, videoIndex: sourceVideoIndex, videoId } = draggedVideoInfo;

    // Reset drag indicators
    setDraggedVideoInfo(null);
    setDragOverVideoInfo(null);
    setDragOverSectionId(null);

    // Same position -> no op
    if (sourceSectionId === targetSectionId && sourceVideoIndex === targetVideoIndex) {
      return;
    }

    let movedVideoTitle = '';

    setSections(prevSections => {
      const newSections = prevSections.map(sec => {
        const rawLessons = [...(sec.lessons || sec.course_lessons || [])];
        return {
          ...sec,
          lessons: rawLessons,
          course_lessons: rawLessons
        };
      });

      const srcSec = newSections.find(s => s.id === sourceSectionId);
      const tgtSec = newSections.find(s => s.id === targetSectionId);

      if (!srcSec || !tgtSec) return prevSections;

      const srcVideos = srcSec.lessons.filter((l: any) => {
        const type = (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase();
        const url = l.contentUrl || l.content_url;
        return type === 'VIDEO' && !!url;
      });

      const videoToMove = srcVideos[sourceVideoIndex];
      if (!videoToMove) return prevSections;

      movedVideoTitle = videoToMove.title || 'Video';

      const srcFullIndex = srcSec.lessons.findIndex((l: any) => l.id === videoToMove.id);
      if (srcFullIndex === -1) return prevSections;

      srcSec.lessons.splice(srcFullIndex, 1);
      srcSec.course_lessons = srcSec.lessons;

      if (sourceSectionId === targetSectionId) {
        const remainingVideos = srcSec.lessons.filter((l: any) => {
          const type = (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase();
          const url = l.contentUrl || l.content_url;
          return type === 'VIDEO' && !!url;
        });

        let targetFullIndex = srcSec.lessons.length;
        if (targetVideoIndex < remainingVideos.length) {
          const targetVideo = remainingVideos[targetVideoIndex];
          targetFullIndex = srcSec.lessons.findIndex((l: any) => l.id === targetVideo.id);
        }

        srcSec.lessons.splice(targetFullIndex, 0, videoToMove);
        srcSec.course_lessons = srcSec.lessons;
      } else {
        const tgtVideos = tgtSec.lessons.filter((l: any) => {
          const type = (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase();
          const url = l.contentUrl || l.content_url;
          return type === 'VIDEO' && !!url;
        });

        let targetFullIndex = tgtSec.lessons.length;
        if (targetVideoIndex < tgtVideos.length) {
          const targetVideo = tgtVideos[targetVideoIndex];
          targetFullIndex = tgtSec.lessons.findIndex((l: any) => l.id === targetVideo.id);
        }

        const updatedMovedVideo = {
          ...videoToMove,
          sectionId: targetSectionId,
          section_id: targetSectionId
        };

        tgtSec.lessons.splice(targetFullIndex, 0, updatedMovedVideo);
        tgtSec.course_lessons = tgtSec.lessons;
      }

      srcSec.lessons.forEach((l: any, i: number) => {
        l.displayOrder = i + 1;
        l.display_order = i + 1;
      });
      tgtSec.lessons.forEach((l: any, i: number) => {
        l.displayOrder = i + 1;
        l.display_order = i + 1;
      });

      return newSections;
    });

    const isSameModule = sourceSectionId === targetSectionId;
    toast(
      isSameModule
        ? `Reordered "${movedVideoTitle}" to position ${targetVideoIndex + 1}!`
        : `Moved "${movedVideoTitle}" to new module!`,
      'success'
    );

    try {
      if (videoId && (typeof videoId === 'number' || (typeof videoId === 'string' && !videoId.startsWith('temp_')))) {
        await updateCourseLesson(videoId, {
          sectionId: targetSectionId,
          section_id: targetSectionId,
          displayOrder: targetVideoIndex + 1,
          display_order: targetVideoIndex + 1,
        });
      }
    } catch (err) {
      console.error('Failed to update lesson order in server:', err);
    }
  };

  const handleVideoDragEnd = () => {
    setDraggedVideoInfo(null);
    setDragOverVideoInfo(null);
    setDragOverSectionId(null);
  };

  // Modal Video Reordering Handlers
  const handleModalVideoDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedModalVideoIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleModalVideoDragOver = (e: React.DragEvent, index: number) => {
    if (draggedModalVideoIndex !== null) {
      e.preventDefault();
      e.stopPropagation();
      setDragOverModalVideoIndex(index);
    }
  };

  const handleModalVideoDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedModalVideoIndex === null || draggedModalVideoIndex === targetIndex) {
      setDraggedModalVideoIndex(null);
      setDragOverModalVideoIndex(null);
      return;
    }

    setModalVideos(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedModalVideoIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((v) => ({ ...v, isModified: true }));
    });

    setDraggedModalVideoIndex(null);
    setDragOverModalVideoIndex(null);
    toast('Video sequence updated!', 'success');
  };

  const handleModalVideoDragEnd = () => {
    setDraggedModalVideoIndex(null);
    setDragOverModalVideoIndex(null);
  };


  // ============================================================================
  // PREVENT BACKGROUND SCROLL
  // ============================================================================

  useEffect(() => {
    if (
      isModuleModalOpen ||
      deletingModuleId ||
      deletingVideoInfo ||
      previewVideo
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    isModuleModalOpen,
    deletingModuleId,
    deletingVideoInfo,
    previewVideo
  ]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getSectionVideos = (section: any) => {
    const rawLessons =
      section.lessons || section.course_lessons || [];

    return rawLessons.filter(
      (lesson: any) => {
        const type = (
          lesson.lessonType ||
          lesson.lesson_type ||
          'VIDEO'
        ).toUpperCase();
        const url = lesson.contentUrl || lesson.content_url;
        return type === 'VIDEO' && !!url && String(url).trim().length > 0;
      }
    );
  };

  const videoModules = sections.filter((section: any) => {
    const videoLessons = getSectionVideos(section);
    return videoLessons.length > 0;
  });

  const getSectionTotalDurationText = (videos: any[]) => {
    const totalSec = videos.reduce(
      (acc: number, video: any) => {
        const sec =
          video.durationSeconds ||
          video.duration_seconds ||
          parseDurationToSeconds(video.duration) ||
          0;

        return acc + sec;
      },
      0
    );

    const mins = Math.round(totalSec / 60);

    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;

      return remMins > 0
        ? `${hrs} hr ${remMins} min`
        : `${hrs} hr`;
    }

    return `${mins} min`;
  };

  // ============================================================================
  // CREATE MODULE
  // ============================================================================

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingSectionId(null);
    setModalModuleTitle('');
    setDeletedLessonIds([]);

    const firstVideoId = `new_${Date.now()}`;

    setModalVideos([
      {
        id: firstVideoId,
        isNew: true,
        title: '',
        sourceType: 'upload',
        contentUrl: '',
        duration: '',
        durationSeconds: 0,
        uploadedFileName: '',
        isUploading: false,
        isModified: true
      }
    ]);

    setIsSavingModule(false);
    setSavingStatusText('');
    setIsModuleModalOpen(true);
  };

  // ============================================================================
  // EDIT MODULE
  // ============================================================================

  const handleOpenEditModal = (section: any) => {
    setModalMode('edit');
    setEditingSectionId(section.id);
    setModalModuleTitle(section.title || '');
    setDeletedLessonIds([]);

    const currentVideos = getSectionVideos(section);

    if (currentVideos.length > 0) {
      const items: ModalVideoItem[] = currentVideos.map(
        (video: any) => {
          const url =
            video.contentUrl ||
            video.content_url ||
            '';

          const durSec =
            video.durationSeconds ||
            video.duration_seconds ||
            parseDurationToSeconds(video.duration) ||
            0;

          const durStr =
            video.duration ||
            (durSec > 0
              ? formatDurationDigital(durSec)
              : '');

          const isYoutube =
            url.includes('youtube.com') ||
            url.includes('youtu.be');

          return {
            id: video.id,
            isNew: false,
            isModified: false,
            title: video.title || '',
            sourceType: isYoutube ? 'url' : 'upload',
            contentUrl: url,
            duration: durStr,
            durationSeconds: durSec,
            uploadedFileName:
              url && !isYoutube
                ? url.split('/').pop() || ''
                : '',
            isUploading: false
          };
        }
      );

      setModalVideos(items);
    } else {
      const initialId = `new_${Date.now()}`;

      setModalVideos([
        {
          id: initialId,
          isNew: true,
          title: '',
          sourceType: 'upload',
          contentUrl: '',
          duration: '',
          durationSeconds: 0,
          uploadedFileName: '',
          isUploading: false,
          isModified: true
        }
      ]);
    }

    setIsSavingModule(false);
    setSavingStatusText('');
    setIsModuleModalOpen(true);
  };

  // ============================================================================
  // ADD VIDEO TO MODULE MODAL
  // ============================================================================

  const handleAddVideoToModal = () => {
    const nextIdx = modalVideos.length + 1;

    const newId =
      `new_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}`;

    const newVideo: ModalVideoItem = {
      id: newId,
      isNew: true,
      title: `Lesson ${nextIdx}: `,
      sourceType: 'upload',
      contentUrl: '',
      duration: '',
      durationSeconds: 0,
      uploadedFileName: '',
      isUploading: false,
      isModified: true
    };

    setModalVideos(prev => [...prev, newVideo]);
  };

  // ============================================================================
  // REMOVE VIDEO FROM MODAL
  // ============================================================================

  const handleRemoveVideoFromModal = (id: string) => {
    if (
      modalVideos.length === 1 &&
      modalMode === 'create'
    ) {
      setModalVideos([
        {
          id: `new_${Date.now()}`,
          isNew: true,
          title: '',
          sourceType: 'upload',
          contentUrl: '',
          duration: '',
          durationSeconds: 0,
          uploadedFileName: '',
          isUploading: false,
          isModified: true
        }
      ]);

      return;
    }

    const item = modalVideos.find(
      video => video.id === id
    );

    if (item && !item.isNew) {
      setDeletedLessonIds(prev => [
        ...prev,
        id
      ]);
    }

    setModalVideos(prev =>
      prev.filter(video => video.id !== id)
    );
  };

  // ============================================================================
  // UPDATE MODAL VIDEO
  // ============================================================================

  const handleUpdateModalVideo = (
    id: string,
    updates: Partial<ModalVideoItem>
  ) => {
    setModalVideos(prev =>
      prev.map(video =>
        video.id === id
          ? {
            ...video,
            ...updates,
            isModified: true
          }
          : video
      )
    );
  };

  // ============================================================================
  // UPLOAD VIDEO INSIDE MODULE MODAL
  // ============================================================================

  const handleModalVideoFileUpload = async (
    id: string,
    file: File
  ) => {
    if (!file) return;

    setModalVideos(prev =>
      prev.map(video =>
        video.id === id
          ? {
            ...video,
            isUploading: true,
            uploadedFileName: file.name
          }
          : video
      )
    );

    try {
      let detectedSec = 0;
      let durationStr = '00:00';

      try {
        detectedSec =
          await detectVideoDuration(file);

        durationStr =
          formatDurationDigital(detectedSec);
      } catch (durationError) {
        console.warn(
          'Could not auto-detect duration:',
          durationError
        );
      }

      const targetItem =
        modalVideos.find(
          video => video.id === id
        );

      let suggestedTitle =
        targetItem?.title || '';

      if (!suggestedTitle.trim()) {
        suggestedTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ');
      }

      const response =
        await uploadMediaFile(
          file,
          'video'
        );

      const uploadedUrl =
        response.url ||
        response.fileUrl ||
        response.path ||
        '';

      setModalVideos(prev =>
        prev.map(video =>
          video.id === id
            ? {
              ...video,
              title: suggestedTitle,
              sourceType: 'upload',
              contentUrl: uploadedUrl,
              duration:
                durationStr !== '00:00'
                  ? durationStr
                  : video.duration,
              durationSeconds:
                detectedSec > 0
                  ? detectedSec
                  : video.durationSeconds,
              uploadedFileName:
                file.name,
              isUploading: false,
              isModified: true
            }
            : video
        )
      );

      toast(
        'Video uploaded and duration detected!',
        'success'
      );
    } catch (error: any) {
      console.error(
        'File upload failed:',
        error
      );

      toast(
        error.message ||
        'Failed to upload video file',
        'error'
      );

      setModalVideos(prev =>
        prev.map(video =>
          video.id === id
            ? {
              ...video,
              isUploading: false
            }
            : video
        )
      );
    }
  };

  // ============================================================================
  // SAVE MODULE
  // ============================================================================

  const handleSaveModuleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!modalModuleTitle.trim()) {
      toast(
        'Module title is required.',
        'error'
      );
      return;
    }

    if (modalVideos.length === 0) {
      toast(
        'Please add at least one video to this module.',
        'error'
      );
      return;
    }

    for (
      let i = 0;
      i < modalVideos.length;
      i++
    ) {
      const video = modalVideos[i];

      if (!video.title.trim()) {
        toast(
          `Video #${i + 1} title is required.`,
          'error'
        );
        return;
      }

      if (!video.contentUrl.trim()) {
        toast(
          `Please upload a video file or provide a video URL for "${video.title ||
          `Video ${i + 1}`}".`,
          'error'
        );
        return;
      }
    }

    setIsSavingModule(true);

    try {
      // ========================================================================
      // CREATE
      // ========================================================================

      if (modalMode === 'create') {
        setSavingStatusText(
          'Preparing Course Draft...'
        );

        let effectiveCourseId = courseId;

        if (
          !effectiveCourseId &&
          onSaveDraftIfNeeded
        ) {
          effectiveCourseId =
            await onSaveDraftIfNeeded();
        }

        if (!effectiveCourseId) {
          toast(
            'Course ID is missing. Please save course first.',
            'error'
          );

          setIsSavingModule(false);
          return;
        }

        setSavingStatusText(
          'Creating Module...'
        );

        const nextOrder =
          sections.length + 1;

        const sectionResponse =
          await addCourseSection(
            String(effectiveCourseId),
            {
              title:
                modalModuleTitle.trim(),
              displayOrder: nextOrder,
              display_order: nextOrder
            }
          );

        const createdSection =
          sectionResponse.section ||
          sectionResponse.data ||
          sectionResponse;

        const sectionId =
          createdSection.id;

        if (!sectionId) {
          throw new Error(
            'Failed to retrieve newly created module ID.'
          );
        }

        const createdLessons: any[] = [];

        for (
          let i = 0;
          i < modalVideos.length;
          i++
        ) {
          const video =
            modalVideos[i];

          setSavingStatusText(
            `Adding Video ${i + 1} of ${modalVideos.length}...`
          );

          const durationSeconds =
            video.durationSeconds ||
            parseDurationToSeconds(
              video.duration
            ) ||
            0;

          const lessonPayload = {
            title:
              video.title.trim(),

            lessonType: 'VIDEO',
            lesson_type: 'VIDEO',

            contentUrl:
              video.contentUrl.trim(),

            content_url:
              video.contentUrl.trim(),

            duration:
              video.duration || '00:00',

            durationSeconds,
            duration_seconds:
              durationSeconds,

            freePreview: false,
            required: true,

            displayOrder: i + 1,
            display_order: i + 1
          };

          const lessonResponse =
            await addCourseLesson(
              sectionId,
              lessonPayload
            );

          const newLesson =
            lessonResponse.lesson ||
            lessonResponse.data ||
            lessonResponse;

          createdLessons.push(
            newLesson
          );
        }

        const finalSection = {
          ...createdSection,
          title:
            modalModuleTitle.trim(),
          lessons: createdLessons,
          course_lessons:
            createdLessons
        };

        setSections(prev => [
          ...prev,
          finalSection
        ]);

        setIsModuleModalOpen(false);

        toast(
          `Module "${modalModuleTitle.trim()}" created with ${createdLessons.length} video(s)!`,
          'success'
        );
      }

      // ========================================================================
      // EDIT
      // ========================================================================

      else {
        if (!editingSectionId) return;

        setSavingStatusText(
          'Updating Module Title...'
        );

        const originalSection =
          sections.find(
            section =>
              section.id ===
              editingSectionId
          );

        let updatedTitle =
          originalSection?.title ||
          modalModuleTitle.trim();

        if (
          modalModuleTitle.trim() !==
          originalSection?.title
        ) {
          await updateCourseSection(
            editingSectionId,
            {
              title:
                modalModuleTitle.trim()
            }
          );

          updatedTitle =
            modalModuleTitle.trim();
        }

        // Delete removed lessons
        for (
          const deleteId of deletedLessonIds
        ) {
          try {
            await deleteCourseLesson(
              deleteId
            );
          } catch (deleteError) {
            console.warn(
              'Failed to delete lesson ID:',
              deleteId,
              deleteError
            );
          }
        }

        const updatedLessonsList: any[] =
          [];

        for (
          let i = 0;
          i < modalVideos.length;
          i++
        ) {
          const video =
            modalVideos[i];

          const displayOrder =
            i + 1;

          const durationSeconds =
            video.durationSeconds ||
            parseDurationToSeconds(
              video.duration
            ) ||
            0;

          // New video
          if (video.isNew) {
            setSavingStatusText(
              `Adding new video "${video.title}"...`
            );

            const payload = {
              title:
                video.title.trim(),

              lessonType: 'VIDEO',
              lesson_type: 'VIDEO',

              contentUrl:
                video.contentUrl.trim(),

              content_url:
                video.contentUrl.trim(),

              duration:
                video.duration || '00:00',

              durationSeconds,
              duration_seconds:
                durationSeconds,

              freePreview: false,
              required: true,

              displayOrder,
              display_order:
                displayOrder
            };

            const response =
              await addCourseLesson(
                editingSectionId,
                payload
              );

            const created =
              response.lesson ||
              response.data ||
              response;

            updatedLessonsList.push(
              created
            );
          }

          // Modified video
          else if (video.isModified) {
            setSavingStatusText(
              `Updating video "${video.title}"...`
            );

            const payload = {
              title:
                video.title.trim(),

              contentUrl:
                video.contentUrl.trim(),

              content_url:
                video.contentUrl.trim(),

              duration:
                video.duration || '00:00',

              durationSeconds,
              duration_seconds:
                durationSeconds,

              displayOrder,
              display_order:
                displayOrder
            };

            const response =
              await updateCourseLesson(
                video.id,
                payload
              );

            const saved =
              response.lesson ||
              response.data || {
                id: video.id,
                ...payload
              };

            updatedLessonsList.push(
              saved
            );
          }

          // Existing unchanged video
          else {
            const existingRaw =
              (
                originalSection?.lessons ||
                originalSection?.course_lessons ||
                []
              ).find(
                (lesson: any) =>
                  lesson.id ===
                  video.id
              );

            updatedLessonsList.push(
              existingRaw || {
                id: video.id,
                title: video.title,
                contentUrl:
                  video.contentUrl,
                content_url:
                  video.contentUrl,
                duration:
                  video.duration,
                durationSeconds:
                  video.durationSeconds
              }
            );
          }
        }

        setSections(prev =>
          prev.map(section => {
            if (
              section.id ===
              editingSectionId
            ) {
              return {
                ...section,
                title: updatedTitle,
                lessons:
                  updatedLessonsList,
                course_lessons:
                  updatedLessonsList
              };
            }

            return section;
          })
        );

        setIsModuleModalOpen(false);

        toast(
          `Module "${updatedTitle}" updated successfully!`,
          'success'
        );
      }
    } catch (error: any) {
      console.error(
        'Error saving module:',
        error
      );

      toast(
        error.message ||
        'Failed to save module.',
        'error'
      );
    } finally {
      setIsSavingModule(false);
      setSavingStatusText('');
    }
  };

  // ============================================================================
  // DELETE MODULE
  // ============================================================================

  const handleDeleteModuleConfirm =
    async () => {
      if (!deletingModuleId) return;

      setIsDeletingModule(true);

      try {
        await deleteCourseSection(
          deletingModuleId
        );

        setSections(prev =>
          prev.filter(
            section =>
              section.id !==
              deletingModuleId
          )
        );

        toast(
          'Module deleted successfully.',
          'success'
        );

        setDeletingModuleId(null);
      } catch (error: any) {
        console.error(
          'Failed to delete module:',
          error
        );

        toast(
          error.message ||
          'Failed to delete module.',
          'error'
        );
      } finally {
        setIsDeletingModule(false);
      }
    };

  // ============================================================================
  // DELETE VIDEO
  // ============================================================================

  const handleDeleteVideoConfirm =
    async () => {
      if (!deletingVideoInfo) return;

      setIsDeletingVideo(true);

      try {
        await deleteCourseLesson(
          deletingVideoInfo.videoId
        );

        setSections(prev =>
          prev.map(section => {
            if (
              section.id ===
              deletingVideoInfo.moduleId
            ) {
              const currentLessons =
                section.lessons ||
                section.course_lessons ||
                [];

              const updated =
                currentLessons.filter(
                  (lesson: any) =>
                    lesson.id !==
                    deletingVideoInfo.videoId
                );

              return {
                ...section,
                lessons: updated,
                course_lessons: updated
              };
            }

            return section;
          })
        );

        toast(
          'Video deleted successfully.',
          'success'
        );

        setDeletingVideoInfo(null);
      } catch (error: any) {
        console.error(
          'Failed to delete video:',
          error
        );

        toast(
          error.message ||
          'Failed to delete video.',
          'error'
        );
      } finally {
        setIsDeletingVideo(false);
      }
    };

  // ============================================================================
  // VIDEO PREVIEW
  // ============================================================================

  const renderPreviewPlayer = (
    url: string
  ) => {
    const youtubeId =
      extractYouTubeId(url);

    if (youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full h-full rounded-lg object-contain bg-black"
      />
    );
  };

  // ============================================================================
  // UI
  // ============================================================================

  return (
    <div className="space-y-6">

      {/* ======================================================================
          TOP ACTION BAR
      ====================================================================== */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-600" />
            Video Curriculum Modules
          </h2>

          <p className="text-xs text-slate-500 mt-0.5">
            Organize video lessons into structured modules with automatic duration detection.
          </p>

          <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200/70 shadow-2xs">
            <GripVertical className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Drag & drop modules (⋮⋮) or videos to reorder them</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create Module
        </button>
      </div>

      {/* ======================================================================
          EMPTY STATE
      ====================================================================== */}

      {videoModules.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Video className="w-7 h-7 text-slate-500" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">
            No video modules yet
          </h3>

          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Get started by creating your first module. Add multiple videos and auto-detect duration in one seamless popup.
          </p>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Create First Module
          </button>
        </div>
      ) : (

        /* ====================================================================
           MODULE LIST (Filtered Video Modules Only)
        ==================================================================== */

        <div className="space-y-4">
          {videoModules.map((section, sectionIndex) => {
            const videos = getSectionVideos(section);
            const isCollapsed = expandedSections[section.id] === true;
            const totalDurationText = getSectionTotalDurationText(videos);

            return (
              <div
                key={section.id || sectionIndex}
                onDragOver={(e) => {
                  if (draggedModuleIndex !== null) {
                    handleModuleDragOver(e, sectionIndex);
                  } else if (draggedVideoInfo) {
                    handleSectionDragOverForVideos(e, section.id);
                  }
                }}
                onDragLeave={(e) => {
                  if (draggedModuleIndex !== null) {
                    handleModuleDragLeave(e, sectionIndex);
                  } else if (draggedVideoInfo && dragOverSectionId === section.id) {
                    setDragOverSectionId(null);
                  }
                }}
                onDrop={(e) => {
                  if (draggedModuleIndex !== null) {
                    handleModuleDrop(e, sectionIndex);
                  } else if (draggedVideoInfo) {
                    handleVideoDrop(e, section.id, videos.length);
                  }
                }}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden transition-all ${
                  draggedModuleIndex === sectionIndex
                    ? 'opacity-40 border-dashed border-emerald-500 scale-[0.99]'
                    : dragOverModuleIndex === sectionIndex && draggedModuleIndex !== null
                    ? 'border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/20'
                    : dragOverSectionId === section.id && draggedVideoInfo !== null
                    ? 'border-emerald-500 ring-2 ring-emerald-300/40 bg-emerald-50/10'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* MODULE HEADER */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-white">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                    {/* MODULE DRAG HANDLE */}
                    <div
                      draggable
                      onDragStart={(e) => handleModuleDragStart(e, sectionIndex)}
                      onDragEnd={handleModuleDragEnd}
                      className="p-1.5 -ml-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing transition shrink-0"
                      title="Drag to reorder module"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      className="flex flex-col items-center justify-center pt-0.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                      onClick={() => toggleSection(section.id)}
                    >
                      <ChevronUp className="w-3.5 h-3.5 -mb-1" />
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                          MODULE {sectionIndex + 1}
                        </span>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                          {section.title || 'Untitled Module'}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {videos.length}{' '}
                        {videos.length === 1 ? 'Video' : 'Videos'}{' '}
                        •{' '}
                        {totalDurationText}
                      </p>
                    </div>
                  </div>

                  {/* HEADER ACTIONS */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(section)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Edit Module"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingModuleId(section.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* VIDEOS */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 bg-slate-50/40">
                    <div className="space-y-3">
                      {videos.map((video: any, videoIndex: number) => {
                        const url =
                          video.contentUrl ||
                          video.content_url ||
                          '';

                        const durationSeconds =
                          video.durationSeconds ||
                          video.duration_seconds ||
                          parseDurationToSeconds(video.duration) ||
                          0;

                        const durationText =
                          video.duration ||
                          formatDurationDigital(durationSeconds);

                        return (
                          <div
                            key={video.id || videoIndex}
                            onDragOver={(e) => handleVideoDragOver(e, section.id, videoIndex)}
                            onDrop={(e) => handleVideoDrop(e, section.id, videoIndex)}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3.5 bg-white rounded-xl border shadow-2xs transition-all ${
                              draggedVideoInfo?.videoId === video.id
                                ? 'opacity-30 border-dashed border-emerald-400'
                                : dragOverVideoInfo?.sectionId === section.id && dragOverVideoInfo?.videoIndex === videoIndex
                                ? 'border-t-2 border-t-emerald-500 border-slate-300 bg-emerald-50/20 shadow-sm'
                                : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                              {/* VIDEO DRAG HANDLE */}
                              <div
                                draggable
                                onDragStart={(e) => handleVideoDragStart(e, section.id, videoIndex, video)}
                                onDragEnd={handleVideoDragEnd}
                                className="p-1 -ml-1 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-grab active:cursor-grabbing transition shrink-0"
                                title="Drag to reorder video"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <span className="text-xs font-semibold text-slate-400 w-4 text-center shrink-0">
                                {videoIndex + 1}
                              </span>

                              <div
                                onClick={() =>
                                  url &&
                                  setPreviewVideo({
                                    title: video.title || 'Video',
                                    url
                                  })
                                }
                                className="w-9 h-9 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 cursor-pointer transition shadow-2xs"
                                title="Play / Preview Video"
                              >
                                <Play className="w-3.5 h-3.5 fill-emerald-700 ml-0.5" />
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {video.title || 'Untitled Video'}
                                </h4>

                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {durationText || '00:00'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingVideoInfo({
                                    moduleId: section.id,
                                    videoId: video.id,
                                    title: video.title || 'this video'
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================================
          CREATE / EDIT MODULE MODAL (MATCHING EXACT SCREENSHOT)
      ====================================================================== */}

      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">

            {/* HEADER */}
            <div className="p-6 pb-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {modalMode === 'create' ? 'Create Module' : 'Edit Module'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  !isSavingModule &&
                  setIsModuleModalOpen(false)
                }
                disabled={isSavingModule}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY FORM */}
            <form
              onSubmit={handleSaveModuleSubmit}
              className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6"
            >
              {/* MODULE TITLE ROW */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Module Title <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={modalModuleTitle}
                    onChange={event =>
                      setModalModuleTitle(event.target.value)
                    }
                    placeholder="Introduction to React"
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-2xs"
                    required
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={handleAddVideoToModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-xs whitespace-nowrap active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Add Video
                  </button>
                </div>
              </div>

              {/* VIDEO DETAILS CARDS */}
              <div className="space-y-5">
                {modalVideos.map((video, index) => (
                  <div
                    key={video.id}
                    onDragOver={(e) => handleModalVideoDragOver(e, index)}
                    onDrop={(e) => handleModalVideoDrop(e, index)}
                    className={`bg-slate-50/50 border rounded-2xl p-6 space-y-5 relative shadow-2xs transition-all ${
                      draggedModalVideoIndex === index
                        ? 'opacity-30 border-dashed border-emerald-400'
                        : dragOverModalVideoIndex === index
                        ? 'border-t-2 border-t-emerald-500 bg-emerald-50/30'
                        : 'border-slate-200/90'
                    }`}
                  >
                    {/* VIDEO CARD HEADER */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {modalVideos.length > 1 && (
                          <div
                            draggable
                            onDragStart={(e) => handleModalVideoDragStart(e, index)}
                            onDragEnd={handleModalVideoDragEnd}
                            className="p-1 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md cursor-grab active:cursor-grabbing transition"
                            title="Drag to reorder video details"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>
                        <span className="text-base font-bold text-slate-900">
                          {modalVideos.length > 1 ? `Video Details #${index + 1}` : 'Video Details'}
                        </span>
                      </div>

                      {modalVideos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVideoFromModal(video.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remove this video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* TITLE + SOURCE SELECTOR */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                      {/* Video Title */}
                      <div className="lg:col-span-6">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Video Title <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={video.title}
                          onChange={event =>
                            handleUpdateModalVideo(video.id, {
                              title: event.target.value
                            })
                          }
                          placeholder={`Lesson ${index + 1}: Introduction`}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-2xs"
                          required
                        />
                      </div>

                      {/* Video Source Buttons */}
                      <div className="lg:col-span-6">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Video Source <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateModalVideo(video.id, {
                                sourceType: 'upload'
                              })
                            }
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                              video.sourceType === 'upload'
                                ? 'bg-emerald-50/70 border border-emerald-400 text-emerald-700 shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <UploadCloud className="w-4 h-4 text-emerald-600" />
                            <span>Upload Video File</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateModalVideo(video.id, {
                                sourceType: 'url'
                              })
                            }
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                              video.sourceType === 'url'
                                ? 'bg-emerald-50/70 border border-emerald-400 text-emerald-700 shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <LinkIcon className="w-4 h-4 text-slate-400" />
                            <span>Video URL / YouTube</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* UPLOAD DROPZONE / URL INPUT + DURATION */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Left: Upload Box or URL input */}
                      <div className="md:col-span-8 lg:col-span-9">
                        {video.sourceType === 'upload' ? (
                          <div>
                            <input
                              ref={element => {
                                fileInputRefs.current[video.id] = element;
                              }}
                              type="file"
                              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.mov,.webm,.mkv"
                              onChange={event => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  handleModalVideoFileUpload(video.id, file);
                                }
                              }}
                              className="hidden"
                            />

                            <div
                              onClick={() =>
                                !video.isUploading &&
                                fileInputRefs.current[video.id]?.click()
                              }
                              className={`border-2 border-dashed rounded-2xl py-5 px-6 text-center cursor-pointer transition flex items-center justify-center gap-4 bg-white ${
                                video.uploadedFileName
                                  ? 'border-emerald-400 bg-emerald-50/30'
                                  : 'border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50/10'
                              }`}
                            >
                              {video.isUploading ? (
                                <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-emerald-700">
                                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                  <span>Uploading & detecting duration...</span>
                                </div>
                              ) : video.uploadedFileName ? (
                                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-md">
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </div>
                                  <span className="truncate">{video.uploadedFileName}</span>
                                  <span className="text-xs text-slate-400 font-normal ml-1 shrink-0">(Click to replace)</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-3.5">
                                  <UploadCloud className="w-9 h-9 text-emerald-600 shrink-0" />
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-slate-800">Click to upload video file</p>
                                    <p className="text-xs text-slate-400 mt-0.5">MP4, WebM, MOV (Max 500MB)</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <input
                            type="url"
                            value={video.contentUrl}
                            onChange={event =>
                              handleUpdateModalVideo(video.id, {
                                contentUrl: event.target.value
                              })
                            }
                            placeholder="Paste video URL / YouTube link"
                            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-2xs"
                            required={video.sourceType === 'url'}
                          />
                        )}
                      </div>

                      {/* Right: Duration Field with Clock Icon */}
                      <div className="md:col-span-4 lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Duration
                        </label>

                        <div className="flex items-center gap-2 px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition shadow-2xs">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={video.duration}
                            onChange={event => {
                              const value = event.target.value;
                              handleUpdateModalVideo(video.id, {
                                duration: value,
                                durationSeconds: parseDurationToSeconds(value)
                              });
                            }}
                            placeholder="10:35"
                            className="w-full text-slate-800 text-sm font-medium outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL BOTTOM ACTIONS */}
              <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  disabled={isSavingModule}
                  className="px-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingModule}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition shadow-xs cursor-pointer"
                >
                  {isSavingModule ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{savingStatusText || 'Saving...'}</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          DELETE MODULE CONFIRMATION
      ====================================================================== */}

      {deletingModuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Delete Video Module?
              </h3>
              <p className="text-xs text-gray-500">
                This will delete the module and all video lessons inside it. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingModuleId(null)}
                disabled={isDeletingModule}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteModuleConfirm}
                disabled={isDeletingModule}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
              >
                {isDeletingModule ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Module
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          DELETE VIDEO CONFIRMATION
      ====================================================================== */}

      {deletingVideoInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Delete Video Lesson?
              </h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <span className="text-gray-900 font-semibold">"{deletingVideoInfo.title}"</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVideoInfo(null)}
                disabled={isDeletingVideo}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteVideoConfirm}
                disabled={isDeletingVideo}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition shadow-xs cursor-pointer"
              >
                {isDeletingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIDEO PREVIEW MODAL
      ====================================================================== */}

      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {previewVideo.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 aspect-video bg-black flex items-center justify-center">
              {renderPreviewPlayer(previewVideo.url)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default VideosTabManager;