"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  RefreshCw,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  BookOpen,
  User,
  Check,
  AlertCircle,
  Sparkles,
  Lock,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  Download,
  XCircle,
  Video,
  Radio,
  FileBarChart,
  CreditCard,
  FolderArchive,
  ExternalLink,
  Menu,
  X,
  Paperclip,
  LogOut,
  GraduationCap,
  Upload,
  Settings,
} from 'lucide-react';
import { getCourseById, CourseDto } from '../api/courseApi';
import { getCourseContent, CourseContentDetail } from '../api/paymentApi';
import { getLessonQuiz, submitQuizAnswer, QuizQuestion, QuizSubmitResponse } from '../api/quizApi';
import {
  getCourseCertificate,
  generateCourseCertificate,
  downloadCertificatePdf,
  downloadSampleCertificatePdf,
  claimCourseCertificate,
  CertificateDto,
} from '../api/certificateApi';
import { CertificateViewModal } from '../components/certificate/CertificateViewModal';
import { QuizAssessmentView } from '../components/QuizAssessmentView';
import { StudentQuizView } from './learn/StudentQuizView';
import { StudentProjectView } from './learn/StudentProjectView';
import { StudentProjectReportView } from '../components/StudentProjectReportView';
import { StudentLiveClassesView } from './learn/StudentLiveClassesView';
import { LearningAnalyticsReportView } from '../components/LearningAnalyticsReportView';
import { StudentEMCSidebar } from '../components/learn/StudentEMCSidebar';
import { StudentCourseHeader } from '../components/learn/StudentCourseHeader';
import { StudentCourseTabs, CourseTabType } from '../components/learn/StudentCourseTabs';
import { StudentEMCReportView } from '../components/learn/StudentEMCReportView';
import { StudentPaymentView } from '../components/learn/StudentPaymentView';
import { markLessonComplete } from '../api/adminApi';
import { getCourseEnrollmentStatus, CourseEnrollmentStatusDto } from '../api/careerApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  completeLessonThunk,
  saveLessonProgressThunk,
  setCompletedLessonIds as setReduxCompletedLessonIds,
  setCourseProgress,
  setActiveLessonId as setReduxActiveLessonId,
  updateLessonPlayback,
} from '../store/slices/courseSlice';
import { logoutUserThunk, clearCredentials } from '../store/slices/authSlice';
import {
  formatDurationHuman,
  formatDurationMMSS,
  formatDurationDigital,
  parseDurationToSeconds,
  extractYouTubeId,
} from '@/lib/duration';
import { triggerLessonCompletionCelebration } from '@/lib/confetti';

interface CourseLearnPageProps {
  courseId: number | string;
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  embeddedInLayout?: boolean;
}

interface FlattenedLesson {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  durationSeconds?: number;
  lessonType: string;
  sectionId: number;
  sectionTitle: string;
  isCompleted: boolean;
  locked: boolean;
  freePreview?: boolean;
  contentUrl?: string | null;
  videoUrl?: string | null;
  videoKey?: string | null;
}

export function isLessonMatchingTab(lessonType: string | undefined, tab: CourseTabType): boolean {
  const type = (lessonType || 'VIDEO').toUpperCase();
  switch (tab) {
    case 'videos':
      return type === 'VIDEO';
    case 'quizzes':
      return type === 'QUIZ';
    case 'projects':
      return type === 'PROJECT' || type === 'ASSIGNMENT';
    case 'live':
      return type === 'LIVE_CLASS' || type === 'LIVE';
    default:
      return false;
  }
}

export function CourseLearnPage({ courseId, onNavigate, onShowToast, embeddedInLayout = false }: CourseLearnPageProps) {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const {
    completedLessonIds: reduxCompletedIds,
    courseProgress: reduxProgress,
  } = useAppSelector((state) => state.course);

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [content, setContent] = useState<CourseContentDetail | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<CourseEnrollmentStatusDto | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);

  // Navigation Tabs: Videos (default), Quizzes, Projects, Live Class, Reports, Payment
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CourseTabType>('videos');

  // User Profile Dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Mobile drawer toggle for curriculum
  const [isMobileCurriculumOpen, setIsMobileCurriculumOpen] = useState(false);

  // Expanded sections accordion state
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Resume prompt state
  const [resumePromptTime, setResumePromptTime] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState<boolean>(false);

  // Auto-next countdown state
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const [isVideoEnded, setIsVideoEnded] = useState<boolean>(false);
  const celebratedLessonIdsRef = useRef<Set<string | number>>(new Set());
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lessonContentRef = useRef<HTMLDivElement | null>(null);

  // Quiz state for QUIZ lesson types
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Assignment submission state
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(false);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  // Certificate state
  const [courseCertificate, setCourseCertificate] = useState<any | null>(null);
  const [isDownloadingCert, setIsDownloadingCert] = useState<boolean>(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  // Video container & element refs
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [watchedTime, setWatchedTime] = useState<number>(0);

  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ingage_video_volume');
      return saved !== null ? Math.max(0, Math.min(1, Number(saved))) : 1;
    } catch {
      return 1;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ingage_video_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ingage_video_speed');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Anti-cheat watch progress tracking refs
  const maxWatchedTimeRef = useRef<number>(0);
  const accumulatedWatchTimeRef = useRef<number>(0);
  const lastPlaybackTimeRef = useRef<number>(0);


  // Backend API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';
  const authToken = typeof window !== 'undefined' ? (localStorage.getItem('ingage_token') || '') : '';

  // Download deterrence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);


  // Load course data
  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, contentRes, enrollRes] = await Promise.all([
        getCourseById(courseId).catch(() => null),
        getCourseContent(courseId),
        getCourseEnrollmentStatus(courseId).catch(() => null),
      ]);

      setCourse(courseRes);
      setContent(contentRes);
      setEnrollmentStatus(enrollRes);

      // Security check: Student must be enrolled or admin to access learning page
      const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN';
      const isFreeCourse = Number(contentRes?.finalPrice ?? contentRes?.price ?? 0) === 0;
      const isEnrolled = Boolean(isAdmin || isFreeCourse || contentRes?.isEnrolled || enrollRes?.enrolled);

      if (!isEnrolled) {
        if (onShowToast) {
          onShowToast('Enrollment required to access course learning content. Please purchase this course.', 'error');
        }
        onNavigate(`/courses/${contentRes?.slug || courseId}`);
        return;
      }

      // Initialize all sections as expanded by default
      if (contentRes?.sections) {
        const initialExpanded: Record<number, boolean> = {};
        contentRes.sections.forEach((sec) => {
          initialExpanded[sec.id] = true;
        });
        setExpandedSections(initialExpanded);
      }

      // Sync completed lessons
      const serverCompleted: number[] = [];
      if (Array.isArray((contentRes as any)?.completedLessonIds)) {
        serverCompleted.push(...(contentRes as any).completedLessonIds);
      }
      contentRes.sections?.forEach((sec) => {
        sec.lessons?.forEach((les) => {
          if ((les as any).completed || (les as any).isCompleted) {
            serverCompleted.push(les.id);
          }
        });
      });

      const merged = Array.from(new Set([...serverCompleted, ...reduxCompletedIds]));
      setCompletedLessonIds(merged);
      dispatch(setReduxCompletedLessonIds(merged));

      // Select initial active lesson
      const all: any[] = [];
      contentRes.sections?.forEach((sec) => {
        sec.lessons?.forEach((les) => {
          all.push(les);
        });
      });

      if (all.length > 0) {
        const videoList = all.filter((l) => isLessonMatchingTab(l.lessonType || l.lesson_type, 'videos'));
        const candidateList = videoList.length > 0 ? videoList : all;
        const firstUncompleted = candidateList.find((l) => !merged.includes(l.id));
        const initial = firstUncompleted || candidateList[0];
        setActiveLessonId(initial.id);
        dispatch(setReduxActiveLessonId(initial.id));
      }
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Flattened lessons list
  const allLessons: FlattenedLesson[] = useMemo(() => {
    if (!content?.sections) return [];
    return content.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        durationSeconds: (lesson as any).durationSeconds || (lesson as any).duration_seconds,
        lessonType: lesson.lessonType || 'VIDEO',
        sectionId: section.id,
        sectionTitle: section.title,
        isCompleted: completedLessonIds.includes(lesson.id),
        locked: Boolean(authUser?.role?.toUpperCase() !== 'ADMIN' && lesson.locked),
        freePreview: Boolean(lesson.freePreview),
        contentUrl: (lesson as any).contentUrl || (lesson as any).videoUrl || (lesson as any).content_url || null,
        videoUrl: (lesson as any).videoUrl || (lesson as any).contentUrl || (lesson as any).content_url || null,
        videoKey: (lesson as any).videoKey || (lesson as any).youtubeVideoId || null,
      }))
    );
  }, [content, completedLessonIds]);

  // Strictly filter lessons for the currently active tab
  const currentTabLessons: FlattenedLesson[] = useMemo(() => {
    return allLessons.filter((l) => isLessonMatchingTab(l.lessonType, activeTab));
  }, [allLessons, activeTab]);

  // Active lesson selected by user or initial load, strictly from currentTabLessons
  const activeLesson = useMemo(() => {
    if (currentTabLessons.length === 0) return null;
    if (activeLessonId) {
      const found = currentTabLessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    const firstUncompleted = currentTabLessons.find((l) => !completedLessonIds.includes(l.id));
    return firstUncompleted || currentTabLessons[0];
  }, [currentTabLessons, activeLessonId, completedLessonIds]);

  const currentIndex = activeLesson ? currentTabLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? currentTabLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < currentTabLessons.length - 1 ? currentTabLessons[currentIndex + 1] : null;

  // Filter strictly video lessons for the Video Player helpers
  const videoLessons: FlattenedLesson[] = useMemo(() => {
    return allLessons.filter((l) => (l.lessonType || 'VIDEO').toUpperCase() === 'VIDEO');
  }, [allLessons]);

  const completedLessonsCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const overallProgressPercent = allLessons.length > 0 ? Math.round((completedLessonsCount / allLessons.length) * 100) : 0;

  // Sections containing only lessons matching the active tab (omits empty sections)
  const filteredSections = useMemo(() => {
    if (!content?.sections) return [];
    return content.sections
      .map((sec, sIdx) => {
        const matchingLessons = (sec.lessons || []).filter((l: any) =>
          isLessonMatchingTab(l.lessonType || l.lesson_type, activeTab)
        );
        return {
          ...sec,
          moduleNumber: sIdx + 1,
          lessons: matchingLessons,
        };
      })
      .filter((sec) => sec.lessons.length > 0);
  }, [content?.sections, activeTab]);

  // Handle immediate tab switching and automatic active lesson synchronization
  const handleTabChange = (newTab: CourseTabType) => {
    setActiveTab(newTab);
    const matching = allLessons.filter((l) => isLessonMatchingTab(l.lessonType, newTab));
    if (matching.length > 0) {
      const firstUncompleted = matching.find((l) => !completedLessonIds.includes(l.id));
      const target = firstUncompleted || matching[0];
      setActiveLessonId(target.id);
      dispatch(setReduxActiveLessonId(target.id));
    }
  };

  // Active section index & title for dynamic breadcrumb
  const activeSectionIdx = useMemo(() => {
    if (!content?.sections || !activeLesson) return 0;
    const idx = content.sections.findIndex((s) => s.id === activeLesson.sectionId);
    return idx >= 0 ? idx : 0;
  }, [content?.sections, activeLesson]);

  const activeSection = content?.sections?.[activeSectionIdx] || null;

  const isAdmin = authUser?.role?.toUpperCase() === 'ADMIN';
  const isFreeCourse = Boolean((course && Number(course.price) === 0) || (content && Number(content.price) === 0));
  const isUserEnrolled = Boolean(isAdmin || isFreeCourse || content?.isEnrolled || enrollmentStatus?.enrolled || enrollmentStatus?.courseAccess);
  const canPlayActiveLesson = Boolean(activeLesson && (isAdmin || isUserEnrolled || activeLesson.freePreview));
  const isLockedForUser = Boolean(activeLesson && !canPlayActiveLesson);

  // Detect if video is in its final 10 seconds (Requirement #1 & #3)
  const isLast10Seconds = useMemo(() => {
    if (isVideoEnded) return false;
    if (!duration || duration <= 10) return false;
    return currentTime >= duration - 10;
  }, [currentTime, duration, isVideoEnded]);


  const isCourseFullyCompleted = Boolean(
    (enrollmentStatus?.completed || enrollmentStatus?.enrollmentStatus === 'COMPLETED' || (enrollmentStatus?.progress || 0) >= 100) ||
    (allLessons.length > 0 && allLessons.every((l) => completedLessonIds.includes(l.id)))
  );

  // Check if active lesson is YouTube
  const rawVideo = activeLesson && (activeLesson.contentUrl || activeLesson.videoUrl || (activeLesson as any).content_url);
  const youtubeVideoId = useMemo(() => {
    if (!activeLesson) return null;
    if (activeLesson.videoKey) return activeLesson.videoKey;
    if (rawVideo && /youtube.com|youtu.be/i.test(String(rawVideo))) {
      return extractYouTubeId(String(rawVideo));
    }
    return null;
  }, [activeLesson, rawVideo]);

  const isYouTubeVideo = Boolean(youtubeVideoId);

  // Resolve direct / uploaded video stream URL
  const resolveStreamUrl = (): string => {
    if (!activeLesson || !canPlayActiveLesson) return '';
    if (isYouTubeVideo) return '';

    let videoUrl = rawVideo ? String(rawVideo).trim() : '';

    if (
      !videoUrl ||
      videoUrl.includes('commondatastorage.googleapis.com') ||
      videoUrl.includes('sample/BigBuckBunny') ||
      videoUrl.includes('sample/ElephantsDream') ||
      videoUrl.includes('localhost:8080') ||
      videoUrl.includes('localhost:8000')
    ) {
      return '/uploads/videos/video.mp4';
    }

    if (videoUrl.startsWith('/uploads/') || videoUrl.startsWith('/api/uploads/')) {
      return videoUrl;
    }

    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      return videoUrl;
    }

    return '/uploads/videos/video.mp4';
  };

  const videoStreamUrl = resolveStreamUrl();

  // Reset video state & check for saved resume position on active lesson change
  useEffect(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsVideoEnded(false);
    setVideoError(null);
    setIsPlaying(false);
    setIsVideoLoading(true);
    setIsVideoBuffering(false);
    setSelectedOption(null);
    setQuizResult(null);
    setQuizError(null);
    setCurrentQuestionIndex(0);
    setAssignmentSubmitted(false);

    // Check if there is a saved playback position > 15 seconds to offer Resume
    if (activeLesson) {
      try {
        const posKey = `ingage_video_pos_${courseId}_${activeLesson.id}`;
        const savedPos = localStorage.getItem(posKey);
        const posNum = savedPos ? Number(savedPos) : 0;
        if (posNum > 5 && !completedLessonIds.includes(activeLesson.id)) {
          setResumePromptTime(posNum);
        } else {
          setResumePromptTime(null);
        }
      } catch {
        setResumePromptTime(null);
      }
    }
  }, [activeLesson?.id, courseId]);

  // Fetch quiz questions if active lesson is QUIZ
  useEffect(() => {
    let isMounted = true;
    if (!activeLesson || activeLesson.lessonType !== 'QUIZ') {
      setQuizQuestions([]);
      return;
    }

    const fetchQuiz = async () => {
      setQuizLoading(true);
      setQuizError(null);
      try {
        const questions = await getLessonQuiz(Number(course?.id || courseId) || 0, activeLesson.id);
        if (isMounted) {
          setQuizQuestions(questions);
        }
      } catch (err: any) {
        if (isMounted) {
          setQuizError(err?.response?.data?.message || 'Unable to load quiz questions.');
        }
      } finally {
        if (isMounted) {
          setQuizLoading(false);
        }
      }
    };

    fetchQuiz();
    return () => {
      isMounted = false;
    };
  }, [activeLesson?.id, courseId]);

  const isCurrentCompleted = Boolean(activeLesson && completedLessonIds.includes(activeLesson.id));

  // Resume handler
  const handleResumePlayback = () => {
    if (videoRef.current && resumePromptTime) {
      videoRef.current.currentTime = resumePromptTime;
      setCurrentTime(resumePromptTime);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
    }
    setResumePromptTime(null);
  };

  const handleStartFromBeginning = () => {
    setIsVideoEnded(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
    }
    try {
      if (activeLesson) {
        localStorage.removeItem(`ingage_video_pos_${courseId}_${activeLesson.id}`);
      }
    } catch { }
    setResumePromptTime(null);
  };

  // Video time update & progress calculation
  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeLesson) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    // Detect natural end of video if within 0.25s of duration
    if (dur > 0 && cur >= dur - 0.25 && !isVideoEnded) {
      handleVideoEnded();
      return;
    }

    // Save playback position locally for immediate resume
    try {
      const posKey = `ingage_video_pos_${courseId}_${activeLesson.id}`;
      localStorage.setItem(posKey, String(cur));
    } catch { }

    // Genuine watched progress
    const lastTime = lastPlaybackTimeRef.current;
    const delta = cur - lastTime;
    if (delta > 0 && delta <= 1.5 * playbackSpeed) {
      accumulatedWatchTimeRef.current += delta;
      const newWatched = dur > 0 ? Math.min(dur, accumulatedWatchTimeRef.current) : accumulatedWatchTimeRef.current;
      setWatchedTime(newWatched);

      try {
        const watchedKey = `ingage_watched_sec_${courseId}_${activeLesson.id}`;
        localStorage.setItem(watchedKey, String(newWatched));
      } catch { }
    }
    lastPlaybackTimeRef.current = cur;

    // Automatic completion at 90% threshold
    if (!isCurrentCompleted && dur > 0) {
      const completionPercent = (cur / dur) * 100;
      if (completionPercent >= 90) {
        handleMarkComplete(false, {
          watchDuration: accumulatedWatchTimeRef.current,
          duration: dur,
        });
      }
    }
  };

  // Mark lesson complete
  const handleMarkComplete = async (manualClick = false, verificationPayload?: any) => {
    if (!activeLesson) return;

    if (activeLesson.lessonType === 'VIDEO' && !verificationPayload && !isCurrentCompleted) {
      const dur = videoRef.current?.duration || duration || 0;
      const cur = videoRef.current?.currentTime || currentTime || 0;
      const percent = dur > 0 ? (cur / dur) * 100 : 0;
      if (percent < 85 && manualClick) {
        if (onShowToast) onShowToast('Please watch at least 90% of the video to complete this lesson.', 'info');
        return;
      }
    }

    if (isSubmittingCompletion) return;
    setIsSubmittingCompletion(true);

    try {
      await markLessonComplete(activeLesson.id, {
        courseId: Number(courseId),
        lessonProgress: 100,
        currentTime: verificationPayload?.currentTime || currentTime,
        watchDurationSeconds: verificationPayload?.watchDuration || currentTime,
        duration: verificationPayload?.duration || duration,
      });

      const updated = Array.from(new Set([...completedLessonIds, activeLesson.id]));
      setCompletedLessonIds(updated);
      dispatch(setReduxCompletedLessonIds(updated));

      if (onShowToast) onShowToast(`"${activeLesson.title}" marked as completed! ✓`, 'success');

      // Auto countdown cleared - completion animation finishes first
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setAutoNextCountdown(null);
    } catch (err: any) {
      console.error('Completion error:', err);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Natural video end handler
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsVideoEnded(true);
    const dur = videoRef.current?.duration || duration || 0;
    if (activeLesson) {
      // Trigger confetti celebration once per lesson completion when video reaches actual end
      if (!celebratedLessonIdsRef.current.has(activeLesson.id)) {
        celebratedLessonIdsRef.current.add(activeLesson.id);
        const isCourseComplete = currentIndex >= allLessons.length - 1;
        triggerLessonCompletionCelebration(isCourseComplete);
      }

      handleMarkComplete(false, {
        watchDuration: dur,
        duration: dur,
        currentTime: dur,
      });
    }
  };

  // Reusable unified completion and advance function across all lesson types
  const handleCompleteAndAdvance = async () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsVideoEnded(false);

    // 1. Mark current lesson complete idempotently
    if (activeLesson) {
      const dur = videoRef.current?.duration || duration || 0;
      const cur = videoRef.current?.currentTime || currentTime || 0;
      await handleMarkComplete(true, {
        watchDuration: dur || cur,
        duration: dur,
        currentTime: cur,
      });
    }

    // 2. Advance to next lesson in curriculum if available
    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
      if (nextLesson.sectionId) {
        setExpandedSections((prev) => ({
          ...prev,
          [nextLesson.sectionId]: true,
        }));
      }
    } else {
      // All curriculum completed!
      setIsVideoEnded(true);
      if (onShowToast) {
        onShowToast('🎉 Congratulations! You have completed all lessons in this course!', 'success');
      }
    }
  };

  // Next / Previous navigation across all curriculum items
  const handleNextLesson = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
      if (nextLesson.sectionId) {
        setExpandedSections((prev) => ({
          ...prev,
          [nextLesson.sectionId]: true,
        }));
      }
    }
  };

  const handlePrevLesson = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    if (prevLesson) {
      handleSelectLesson(prevLesson.id);
    }
  };

  const handleSelectLesson = (lessonId: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsMobileCurriculumOpen(false);

    const target = allLessons.find((l) => l.id === lessonId);
    if (!target) return;

    setActiveLessonId(lessonId);
    dispatch(setReduxActiveLessonId(lessonId));

    if (!isLessonMatchingTab(target.lessonType, activeTab)) {
      const type = (target.lessonType || 'VIDEO').toUpperCase();
      if (type === 'QUIZ') setActiveTab('quizzes');
      else if (type === 'PROJECT' || type === 'ASSIGNMENT') setActiveTab('projects');
      else if (type === 'LIVE_CLASS') setActiveTab('live');
      else setActiveTab('videos');
    }

    if (target.lessonType === 'VIDEO') {
      setCurrentTime(0);
      setDuration(0);
      setIsVideoEnded(false);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }
      }, 150);
    }
  };

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isVideoEnded) {
      setIsVideoEnded(false);
      videoRef.current.currentTime = 0;
    }
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback request interrupted:', err);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = Number(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleRewind = (sec = 10) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - sec);
  };

  const handleForward = (sec = 10) => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || duration || 0;
    videoRef.current.currentTime = Math.min(dur, videoRef.current.currentTime + sec);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
    try {
      localStorage.setItem('ingage_video_muted', String(next));
    } catch { }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const muted = val === 0;
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = muted;
    }
    try {
      localStorage.setItem('ingage_video_volume', String(val));
      localStorage.setItem('ingage_video_muted', String(muted));
    } catch { }
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    try {
      localStorage.setItem('ingage_video_speed', String(spd));
    } catch { }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    const el = videoContainerRef.current as any;
    if (!isFullscreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
      else if (doc.msExitFullscreen) doc.msExitFullscreen();
    }
  };

  // Toggle section collapse
  const toggleSection = (secId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Overall course stats
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonsCount > 0
    ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
    : 0;

  // Video curriculum specific stats (strictly video sections/lessons)
  const totalVideoCount = videoLessons.length;
  const completedVideoCount = videoLessons.filter((v) => completedLessonIds.includes(v.id)).length;
  const videoProgressPercent = totalVideoCount > 0
    ? Math.min(100, Math.round((completedVideoCount / totalVideoCount) * 100))
    : 0;
  const isVideoSectionCompleted = totalVideoCount > 0 && completedVideoCount >= totalVideoCount;

  const totalQuizzesCount = allLessons.filter((l) => l.lessonType === 'QUIZ').length;
  const totalProjectsCount = allLessons.filter((l) => {
    const t = (l.lessonType || '').toUpperCase();
    return t === 'PROJECT' || t === 'ASSIGNMENT';
  }).length;

  const liveLessonsCount = useMemo(() => {
    return allLessons.filter((l) => {
      const t = (l.lessonType || '').toUpperCase();
      return t === 'LIVE_CLASS' || t === 'LIVE';
    }).length;
  }, [allLessons]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserThunk()).unwrap();
    } catch { }
    dispatch(clearCredentials());
    onNavigate('/');
  };

  // Calculate current lesson watch progress percentage
  const currentLessonPercent = useMemo(() => {
    if (isCurrentCompleted) return 100;
    if (duration > 0) return Math.min(100, Math.round((currentTime / duration) * 100));
    return 0;
  }, [isCurrentCompleted, currentTime, duration]);

  return (
    <div className={embeddedInLayout ? "w-full text-slate-900 pb-12 flex flex-col space-y-6 select-text font-sans" : "w-full bg-[#f8fafc] min-h-screen text-slate-900 pb-20 flex flex-col select-text font-sans"}>
      {/* 1. TOP HEADER: Back button, Course Title, Dynamic Breadcrumb & Student Profile */}
      <StudentCourseHeader
        courseTitle={course?.title || content?.title || (courseId ? ("Course " + courseId) : "Course")}
        courseId={courseId}
        currentUser={authUser as any}
        onBack={() => onNavigate("/my-courses")}
        onToggleMobileSidebar={() => setIsMobileCurriculumOpen(!isMobileCurriculumOpen)}
        onLogout={handleLogout}
        embeddedInLayout={embeddedInLayout}
      />
      <div className={embeddedInLayout ? "w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden" : "w-full bg-white border-b border-slate-200/80 shadow-2xs"}>
        {/* 2. HORIZONTAL LEARNING NAVIGATION TABS */}
        <div className="w-full px-4 sm:px-6 lg:px-8 bg-white">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 max-w-7xl mx-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleTabChange('videos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'videos'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('quizzes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'quizzes'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quizzes</span>
              {totalQuizzesCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                  {totalQuizzesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'projects'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Projects</span>
              {totalProjectsCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                  {totalProjectsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('live')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'live'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Class</span>
              {liveLessonsCount > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${activeTab === 'live' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                  {liveLessonsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'reports' || activeTab === 'report'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <FileBarChart className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('payment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'payment'
                  ? 'bg-[#00A86B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment</span>
            </button>

            {/* Mobile toggle button for Course Curriculum */}
            <button
              type="button"
              onClick={() => setIsMobileCurriculumOpen(!isMobileCurriculumOpen)}
              className="lg:hidden ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer shrink-0"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Curriculum ({completedVideoCount}/{totalVideoCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className={embeddedInLayout ? "w-full flex-1 flex flex-col space-y-6" : "w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex-1 flex flex-col"}>
        {/* Loading Skeleton */}
        {loading && (
          <div className="w-full space-y-6 animate-pulse">
            <div className="aspect-video w-full max-w-4xl mx-auto bg-slate-200 rounded-3xl" />
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
          </div>
        )}

        {/* Error Screen */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-600" />
            <h3 className="font-bold text-slate-900">Unable to load this course</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadCourseData}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State when current tab has no lessons (Videos Only) */}
        {!loading && !error && activeTab === 'videos' && currentTabLessons.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs my-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Play className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No Videos Available
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              This course does not currently include any video lessons in its curriculum.
            </p>
          </div>
        )}

        {/* PRIMARY INTERFACE: 2-COLUMN VIEW WITH FILTERED SIDEBAR (Videos Only) */}
        {!loading && !error && activeTab === 'videos' && currentTabLessons.length > 0 && activeLesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols (70-75%): Player, Controls, and Lesson Content */}
            <div ref={lessonContentRef} className="lg:col-span-8 space-y-6">

              {/* Free Preview Banner when user is not enrolled (Videos only) */}
              {activeTab === 'videos' && activeLesson.freePreview && !isUserEnrolled && (
                <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-green-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      <strong>Free Preview Lesson:</strong> You are viewing an unlocked preview lesson. Enroll in this course to access all modules and certifications.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/courses/${courseId}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Buy / Enroll Now
                  </button>
                </div>
              )}

              {/* 1. MAIN MEDIA PLAYER CONTAINER (Videos Tab) */}
              {activeTab === 'videos' && (
                <div
                  ref={videoContainerRef}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative bg-black overflow-hidden group select-none"
                >
                  {isLockedForUser ? (
                    <div className="w-full aspect-video bg-black flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5 max-w-md">
                        <h4 className="text-white font-bold text-base sm:text-lg">
                          Protected Video Content
                        </h4>
                        <p className="text-slate-400 text-xs sm:text-sm">
                          This video lesson requires an active course enrollment. Please enroll to unlock all curriculum modules and certifications.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/courses/${courseId}`)}
                        className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        Enroll to Unlock All Lessons
                      </button>
                    </div>
                  ) : isYouTubeVideo ? (
                    /* YouTube Player Embed */
                    <div className="w-full aspect-video bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
                        title={activeLesson.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    /* Custom HTML5 Video Player with Controls */
                    <>
                      <video
                        ref={videoRef}
                        src={videoStreamUrl}
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture={false}
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnded}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onLoadStart={() => setIsVideoLoading(true)}
                        onLoadedData={() => {
                          setIsVideoLoading(false);
                          setIsVideoBuffering(false);
                        }}
                        onWaiting={() => setIsVideoBuffering(true)}
                        onPlaying={() => {
                          setIsVideoLoading(false);
                          setIsVideoBuffering(false);
                        }}
                        onError={() => {
                          setIsVideoLoading(false);
                          setIsVideoBuffering(false);
                          setVideoError('Unable to play this video. Please check your connection or try again.');
                        }}
                        className="w-full aspect-video object-contain bg-black cursor-pointer"
                        onClick={togglePlay}
                      />

                      {/* Video Loading Indicator */}
                      {isVideoLoading && !videoError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 pointer-events-none">
                          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                        </div>
                      )}

                      {/* Error Overlay */}
                      {videoError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 text-center z-30 space-y-3">
                          <AlertCircle className="w-10 h-10 text-rose-500" />
                          <h4 className="text-white font-bold text-sm">Unable to play this video</h4>
                          <p className="text-slate-400 text-xs max-w-sm">{videoError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoError(null);
                              setIsVideoLoading(true);
                              if (videoRef.current) {
                                videoRef.current.load();
                                videoRef.current.play().catch(() => { });
                              }
                            }}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Center Play Button Overlay - solid blue circular button with white triangle (▶) */}
                      {!isPlaying && !isVideoEnded && !videoError && !isVideoLoading && (
                        <div
                          onClick={togglePlay}
                          className="absolute inset-0 flex items-center justify-center z-25 cursor-pointer bg-black/15 transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlay();
                            }}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center shadow-xl shadow-blue-900/30 transition-transform transform hover:scale-105 active:scale-95 cursor-pointer"
                            title="Play Video"
                          >
                            <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white text-white translate-x-0.5" />
                          </button>
                        </div>
                      )}

                      {/* Video Finished Center Overlay - Clean White / Soft Mint Modern Design matching Reference Image 3 */}
                      {isVideoEnded && (
                        <div className="absolute inset-0 bg-white/95 sm:bg-white flex flex-col items-center justify-center p-6 text-center z-30 overflow-hidden animate-in fade-in duration-300">
                          {/* Soft subtle green gradient backdrop overlay */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-50/70 via-white to-emerald-50/30 pointer-events-none" />

                          {/* Floating Confetti / Particles - subtle green/mint particles matching Reference Image 3 */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-[28%] left-[32%] w-2 h-2 rounded-xs rotate-12 bg-emerald-400/80 animate-pulse" />
                            <div className="absolute top-[36%] left-[29%] w-2.5 h-2.5 rounded-full bg-emerald-300/80 animate-bounce delay-100" />
                            <div className="absolute top-[24%] left-[42%] w-1.5 h-1.5 rounded-xs rotate-45 bg-teal-400/70" />
                            <div className="absolute top-[28%] right-[32%] w-2.5 h-2.5 rounded-xs rotate-45 bg-emerald-400/80 animate-pulse delay-150" />
                            <div className="absolute top-[34%] right-[29%] w-2 h-2 rounded-full bg-emerald-300/80 animate-bounce delay-200" />
                            <div className="absolute top-[24%] right-[42%] w-1.5 h-1.5 rounded-xs rotate-12 bg-green-500/70" />
                            <div className="absolute bottom-[44%] left-[34%] w-2 h-2 rounded-full bg-emerald-400/60" />
                            <div className="absolute bottom-[42%] right-[34%] w-2 h-2 rounded-xs rotate-12 bg-teal-400/60" />
                          </div>

                          {/* Center Card Content */}
                          <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                            {/* Large Green Circular Checkmark */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-in zoom-in-75 duration-500">
                              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[3.5]" />
                            </div>

                            {/* Completion Heading */}
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 sm:mt-5 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                              {currentIndex >= allLessons.length - 1 ? '🎉 Congratulations! Course Completed!' : '🎉 Congratulations! Lesson Completed!'}
                            </h3>

                            {/* Lesson Status Badge */}
                            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Status: Completed</span>
                            </div>

                            {/* Completion Subtitle */}
                            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                              {currentIndex >= allLessons.length - 1
                                ? 'You have successfully completed all lessons in this course.'
                                : `You have successfully completed "${activeLesson?.title || 'this lesson'}".`}
                            </p>

                            {/* Action Buttons: Play Again & Replay Lesson (and Next Lesson / Back to Course) */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-7 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
                              {/* Play Again (Primary Green Button) */}
                              <button
                                type="button"
                                onClick={handleStartFromBeginning}
                                className="px-6 sm:px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>Play Again</span>
                              </button>

                              {/* Replay Lesson (Secondary White Button) */}
                              <button
                                type="button"
                                onClick={handleStartFromBeginning}
                                className="px-5 sm:px-6 py-3 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 rounded-full font-semibold text-xs sm:text-sm shadow-2xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Replay Lesson</span>
                              </button>

                              {/* Next Lesson or Back to Course */}
                              {currentIndex < allLessons.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={handleCompleteAndAdvance}
                                  className="px-5 sm:px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <span>Next Lesson</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('reports')}
                                  className="px-5 sm:px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                  <Award className="w-4 h-4 text-amber-400" />
                                  <span>Back to Course</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Control Bar Overlay - Minimal, Clean & Professional */}
                      {!videoError && (
                        <div
                          className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 space-y-2.5 transition-opacity duration-200 z-35 ${isVideoEnded || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                            }`}
                        >
                          {/* Progress Scrubber */}
                          <div className="relative w-full h-1.5 hover:h-2.5 transition-all group/progress cursor-pointer flex items-center">
                            <input
                              type="range"
                              min={0}
                              max={duration || 100}
                              value={isVideoEnded ? duration : currentTime}
                              onChange={handleSeek}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                                style={{ width: `${isVideoEnded ? 100 : (duration > 0 ? (currentTime / duration) * 100 : 0)}%` }}
                              />
                            </div>
                          </div>

                          {/* Control Buttons & Indicators */}
                          <div className="flex items-center justify-between text-white text-xs gap-3">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                              <button
                                type="button"
                                onClick={togglePlay}
                                className="p-1 text-white hover:text-emerald-400 transition cursor-pointer"
                                title={isPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                              </button>

                              {/* Volume Controls */}
                              <div className="flex items-center gap-1.5 group/vol">
                                <button
                                  type="button"
                                  onClick={toggleMute}
                                  className="p-1 text-white/80 hover:text-white transition cursor-pointer"
                                  title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                  {isMuted || volume === 0 ? (
                                    <VolumeX className="w-4 h-4 text-rose-400" />
                                  ) : volume < 0.5 ? (
                                    <Volume1 className="w-4 h-4" />
                                  ) : (
                                    <Volume2 className="w-4 h-4" />
                                  )}
                                </button>
                                <input
                                  type="range"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={isMuted ? 0 : volume}
                                  onChange={handleVolumeChange}
                                  className="w-14 sm:w-20 h-1 accent-emerald-500 bg-white/30 rounded cursor-pointer"
                                />
                              </div>

                              {/* Current / Duration Timer */}
                              <span className="font-mono text-[11px] text-white/90">
                                {formatDurationMMSS(isVideoEnded ? duration : currentTime)} / {formatDurationMMSS(duration)}
                              </span>
                            </div>

                            {/* Right: Settings, Fullscreen */}
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => { }}
                                className="p-1 text-white/80 hover:text-white transition cursor-pointer"
                                title="Settings"
                              >
                                <Settings className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="p-1 text-white/80 hover:text-white transition cursor-pointer"
                                title="Toggle Fullscreen"
                              >
                                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}


              {/* 5. PREVIOUS / NEXT NAVIGATION CONTROLS */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                {/* Previous Lesson Button */}
                <button
                  type="button"
                  onClick={handlePrevLesson}
                  disabled={!prevLesson}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Lesson</span>
                </button>

                {/* Lesson Watch Progress Indicator in center */}
                <div className="flex items-center gap-3">
                  <div className="w-28 sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    {isCurrentCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    <span>{completedLessonsCount} / {totalLessonsCount} Lessons Completed</span>
                  </div>
                </div>

                {/* Next Lesson Button */}
                <button
                  type="button"
                  onClick={handleCompleteAndAdvance}
                  disabled={!nextLesson}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#008F5B] text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Lesson Overview & Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {activeSection ? activeSection.title : `Module ${activeSectionIdx + 1}`}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {activeLesson.title}
                    </h2>
                  </div>

                  {!isCurrentCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(true)}
                      disabled={isSubmittingCompletion}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                    >
                      {isSubmittingCompletion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Mark as Complete</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  )}
                </div>

                {activeLesson.description && (
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {activeLesson.description}
                  </div>
                )}
              </div>

              {/* Auto Next Countdown Banner */}
              {autoNextCountdown !== null && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between text-xs text-green-900 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Lesson finished! Advancing to next lesson in <strong>{autoNextCountdown}s</strong>...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompleteAndAdvance}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    Continue to Next Lesson
                  </button>
                </div>
              )}

            </div>

            {/* Right Side (35%): Course Content Sidebar matching Reference Image 2 */}
            <aside
              className={`lg:col-span-4 space-y-5 lg:sticky lg:top-24 ${isMobileCurriculumOpen ? 'fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 p-4 flex flex-col justify-end' : ''
                }`}
            >
              <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Curriculum Header & Course Progress */}
                <div className="space-y-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <span>Course Content</span>
                    </h3>
                    {isMobileCurriculumOpen && (
                      <button
                        type="button"
                        onClick={() => setIsMobileCurriculumOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Course Progress Card */}
                  <div className="p-4 bg-emerald-50/30 border border-emerald-100/70 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 font-semibold">Course Progress</span>
                      <span className="text-emerald-600 font-extrabold text-sm">{overallProgressPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${overallProgressPercent}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium text-right">
                      {completedLessonsCount} / {totalLessonsCount} Lessons Completed
                    </div>
                  </div>
                </div>

                {/* Course Sections Accordion */}
                <div className="space-y-3">
                  {filteredSections.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                      No video lessons available for this course.
                    </div>
                  ) : (
                    filteredSections.map((section: any, secIdx: number) => {
                      const isExpanded = expandedSections[section.id] !== false;
                      let secSeconds = 0;
                      section.lessons?.forEach((l: any) => {
                        secSeconds += parseDurationToSeconds(l.duration, l.durationSeconds || l.duration_seconds);
                      });
                      const secDurationHuman = secSeconds > 0 ? formatDurationHuman(secSeconds) : '';
                      const secLessonsCount = section.lessons?.length || 0;
                      const secCompletedCount = section.lessons?.filter((l: any) => completedLessonIds.includes(l.id)).length || 0;

                      // Content-type specific item label
                      const itemLabel = secLessonsCount === 1 ? '1 Video' : `${secLessonsCount} Videos`;

                      return (
                        <div
                          key={section.id}
                          className={`border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-emerald-200/80 bg-white shadow-2xs' : 'border-slate-200/80 bg-white'
                            }`}
                        >
                          {/* Section Accordion Header */}
                          <button
                            type="button"
                            onClick={() => toggleSection(section.id)}
                            className={`w-full p-4 flex items-center justify-between text-left transition cursor-pointer ${isExpanded ? 'bg-emerald-50/70 hover:bg-emerald-50/90' : 'bg-slate-50/60 hover:bg-slate-100/80'
                              }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 pr-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                {secIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {section.title?.toLowerCase().startsWith('section') || section.title?.toLowerCase().startsWith('module')
                                    ? section.title
                                    : `Module ${secIdx + 1}: ${section.title}`}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1 font-medium">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-slate-400" />
                                    <span>{itemLabel}</span>
                                  </span>
                                  {secDurationHuman && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>{secDurationHuman}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                    <span>{secCompletedCount}/{secLessonsCount}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                          </button>

                          {/* Lessons List Inside Section */}
                          {isExpanded && (
                            <div className="p-2 space-y-1 bg-white">
                              {section.lessons?.map((lesson: any, lesIdx: number) => {
                                const isCurrent = lesson.id === activeLesson?.id;
                                const isDone = completedLessonIds.includes(lesson.id);
                                const type = (lesson.lessonType || 'VIDEO').toUpperCase();
                                const durStr = lesson.duration || (lesson.durationSeconds ? formatDurationMMSS(lesson.durationSeconds) : '');

                                return (
                                  <button
                                    key={lesson.id}
                                    type="button"
                                    onClick={() => handleSelectLesson(lesson.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${isCurrent
                                        ? 'bg-emerald-50/80 border border-emerald-300 shadow-2xs font-semibold'
                                        : isDone
                                          ? 'hover:bg-slate-50 text-slate-800'
                                          : 'hover:bg-slate-50 text-slate-700'
                                      }`}
                                  >
                                    {/* Left: Play Icon & Lesson Title */}
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {type === 'VIDEO' ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                                        </div>
                                      ) : type === 'QUIZ' ? (
                                        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <HelpCircle className="w-3 h-3" />
                                        </div>
                                      ) : type === 'PROJECT' || type === 'ASSIGNMENT' ? (
                                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <FolderArchive className="w-3 h-3" />
                                        </div>
                                      ) : type === 'LIVE_CLASS' ? (
                                        <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <Radio className="w-3 h-3" />
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                          <BookOpen className="w-3 h-3" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-xs truncate ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                          {type === 'QUIZ'
                                            ? `Quiz: ${lesson.title}`
                                            : type === 'PROJECT' || type === 'ASSIGNMENT'
                                              ? `Project: ${lesson.title}`
                                              : type === 'LIVE_CLASS'
                                                ? `Live: ${lesson.title}`
                                                : lesson.title?.toLowerCase().startsWith('lesson')
                                                  ? lesson.title
                                                  : `Lesson ${lesIdx + 1}: ${lesson.title}`}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right: Duration & Done Checkmark */}
                                    <div className="flex items-center gap-2 shrink-0 text-right">
                                      {durStr ? (
                                        <span className="text-[11px] font-mono text-slate-400">
                                          {durStr}
                                        </span>
                                      ) : type !== 'VIDEO' ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                          {type === 'LIVE_CLASS' ? 'LIVE' : type}
                                        </span>
                                      ) : null}

                                      {isDone && (
                                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* TAB VIEW 2: QUIZZES DASHBOARD (Bootcamp List & Summary Metrics matching Reference Image 2) */}
        {!loading && !error && activeTab === 'quizzes' && (
          <div className="w-full">
            <StudentQuizView
              courseId={course?.id || courseId}
              quizzes={allLessons.filter((l) => (l.lessonType || '').toUpperCase() === 'QUIZ')}
              completedLessonIds={completedLessonIds}
              onCompleteQuiz={async (quizLessonId) => {
                const targetId = Number(quizLessonId);
                if (targetId) {
                  try {
                    await markLessonComplete(targetId, {
                      courseId: Number(courseId),
                      lessonProgress: 100,
                    });
                  } catch (e) {
                    console.warn('Failed to mark quiz complete on server:', e);
                  }
                  const updated = Array.from(new Set([...completedLessonIds, targetId]));
                  setCompletedLessonIds(updated);
                  dispatch(setReduxCompletedLessonIds(updated));
                }
              }}
            />
          </div>
        )}

        {/* TAB VIEW 3: PROJECTS & CAPSTONES DASHBOARD (Bootcamp List & Summary Metrics matching Reference Image 2) */}
        {!loading && !error && activeTab === 'projects' && (
          <div className="w-full">
            <StudentProjectView
              projects={allLessons.filter(
                (l) =>
                  (l.lessonType || '').toUpperCase() === 'PROJECT' ||
                  (l.lessonType || '').toUpperCase() === 'ASSIGNMENT'
              )}
              completedLessonIds={completedLessonIds}
              onCompleteProject={async (projectLessonId?: any) => {
                const targetId = Number(projectLessonId);
                if (targetId) {
                  try {
                    await markLessonComplete(targetId, {
                      courseId: Number(courseId),
                      lessonProgress: 100,
                    });
                  } catch (e) {}
                  const updated = Array.from(new Set([...completedLessonIds, targetId]));
                  setCompletedLessonIds(updated);
                  dispatch(setReduxCompletedLessonIds(updated));
                } else {
                  await handleMarkComplete(true);
                }
              }}
              courseId={course?.id || courseId}
              onViewProjectReport={() => setActiveTab('project-report')}
            />
          </div>
        )}

        {/* TAB VIEW 4: LIVE CLASS CONTENT INTERFACE (Full Width without Course Content sidebar) */}
        {!loading && !error && activeTab === 'live' && (
          <div className="w-full">
            {currentTabLessons.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs my-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto text-rose-600 mb-4">
                  <Radio className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  No Live Classes Available
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  This course does not currently include any live sessions in its curriculum.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 overflow-hidden">
                <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0">
                      <Radio className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{activeLesson?.title || 'Live Interactive Session'}</h3>
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Live Interactive Session
                      </span>
                    </div>
                  </div>
                </div>
                <StudentLiveClassesView
                  key={activeLesson?.id || 'live-classes'}
                  liveClasses={currentTabLessons}
                  courseId={courseId}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB VIEW: PROJECT REPORT & CERTIFICATION */}
        {!loading && !error && activeTab === 'project-report' && (
          <StudentProjectReportView
            courseId={course?.id || courseId}
            courseTitle={course?.title || 'Course'}
            onNavigate={onNavigate}
            onBackToCourse={() => setActiveTab('videos')}
          />
        )}

        {/* TAB VIEW 5: REPORTS & LEARNING ANALYTICS */}
        {!loading && !error && (activeTab === 'reports' || activeTab === 'report') && (
          <LearningAnalyticsReportView
            courseTitle={course?.title || 'Course'}
            courseCategory={course?.category || 'Development'}
            courseId={courseId}
            user={authUser}
            sections={content?.sections || []}
            completedLessonIds={completedLessonIds}
            progressPercent={progressPercent}
            videoProgressPercent={videoProgressPercent}
            onOpenCertificateModal={() => setIsCertModalOpen(true)}
            onContinueLearning={() => setActiveTab('videos')}
            onSelectLesson={(lessonId) => handleSelectLesson(lessonId)}
          />
        )}

        {/* TAB VIEW 6: PAYMENT & ENROLLMENT RECEIPT */}
        {!loading && !error && activeTab === 'payment' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Course Access &amp; Enrollment Receipt</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Verified records of your course purchase and lifetime enrollment rights.</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 max-w-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Access Status</span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                  {isAdmin ? 'Administrator Preview (All Lessons Unlocked)' : isUserEnrolled ? 'Active Lifetime Access' : 'Guest / Free Preview'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Course Plan</span>
                <span className="text-xs font-bold text-slate-900">{course?.title || 'Professional Certification'}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Student Account</span>
                <span className="text-xs font-bold text-slate-900">{authUser?.email || 'Learner'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Verified Certificate</span>
                <span className="text-xs font-bold text-green-700">Included</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Modal View */}
      {isCertModalOpen && (
        <CertificateViewModal
          isOpen={isCertModalOpen}
          certificate={courseCertificate}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}
    </div>
  );
}

export default CourseLearnPage;
