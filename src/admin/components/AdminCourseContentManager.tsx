"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  getAdminCourseById,
  addCourseSection,
  updateCourseSection,
  deleteCourseSection,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  getCourseReports,
  uploadMediaFile,
} from '../../api/adminApi';
import {
  HelpCircle,
  FolderArchive,
  Radio,
  FileBarChart,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Search,
  Upload,
  Calendar,
  User,
  Users,
  Award,
  Link as LinkIcon,
  X,
  Play,
  Loader2,
  Eye,
  Video,
} from 'lucide-react';

export interface AdminCourseContentManagerProps {
  courseId: number | string;
  initialTab?: 'videos' | 'quizzes' | 'projects' | 'live' | 'reports' | 'details';
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onEditDetails?: () => void;
}

export const AdminCourseContentManager: React.FC<AdminCourseContentManagerProps> = ({
  courseId,
  initialTab = 'videos',
  onNavigate,
  onShowToast,
  onEditDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'quizzes' | 'projects' | 'live' | 'reports' | 'details'>(initialTab);
  const [course, setCourse] = useState<any | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<'ALL' | number>('ALL');

  // Reports state
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);
  const [learnerSearch, setLearnerSearch] = useState<string>('');
  const [selectedLearnerDetail, setSelectedLearnerDetail] = useState<any | null>(null);

  // Modals state
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; sectionId?: number; lesson?: any }>({
    isOpen: false,
    mode: 'add',
  });
  const [quizModal, setQuizModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; sectionId?: number; lesson?: any }>({
    isOpen: false,
    mode: 'add',
  });
  const [projectModal, setProjectModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; sectionId?: number; lesson?: any }>({
    isOpen: false,
    mode: 'add',
  });
  const [liveClassModal, setLiveClassModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; sectionId?: number; lesson?: any }>({
    isOpen: false,
    mode: 'add',
  });
  const [moduleModal, setModuleModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; section?: any }>({
    isOpen: false,
    mode: 'add',
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'video' | 'quiz' | 'project' | 'live' | 'module'; item: any } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  // Video form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoSectionId, setVideoSectionId] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('10:00');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoFreePreview, setVideoFreePreview] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Quiz form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSectionId, setQuizSectionId] = useState<number>(0);
  const [quizDescription, setQuizDescription] = useState('');
  const [quizPassScore, setQuizPassScore] = useState<number>(70);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    questionText: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>>([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    },
  ]);

  // Project form
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSectionId, setProjectSectionId] = useState<number>(0);
  const [projectDescription, setProjectDescription] = useState('');
  const [projectInstructions, setProjectInstructions] = useState('');
  const [projectResourcesUrl, setProjectResourcesUrl] = useState('');
  const [projectSubmissionReq, setProjectSubmissionReq] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');

  // Live class form
  const [liveTitle, setLiveTitle] = useState('');
  const [liveSectionId, setLiveSectionId] = useState<number>(0);
  const [liveInstructor, setLiveInstructor] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [liveStartTime, setLiveStartTime] = useState('10:00');
  const [liveEndTime, setLiveEndTime] = useState('11:00');
  const [liveMeetingUrl, setLiveMeetingUrl] = useState('');
  const [liveDescription, setLiveDescription] = useState('');

  // Module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  // Load course data
  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const data = await getAdminCourseById(courseId);
      if (data) {
        setCourse(data);
        const secs = Array.isArray(data.sections)
          ? data.sections
          : Array.isArray(data.course_sections)
          ? data.course_sections
          : [];
        setSections(secs);
        if (secs.length > 0 && !videoSectionId) {
          setVideoSectionId(Number(secs[0].id));
          setQuizSectionId(Number(secs[0].id));
          setProjectSectionId(Number(secs[0].id));
          setLiveSectionId(Number(secs[0].id));
        }
      }
    } catch (err: any) {
      console.error('Error fetching course:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to load course details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load reports data
  const fetchReportsData = async () => {
    setReportsLoading(true);
    try {
      const data = await getCourseReports(courseId);
      if (data) {
        setReportsData(data);
      }
    } catch (err: any) {
      console.error('Error fetching course reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsData();
    }
  }, [activeTab, courseId]);

  // Aggregate items across sections
  const allVideos = useMemo(() => {
    const list: any[] = [];
    sections.forEach((sec, sIdx) => {
      const lessons = sec.lessons || sec.course_lessons || [];
      lessons.forEach((les: any, lIdx: number) => {
        const type = (les.lessonType || les.lesson_type || 'VIDEO').toUpperCase();
        if (type === 'VIDEO') {
          list.push({
            ...les,
            sectionId: Number(sec.id),
            sectionTitle: sec.title,
            sectionIndex: sIdx,
            lessonIndex: lIdx,
          });
        }
      });
    });
    return list;
  }, [sections]);

  const allQuizzes = useMemo(() => {
    const list: any[] = [];
    sections.forEach((sec, sIdx) => {
      const lessons = sec.lessons || sec.course_lessons || [];
      lessons.forEach((les: any, lIdx: number) => {
        const type = (les.lessonType || les.lesson_type || '').toUpperCase();
        if (type === 'QUIZ') {
          list.push({
            ...les,
            sectionId: Number(sec.id),
            sectionTitle: sec.title,
            sectionIndex: sIdx,
            lessonIndex: lIdx,
          });
        }
      });
    });
    return list;
  }, [sections]);

  const allProjects = useMemo(() => {
    const list: any[] = [];
    sections.forEach((sec, sIdx) => {
      const lessons = sec.lessons || sec.course_lessons || [];
      lessons.forEach((les: any, lIdx: number) => {
        const type = (les.lessonType || les.lesson_type || '').toUpperCase();
        if (type === 'PROJECT' || type === 'ASSIGNMENT') {
          list.push({
            ...les,
            sectionId: Number(sec.id),
            sectionTitle: sec.title,
            sectionIndex: sIdx,
            lessonIndex: lIdx,
          });
        }
      });
    });
    return list;
  }, [sections]);

  const allLiveClasses = useMemo(() => {
    const list: any[] = [];
    sections.forEach((sec, sIdx) => {
      const lessons = sec.lessons || sec.course_lessons || [];
      lessons.forEach((les: any, lIdx: number) => {
        const type = (les.lessonType || les.lesson_type || '').toUpperCase();
        if (type === 'LIVE_CLASS' || type === 'LIVE') {
          list.push({
            ...les,
            sectionId: Number(sec.id),
            sectionTitle: sec.title,
            sectionIndex: sIdx,
            lessonIndex: lIdx,
          });
        }
      });
    });
    return list;
  }, [sections]);

  // Open Video Modal
  const handleOpenAddVideo = (sectionId?: number) => {
    const targetSec = sectionId || (sections[0]?.id ? Number(sections[0].id) : 0);
    setVideoTitle('');
    setVideoSectionId(targetSec);
    setVideoUrl('');
    setVideoDuration('10:00');
    setVideoDescription('');
    setVideoThumbnail('');
    setVideoFreePreview(false);
    setVideoModal({ isOpen: true, mode: 'add', sectionId: targetSec });
  };

  const handleOpenEditVideo = (video: any) => {
    setVideoTitle(video.title || '');
    setVideoSectionId(Number(video.sectionId || video.section_id));
    setVideoUrl(video.contentUrl || video.content_url || '');
    setVideoDuration(video.duration || '10:00');
    setVideoDescription(video.description || '');
    setVideoThumbnail(video.videoKey || '');
    setVideoFreePreview(Boolean(video.freePreview || video.free_preview));
    setVideoModal({ isOpen: true, mode: 'edit', sectionId: Number(video.sectionId), lesson: video });
  };

  // Open Quiz Modal
  const handleOpenAddQuiz = (sectionId?: number) => {
    const targetSec = sectionId || (sections[0]?.id ? Number(sections[0].id) : 0);
    setQuizTitle('');
    setQuizSectionId(targetSec);
    setQuizDescription('');
    setQuizPassScore(70);
    setQuizQuestions([
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
    setQuizModal({ isOpen: true, mode: 'add', sectionId: targetSec });
  };

  const handleOpenEditQuiz = (quiz: any) => {
    setQuizTitle(quiz.title || '');
    setQuizSectionId(Number(quiz.sectionId || quiz.section_id));
    setQuizDescription(quiz.description || '');
    
    // Parse pass mark if present in description or meta
    let passScore = 70;
    try {
      if (quiz.description && quiz.description.startsWith('{')) {
        const parsed = JSON.parse(quiz.description);
        if (parsed.passingScore) passScore = Number(parsed.passingScore);
      }
    } catch {}
    setQuizPassScore(passScore);

    // Existing quiz questions
    const rawQs = quiz.quizQuestions || quiz.quiz_questions || [];
    if (rawQs.length > 0) {
      setQuizQuestions(
        rawQs.map((q: any) => {
          const rawOpts = q.options || q.quiz_question_options || [];
          const optsText = rawOpts.map((o: any) => (typeof o === 'string' ? o : o.optionText || o.option_text || ''));
          while (optsText.length < 4) optsText.push('');
          return {
            questionText: q.questionText || q.question_text || '',
            options: optsText.slice(0, 4),
            correctAnswer: q.correctOptionIndex ?? q.correct_option_index ?? 0,
            explanation: q.explanation || '',
          };
        })
      );
    } else {
      setQuizQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
        },
      ]);
    }

    setQuizModal({ isOpen: true, mode: 'edit', sectionId: Number(quiz.sectionId), lesson: quiz });
  };

  // Open Project Modal
  const handleOpenAddProject = (sectionId?: number) => {
    const targetSec = sectionId || (sections[0]?.id ? Number(sections[0].id) : 0);
    setProjectTitle('');
    setProjectSectionId(targetSec);
    setProjectDescription('');
    setProjectInstructions('');
    setProjectResourcesUrl('');
    setProjectSubmissionReq('Submit GitHub Repository or ZIP file containing your project work.');
    setProjectDeadline('');
    setProjectModal({ isOpen: true, mode: 'add', sectionId: targetSec });
  };

  const handleOpenEditProject = (project: any) => {
    setProjectTitle(project.title || '');
    setProjectSectionId(Number(project.sectionId || project.section_id));
    setProjectResourcesUrl(project.contentUrl || project.content_url || '');

    // Parse stored json description
    let desc = project.description || '';
    let instructions = '';
    let requirements = 'Submit GitHub Repository or ZIP file';
    let deadline = '';
    try {
      if (desc.startsWith('{')) {
        const p = JSON.parse(desc);
        desc = p.description || p.problemStatement || '';
        instructions = p.instructions || '';
        requirements = p.submissionRequirements || requirements;
        deadline = p.deadline || '';
      }
    } catch {}

    setProjectDescription(desc);
    setProjectInstructions(instructions);
    setProjectSubmissionReq(requirements);
    setProjectDeadline(deadline);
    setProjectModal({ isOpen: true, mode: 'edit', sectionId: Number(project.sectionId), lesson: project });
  };

  // Open Live Class Modal
  const handleOpenAddLiveClass = (sectionId?: number) => {
    const targetSec = sectionId || (sections[0]?.id ? Number(sections[0].id) : 0);
    setLiveTitle('');
    setLiveSectionId(targetSec);
    setLiveInstructor(course?.instructor || 'Course Instructor');
    setLiveDate(new Date().toISOString().split('T')[0]);
    setLiveStartTime('10:00');
    setLiveEndTime('11:00');
    setLiveMeetingUrl('');
    setLiveDescription('');
    setLiveClassModal({ isOpen: true, mode: 'add', sectionId: targetSec });
  };

  const handleOpenEditLiveClass = (live: any) => {
    setLiveTitle(live.title || '');
    setLiveSectionId(Number(live.sectionId || live.section_id));
    setLiveMeetingUrl(live.contentUrl || live.content_url || '');

    let instructor = course?.instructor || '';
    let date = '';
    let startTime = '10:00';
    let endTime = '11:00';
    let desc = live.description || '';
    try {
      if (desc.startsWith('{')) {
        const p = JSON.parse(desc);
        instructor = p.instructor || instructor;
        date = p.date || '';
        startTime = p.startTime || startTime;
        endTime = p.endTime || endTime;
        desc = p.description || '';
      }
    } catch {}

    setLiveInstructor(instructor);
    setLiveDate(date);
    setLiveStartTime(startTime);
    setLiveEndTime(endTime);
    setLiveDescription(desc);
    setLiveClassModal({ isOpen: true, mode: 'edit', sectionId: Number(live.sectionId), lesson: live });
  };

  // Save Video
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a video title', 'error');
      return;
    }
    if (!videoSectionId) {
      if (onShowToast) onShowToast('Please select or create a module first', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: videoTitle.trim(),
        lessonType: 'VIDEO',
        contentUrl: videoUrl.trim(),
        duration: videoDuration.trim() || '10:00',
        description: videoDescription.trim(),
        freePreview: videoFreePreview,
        videoKey: videoThumbnail.trim() || null,
        sectionId: videoSectionId,
      };

      if (videoModal.mode === 'add') {
        await addCourseLesson(videoSectionId, payload);
        if (onShowToast) onShowToast('Video added to course successfully!', 'success');
      } else {
        await updateCourseLesson(videoModal.lesson.id, payload);
        if (onShowToast) onShowToast('Video updated successfully!', 'success');
      }

      setVideoModal({ isOpen: false, mode: 'add' });
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to save video:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to save video', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Quiz
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a quiz title', 'error');
      return;
    }
    if (!quizSectionId) {
      if (onShowToast) onShowToast('Please select a module', 'error');
      return;
    }

    // Validate questions
    const validQuestions = quizQuestions.filter((q) => q.questionText.trim().length > 0);
    if (validQuestions.length === 0) {
      if (onShowToast) onShowToast('Please provide at least 1 question for the quiz', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const descriptionPayload = JSON.stringify({
        description: quizDescription.trim(),
        passingScore: quizPassScore,
        questionsCount: validQuestions.length,
      });

      const payload: any = {
        title: quizTitle.trim(),
        lessonType: 'QUIZ',
        description: descriptionPayload,
        sectionId: quizSectionId,
        quizQuestions: validQuestions.map((q, idx) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((opt, oIdx) => opt.trim() || `Option ${String.fromCharCode(65 + oIdx)}`),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation?.trim() || null,
        })),
      };

      if (quizModal.mode === 'add') {
        await addCourseLesson(quizSectionId, payload);
        if (onShowToast) onShowToast('Quiz created and assigned to module successfully!', 'success');
      } else {
        await updateCourseLesson(quizModal.lesson.id, payload);
        if (onShowToast) onShowToast('Quiz updated successfully!', 'success');
      }

      setQuizModal({ isOpen: false, mode: 'add' });
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to save quiz:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to save quiz', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a project title', 'error');
      return;
    }
    if (!projectSectionId) {
      if (onShowToast) onShowToast('Please select a module', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const descPayload = JSON.stringify({
        description: projectDescription.trim(),
        instructions: projectInstructions.trim(),
        submissionRequirements: projectSubmissionReq.trim(),
        deadline: projectDeadline.trim(),
      });

      const payload: any = {
        title: projectTitle.trim(),
        lessonType: 'PROJECT',
        contentUrl: projectResourcesUrl.trim(),
        description: descPayload,
        sectionId: projectSectionId,
      };

      if (projectModal.mode === 'add') {
        await addCourseLesson(projectSectionId, payload);
        if (onShowToast) onShowToast('Project added to course successfully!', 'success');
      } else {
        await updateCourseLesson(projectModal.lesson.id, payload);
        if (onShowToast) onShowToast('Project updated successfully!', 'success');
      }

      setProjectModal({ isOpen: false, mode: 'add' });
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Live Class
  const handleSaveLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a live class title', 'error');
      return;
    }
    if (!liveSectionId) {
      if (onShowToast) onShowToast('Please select a module', 'error');
      return;
    }
    if (!liveMeetingUrl.trim()) {
      if (onShowToast) onShowToast('Please enter the meeting link (Zoom / Google Meet)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const descPayload = JSON.stringify({
        instructor: liveInstructor.trim(),
        date: liveDate.trim(),
        startTime: liveStartTime.trim(),
        endTime: liveEndTime.trim(),
        description: liveDescription.trim(),
        meetingUrl: liveMeetingUrl.trim(),
      });

      const payload: any = {
        title: liveTitle.trim(),
        lessonType: 'LIVE_CLASS',
        contentUrl: liveMeetingUrl.trim(),
        description: descPayload,
        sectionId: liveSectionId,
      };

      if (liveClassModal.mode === 'add') {
        await addCourseLesson(liveSectionId, payload);
        if (onShowToast) onShowToast('Live Class scheduled and saved!', 'success');
      } else {
        await updateCourseLesson(liveClassModal.lesson.id, payload);
        if (onShowToast) onShowToast('Live Class updated successfully!', 'success');
      }

      setLiveClassModal({ isOpen: false, mode: 'add' });
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to save live class:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to save live class', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Module
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) {
      if (onShowToast) onShowToast('Please enter a module title', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (moduleModal.mode === 'add') {
        const res = await addCourseSection(courseId, {
          title: moduleTitle.trim(),
          description: moduleDescription.trim(),
        });
        if (onShowToast) onShowToast('Module added successfully!', 'success');
      } else {
        await updateCourseSection(moduleModal.section.id, {
          title: moduleTitle.trim(),
          description: moduleDescription.trim(),
        });
        if (onShowToast) onShowToast('Module updated successfully!', 'success');
      }

      setModuleModal({ isOpen: false, mode: 'add' });
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to save module:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to save module', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reorder items within section
  const handleMoveLesson = async (sectionId: number, lessonId: number, direction: 'up' | 'down') => {
    const sec = sections.find((s) => Number(s.id) === sectionId);
    if (!sec) return;
    const lessons = [...(sec.lessons || sec.course_lessons || [])];
    const idx = lessons.findIndex((l) => Number(l.id) === lessonId);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0) {
      const prev = lessons[idx - 1];
      const cur = lessons[idx];
      const prevOrder = prev.display_order ?? prev.displayOrder ?? idx - 1;
      const curOrder = cur.display_order ?? cur.displayOrder ?? idx;

      try {
        await updateCourseLesson(cur.id, { displayOrder: prevOrder });
        await updateCourseLesson(prev.id, { displayOrder: curOrder });
        await fetchCourseData();
        if (onShowToast) onShowToast('Content item moved up', 'info');
      } catch (err) {
        console.error('Failed to reorder:', err);
      }
    } else if (direction === 'down' && idx < lessons.length - 1) {
      const next = lessons[idx + 1];
      const cur = lessons[idx];
      const nextOrder = next.display_order ?? next.displayOrder ?? idx + 1;
      const curOrder = cur.display_order ?? cur.displayOrder ?? idx;

      try {
        await updateCourseLesson(cur.id, { displayOrder: nextOrder });
        await updateCourseLesson(next.id, { displayOrder: curOrder });
        await fetchCourseData();
        if (onShowToast) onShowToast('Content item moved down', 'info');
      } catch (err) {
        console.error('Failed to reorder:', err);
      }
    }
  };

  // Confirm delete item
  const handleConfirmDelete = async () => {
    if (!deleteModal?.item) return;
    setIsSubmitting(true);
    try {
      if (deleteModal.type === 'module') {
        await deleteCourseSection(deleteModal.item.id);
        if (onShowToast) onShowToast('Module deleted successfully', 'success');
      } else {
        await deleteCourseLesson(deleteModal.item.id);
        if (onShowToast) onShowToast('Content deleted successfully', 'success');
      }
      setDeleteModal(null);
      await fetchCourseData();
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      if (onShowToast) onShowToast(err?.response?.data?.error || 'Failed to delete item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload video handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      // Auto detect duration if possible
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoEl.src);
        const sec = Math.round(videoEl.duration);
        const mins = Math.floor(sec / 60);
        const remainingSec = sec % 60;
        setVideoDuration(`${mins}:${remainingSec < 10 ? '0' : ''}${remainingSec}`);
      };
      videoEl.src = URL.createObjectURL(file);

      const res = await uploadMediaFile(file, 'video');
      if (res?.url) {
        setVideoUrl(res.url);
        if (onShowToast) onShowToast('Video file uploaded successfully!', 'success');
      }
    } catch (err: any) {
      console.error('Upload video failed:', err);
      if (onShowToast) onShowToast('Video upload failed, please check file size.', 'error');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Filter sections based on selectedModuleFilter
  const filteredSections = useMemo(() => {
    if (selectedModuleFilter === 'ALL') return sections;
    return sections.filter((s) => Number(s.id) === selectedModuleFilter);
  }, [sections, selectedModuleFilter]);

  // Filtered learners in reports
  const filteredLearners = useMemo(() => {
    if (!reportsData?.learners) return [];
    if (!learnerSearch.trim()) return reportsData.learners;
    const q = learnerSearch.toLowerCase();
    return reportsData.learners.filter((l: any) =>
      (l.name && l.name.toLowerCase().includes(q)) || (l.email && l.email.toLowerCase().includes(q))
    );
  }, [reportsData?.learners, learnerSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#008b53] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading course curriculum...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => onNavigate('/admin/courses')}
                className="hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Courses</span>
              </button>
              <span>/</span>
              <span className="text-[#008b53] font-bold">Content Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Course: <span className="text-[#008b53]">{course?.title || 'Course Content'}</span>
            </h1>
            <p className="text-xs text-slate-500">
              Manage course curriculum, modules, quizzes, projects, live classes, and view learner progress reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Add Module Button */}
            <button
              type="button"
              onClick={() => {
                setModuleTitle('');
                setModuleDescription('');
                setModuleModal({ isOpen: true, mode: 'add' });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Module</span>
            </button>

            {/* Contextual Action Button based on Tab */}
            {activeTab === 'videos' && (
              <button
                type="button"
                onClick={() => handleOpenAddVideo()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Video</span>
              </button>
            )}

            {activeTab === 'quizzes' && (
              <button
                type="button"
                onClick={() => handleOpenAddQuiz()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Quiz</span>
              </button>
            )}

            {activeTab === 'projects' && (
              <button
                type="button"
                onClick={() => handleOpenAddProject()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Project</span>
              </button>
            )}

            {activeTab === 'live' && (
              <button
                type="button"
                onClick={() => handleOpenAddLiveClass()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Live Class</span>
              </button>
            )}

            {/* Preview Course in Learner View */}
            <button
              type="button"
              onClick={() => onNavigate(`/courses/${courseId}/learn`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Learner View</span>
            </button>
          </div>
        </div>

        {/* 5 Distinct Management Tabs + Details */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {/* 1. Videos Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-[#008b53] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Videos</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'videos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {allVideos.length}
            </span>
          </button>

          {/* 2. Quizzes Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'bg-[#008b53] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quizzes</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {allQuizzes.length}
            </span>
          </button>

          {/* 3. Projects Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-[#008b53] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Projects</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {allProjects.length}
            </span>
          </button>

          {/* 4. Live Classes Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-[#008b53] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Classes</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'live' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {allLiveClasses.length}
            </span>
          </button>

          {/* 5. Reports Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-[#008b53] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            <span>Reports</span>
            {course?.enrollments?.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {course.enrollments.length}
              </span>
            )}
          </button>

          {/* 6. Course Details & Modules */}
          <button
            type="button"
            onClick={() => {
              if (onEditDetails) {
                onEditDetails();
              } else {
                setActiveTab('details');
              }
            }}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Course Details</span>
          </button>
        </div>
      </div>

      {/* Module Filter bar for Content Tabs */}
      {['videos', 'quizzes', 'projects', 'live'].includes(activeTab) && sections.length > 0 && (
        <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Filter Module:</span>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
              <option value="ALL">All Modules ({sections.length})</option>
              {sections.map((sec, idx) => (
                <option key={sec.id} value={sec.id}>
                  Module {idx + 1}: {sec.title}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Each item is assigned to a specific module in the curriculum order.
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. VIDEOS MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-900">No Modules Created Yet</h3>
                <p className="text-xs text-slate-500">
                  Every video must belong to a module. Please create a module first to begin organizing videos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModuleTitle('');
                  setModuleDescription('');
                  setModuleModal({ isOpen: true, mode: 'add' });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition cursor-pointer"
              >
                + Create First Module
              </button>
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => {
              const secLessons = (sec.lessons || sec.course_lessons || []).filter(
                (l: any) => (l.lessonType || l.lesson_type || 'VIDEO').toUpperCase() === 'VIDEO'
              );

              return (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {/* Module Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        {secIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {secLessons.length} {secLessons.length === 1 ? 'Video' : 'Videos'} in this module
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddVideo(Number(sec.id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#008b53]" />
                      <span>+ Add Video to Module</span>
                    </button>
                  </div>

                  {/* Video List */}
                  {secLessons.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No videos in this module yet. Click &quot;+ Add Video to Module&quot; to upload or attach a video.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {secLessons.map((video: any, vIdx: number) => (
                        <div
                          key={video.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={vIdx === 0}
                                onClick={() => handleMoveLesson(Number(sec.id), Number(video.id), 'up')}
                                className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                title="Move Video Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={vIdx === secLessons.length - 1}
                                onClick={() => handleMoveLesson(Number(sec.id), Number(video.id), 'down')}
                                className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                title="Move Video Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Thumbnail or Play icon */}
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 font-bold overflow-hidden">
                              {video.videoKey && video.videoKey.startsWith('http') ? (
                                <img src={video.videoKey} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{video.title}</h4>
                                {video.freePreview && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {video.duration || '0:00'}
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-xs text-slate-400 font-mono text-[11px]">
                                  {video.contentUrl || video.content_url || 'Video File'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVideo(video)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, type: 'video', item: video })}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. QUIZZES MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Modules Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quizzes must belong to a course module. Please create a module first.
              </p>
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => {
              const secQuizzes = (sec.lessons || sec.course_lessons || []).filter(
                (l: any) => (l.lessonType || l.lesson_type || '').toUpperCase() === 'QUIZ'
              );

              return (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {/* Module Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                        {secIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {secQuizzes.length} {secQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} in this module
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddQuiz(Number(sec.id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                      <span>+ Add Quiz to Module</span>
                    </button>
                  </div>

                  {/* Quizzes List */}
                  {secQuizzes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No quizzes in this module yet. Click &quot;+ Add Quiz to Module&quot; to build an assessment.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {secQuizzes.map((quiz: any, qIdx: number) => {
                        const questionsCount =
                          quiz.quizQuestions?.length || quiz.quiz_questions?.length || 0;
                        let passScore = 70;
                        try {
                          if (quiz.description && quiz.description.startsWith('{')) {
                            const p = JSON.parse(quiz.description);
                            if (p.passingScore) passScore = p.passingScore;
                          }
                        } catch {}

                        return (
                          <div
                            key={quiz.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              {/* Reorder */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={qIdx === 0}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(quiz.id), 'up')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={qIdx === secQuizzes.length - 1}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(quiz.id), 'down')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 font-bold">
                                <HelpCircle className="w-5 h-5" />
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900">{quiz.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-700">
                                    {questionsCount} {questionsCount === 1 ? 'Question' : 'Questions'}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-bold">Pass Mark: {passScore}%</span>
                                  <span>•</span>
                                  <span className="text-slate-400">Assessment Quiz</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuiz(quiz)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit Quiz</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, type: 'quiz', item: quiz })}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PROJECTS MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FolderArchive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Modules Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Projects must belong to a course module. Please create a module first.
              </p>
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => {
              const secProjects = (sec.lessons || sec.course_lessons || []).filter((l: any) => {
                const t = (l.lessonType || l.lesson_type || '').toUpperCase();
                return t === 'PROJECT' || t === 'ASSIGNMENT';
              });

              return (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {/* Module Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                        {secIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {secProjects.length} {secProjects.length === 1 ? 'Project' : 'Projects'} in this module
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddProject(Number(sec.id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-indigo-600" />
                      <span>+ Add Project to Module</span>
                    </button>
                  </div>

                  {/* Projects List */}
                  {secProjects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No projects in this module yet. Click &quot;+ Add Project to Module&quot; to assign a hands-on project.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {secProjects.map((proj: any, pIdx: number) => {
                        let deadline = '';
                        let reqs = 'Repository / File upload';
                        try {
                          if (proj.description && proj.description.startsWith('{')) {
                            const p = JSON.parse(proj.description);
                            if (p.deadline) deadline = p.deadline;
                            if (p.submissionRequirements) reqs = p.submissionRequirements;
                          }
                        } catch {}

                        return (
                          <div
                            key={proj.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              {/* Reorder */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={pIdx === 0}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(proj.id), 'up')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={pIdx === secProjects.length - 1}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(proj.id), 'down')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 font-bold">
                                <FolderArchive className="w-5 h-5" />
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  {deadline && (
                                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Deadline: {deadline}
                                    </span>
                                  )}
                                  <span className="truncate max-w-xs text-slate-400">
                                    Req: {reqs}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProject(proj)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit Project</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, type: 'project', item: proj })}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LIVE CLASSES MANAGEMENT TAB */}
      {/* ======================================================== */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {sections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Modules Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Live Classes must belong to a course module. Please create a module first.
              </p>
            </div>
          ) : (
            filteredSections.map((sec, secIdx) => {
              const secLive = (sec.lessons || sec.course_lessons || []).filter((l: any) => {
                const t = (l.lessonType || l.lesson_type || '').toUpperCase();
                return t === 'LIVE_CLASS' || t === 'LIVE';
              });

              return (
                <div key={sec.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {/* Module Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                        {secIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{sec.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {secLive.length} {secLive.length === 1 ? 'Live Class' : 'Live Classes'} in this module
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddLiveClass(Number(sec.id))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-rose-600" />
                      <span>+ Add Live Class</span>
                    </button>
                  </div>

                  {/* Live Class List */}
                  {secLive.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No live classes scheduled for this module yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {secLive.map((live: any, lIdx: number) => {
                        let instructor = course?.instructor || 'Instructor';
                        let date = '';
                        let time = '';
                        let meetingUrl = live.contentUrl || live.content_url || '';
                        try {
                          if (live.description && live.description.startsWith('{')) {
                            const p = JSON.parse(live.description);
                            if (p.instructor) instructor = p.instructor;
                            if (p.date) date = p.date;
                            if (p.startTime && p.endTime) time = `${p.startTime} - ${p.endTime}`;
                            if (p.meetingUrl) meetingUrl = p.meetingUrl;
                          }
                        } catch {}

                        return (
                          <div
                            key={live.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                          >
                            <div className="flex items-start sm:items-center gap-3.5">
                              {/* Reorder */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  disabled={lIdx === 0}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(live.id), 'up')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={lIdx === secLive.length - 1}
                                  onClick={() => handleMoveLesson(Number(sec.id), Number(live.id), 'down')}
                                  className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-500"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0 font-bold">
                                <Radio className="w-5 h-5" />
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900">{live.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {instructor}
                                  </span>
                                  {date && (
                                    <>
                                      <span>•</span>
                                      <span className="text-rose-700 font-bold flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {date} {time ? `(${time})` : ''}
                                      </span>
                                    </>
                                  )}
                                  {meetingUrl && (
                                    <>
                                      <span>•</span>
                                      <a
                                        href={meetingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                      >
                                        <LinkIcon className="w-3 h-3" />
                                        Meeting Link
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditLiveClass(live)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit Live Class</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, type: 'live', item: live })}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. REPORTS TAB (REAL LEARNER ACTIVITY) */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Top Aggregate Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Total Learners
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {reportsData?.summary?.totalLearners ?? 0}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                {reportsData?.summary?.completedLearners ?? 0} Completed
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-emerald-600" />
                Completed Videos
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {reportsData?.summary?.completedVideosCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                out of {reportsData?.summary?.totalVideos ?? allVideos.length} total
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                Completed Quizzes
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {reportsData?.summary?.completedQuizzesCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                out of {reportsData?.summary?.totalQuizzes ?? allQuizzes.length} total
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
                Completed Projects
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {reportsData?.summary?.completedProjectsCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                out of {reportsData?.summary?.totalProjects ?? allProjects.length} total
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-rose-600" />
                Live Attendance
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {reportsData?.summary?.liveClassAttendanceCount ?? 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                out of {reportsData?.summary?.totalLiveClasses ?? allLiveClasses.length} total
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#008b53]" />
                Course Progress
              </span>
              <p className="text-xl sm:text-2xl font-black text-[#008b53]">
                {reportsData?.summary?.overallCourseProgress ?? 0}%
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                Course completion rate
              </span>
            </div>
          </div>

          {/* Learner Progress Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enrolled Learner Progress</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time activity tracking across Videos, Quizzes, Projects, and Live Classes.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search learner name or email..."
                  value={learnerSearch}
                  onChange={(e) => setLearnerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
            </div>

            {reportsLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#008b53]" />
                <span>Loading real learner activity reports...</span>
              </div>
            ) : filteredLearners.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700">No Learners Found</p>
                <p>When students enroll and watch videos, take quizzes, or submit projects, their real progress appears here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                      <th className="py-3 px-6">Learner</th>
                      <th className="py-3 px-4">Videos</th>
                      <th className="py-3 px-4">Quizzes</th>
                      <th className="py-3 px-4">Projects</th>
                      <th className="py-3 px-4">Live Classes</th>
                      <th className="py-3 px-4">Overall Progress</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredLearners.map((learner: any) => (
                      <tr key={learner.enrollmentId || learner.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                              {learner.avatar ? (
                                <img src={learner.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (learner.name || 'L')[0].toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{learner.name}</div>
                              <div className="text-[11px] text-slate-400">{learner.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">
                            {learner.completedVideos} / {learner.totalVideos}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Completed</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-amber-700">
                            {learner.completedQuizzes} / {learner.totalQuizzes}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Passed</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-indigo-700">
                            {learner.completedProjects} / {learner.totalProjects}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Submitted</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-rose-700">
                            {learner.completedLiveClasses} / {learner.totalLiveClasses}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Attended</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1 w-28">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-extrabold text-[#008b53]">{learner.progressPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#008b53] rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, learner.progressPercentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              learner.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {learner.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLearnerDetail(learner)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. COURSE DETAILS TAB */}
      {/* ======================================================== */}
      {activeTab === 'details' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Course Metadata &amp; Modules</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit core course details, instructor, pricing, and organize modules.
              </p>
            </div>
            {onEditDetails && (
              <button
                type="button"
                onClick={onEditDetails}
                className="px-4 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition cursor-pointer"
              >
                Open Full Course Editor
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Title</span>
              <p className="text-sm font-bold text-slate-900">{course?.title}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Category &amp; Level</span>
              <p className="text-sm font-bold text-slate-900">
                {course?.category || 'General'} • {course?.level || 'All Levels'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Instructor</span>
              <p className="text-sm font-bold text-slate-900">{course?.instructor || 'Not assigned'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pricing</span>
              <p className="text-sm font-bold text-[#008b53]">
                {course?.price ? `₹${course.price}` : 'FREE Course'}
              </p>
            </div>
          </div>

          {/* Module List with Edit / Delete */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Course Modules ({sections.length})</h4>
              <button
                type="button"
                onClick={() => {
                  setModuleTitle('');
                  setModuleDescription('');
                  setModuleModal({ isOpen: true, mode: 'add' });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                + Add Module
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{sec.title}</h5>
                      <span className="text-[11px] text-slate-400">
                        {sec.lessons?.length || sec.course_lessons?.length || 0} Lessons
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModuleTitle(sec.title);
                        setModuleDescription(sec.description || '');
                        setModuleModal({ isOpen: true, mode: 'edit', section: sec });
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ isOpen: true, type: 'module', item: sec })}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT VIDEO */}
      {/* ======================================================== */}
      {videoModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-[#008b53]" />
                <span>{videoModal.mode === 'add' ? 'Add Video to Course' : 'Edit Video'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setVideoModal({ isOpen: false, mode: 'add' })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to PCB Design"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assign to Module *</label>
                <select
                  required
                  value={videoSectionId}
                  onChange={(e) => setVideoSectionId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  {sections.map((sec, idx) => (
                    <option key={sec.id} value={sec.id}>
                      Module {idx + 1}: {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Video Source / File Upload *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Video file path (/uploads/...) or direct MP4 / YouTube URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingVideo ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      disabled={isUploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (MM:SS) *</label>
                  <input
                    type="text"
                    placeholder="12:45"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Free Preview</label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoFreePreview}
                        onChange={(e) => setVideoFreePreview(e.target.checked)}
                        className="w-4 h-4 rounded text-[#008b53] focus:ring-green-500"
                      />
                      <span>Allow Free Preview</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of this video lesson..."
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVideoModal({ isOpen: false, mode: 'add' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{videoModal.mode === 'add' ? 'Save Video' : 'Update Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT QUIZ */}
      {/* ======================================================== */}
      {quizModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>{quizModal.mode === 'add' ? 'Create Assessment Quiz' : 'Edit Quiz'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuizModal({ isOpen: false, mode: 'add' })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quiz Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PCB Design Basics Quiz"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign to Module *</label>
                  <select
                    required
                    value={quizSectionId}
                    onChange={(e) => setQuizSectionId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {sections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>
                        Module {idx + 1}: {sec.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Passing Score (%) *</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    required
                    value={quizPassScore}
                    onChange={(e) => setQuizPassScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Instructions / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 questions, each carries 1 mark"
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Questions ({quizQuestions.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuizQuestions([
                        ...quizQuestions,
                        {
                          questionText: '',
                          options: ['', '', '', ''],
                          correctAnswer: 0,
                          explanation: '',
                        },
                      ])
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Question</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">Question {qIdx + 1}</span>
                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                            className="text-rose-600 hover:text-rose-800 font-bold text-xs transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          required
                          placeholder="e.g. What is PCB?"
                          value={q.questionText}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIdx].questionText = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>

                      {/* Options A-D */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctAnswer === oIdx}
                              onChange={() => {
                                const updated = [...quizQuestions];
                                updated[qIdx].correctAnswer = oIdx;
                                setQuizQuestions(updated);
                              }}
                              className="w-4 h-4 text-[#008b53] focus:ring-green-500 cursor-pointer"
                              title="Mark as correct answer"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Select the radio button beside the correct option.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuizModal({ isOpen: false, mode: 'add' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{quizModal.mode === 'add' ? 'Save Quiz' : 'Update Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PROJECT */}
      {/* ======================================================== */}
      {projectModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-indigo-600" />
                <span>{projectModal.mode === 'add' ? 'Add Hands-on Project' : 'Edit Project'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setProjectModal({ isOpen: false, mode: 'add' })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCB Design Final Project"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign to Module *</label>
                  <select
                    required
                    value={projectSectionId}
                    onChange={(e) => setProjectSectionId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {sections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>
                        Module {idx + 1}: {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={(e) => setProjectDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Project Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Overview and objectives of this project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Detailed Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Step-by-step instructions for completing the project..."
                  value={projectInstructions}
                  onChange={(e) => setProjectInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Starter Resources URL</label>
                <input
                  type="text"
                  placeholder="Link to GitHub repository, starter files, or docs"
                  value={projectResourcesUrl}
                  onChange={(e) => setProjectResourcesUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Submission Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Submit GitHub repository URL or ZIP file"
                  value={projectSubmissionReq}
                  onChange={(e) => setProjectSubmissionReq(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProjectModal({ isOpen: false, mode: 'add' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{projectModal.mode === 'add' ? 'Save Project' : 'Update Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT LIVE CLASS */}
      {/* ======================================================== */}
      {liveClassModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-600" />
                <span>{liveClassModal.mode === 'add' ? 'Schedule Live Class' : 'Edit Live Class'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setLiveClassModal({ isOpen: false, mode: 'add' })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLiveClass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Live Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCB Design Live Session &amp; Q&amp;A"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign to Module *</label>
                  <select
                    required
                    value={liveSectionId}
                    onChange={(e) => setLiveSectionId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {sections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>
                        Module {idx + 1}: {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Instructor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Instructor Name"
                    value={liveInstructor}
                    onChange={(e) => setLiveInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={liveDate}
                    onChange={(e) => setLiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={liveStartTime}
                    onChange={(e) => setLiveStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">End Time *</label>
                  <input
                    type="time"
                    required
                    value={liveEndTime}
                    onChange={(e) => setLiveEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Meeting URL (Google Meet / Zoom) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                  value={liveMeetingUrl}
                  onChange={(e) => setLiveMeetingUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Topics covered during this live session..."
                  value={liveDescription}
                  onChange={(e) => setLiveDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLiveClassModal({ isOpen: false, mode: 'add' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{liveClassModal.mode === 'add' ? 'Save Live Class' : 'Update Live Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT MODULE */}
      {/* ======================================================== */}
      {moduleModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {moduleModal.mode === 'add' ? 'Add Module / Section' : 'Edit Module'}
              </h3>
              <button
                type="button"
                onClick={() => setModuleModal({ isOpen: false, mode: 'add' })}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Introduction to PCB Design"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of module..."
                  value={moduleDescription}
                  onChange={(e) => setModuleDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModuleModal({ isOpen: false, mode: 'add' })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#008b53] hover:bg-[#007445] text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{moduleModal.mode === 'add' ? 'Create Module' : 'Update Module'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete {deleteModal.type === 'module' ? 'Module' : 'Content Item'}?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete &quot;{deleteModal.item.title}&quot;? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: LEARNER DETAIL MODAL */}
      {/* ======================================================== */}
      {selectedLearnerDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Learner Progress Breakdown</h3>
              <button
                type="button"
                onClick={() => setSelectedLearnerDetail(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  {(selectedLearnerDetail.name || 'L')[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedLearnerDetail.name}</h4>
                  <p className="text-slate-500">{selectedLearnerDetail.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Videos</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedLearnerDetail.completedVideos} / {selectedLearnerDetail.totalVideos}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quizzes</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedLearnerDetail.completedQuizzes} / {selectedLearnerDetail.totalQuizzes}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Projects</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedLearnerDetail.completedProjects} / {selectedLearnerDetail.totalProjects}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Live Classes</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedLearnerDetail.completedLiveClasses} / {selectedLearnerDetail.totalLiveClasses}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Overall Course Progress</span>
                <p className="text-2xl font-black text-emerald-800">{selectedLearnerDetail.progressPercentage}%</p>
                <span className="text-[11px] text-emerald-700 font-semibold">Status: {selectedLearnerDetail.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLearnerDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseContentManager;
