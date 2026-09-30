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
  Upload
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

interface CourseLearnPageProps {
  courseId: number | string;
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
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

type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export function CourseLearnPage({ courseId, onNavigate, onShowToast }: CourseLearnPageProps) {
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
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);

  // Navigation Tabs: Videos (default), Quizzes, Projects, Live Class, Reports, Payment
  const [activeTab, setActiveTab] = useState<'videos' | 'quizzes' | 'projects' | 'live' | 'reports' | 'payment'>('videos');

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

  // Dynamic security watermark state
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>('top-right');

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

  // Dynamic watermark repositioning
  useEffect(() => {
    const positions: WatermarkPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
    const interval = setInterval(() => {
      setWatermarkPos((prev) => {
        const available = positions.filter((p) => p !== prev);
        return available[Math.floor(Math.random() * available.length)];
      });
    }, 25000);
    return () => clearInterval(interval);
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
        const firstUncompleted = all.find((l) => !merged.includes(l.id));
        const initial = firstUncompleted || all[0];
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
        locked: Boolean(lesson.locked),
        freePreview: Boolean(lesson.freePreview),
        contentUrl: (lesson as any).contentUrl || (lesson as any).videoUrl || (lesson as any).content_url || null,
        videoUrl: (lesson as any).videoUrl || (lesson as any).contentUrl || (lesson as any).content_url || null,
        videoKey: (lesson as any).videoKey || (lesson as any).youtubeVideoId || null,
      }))
    );
  }, [content, completedLessonIds]);

  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = allLessons[currentIndex] || allLessons[0] || null;

  // Active section index & title for dynamic breadcrumb
  const activeSectionIdx = useMemo(() => {
    if (!content?.sections || !activeLesson) return 0;
    const idx = content.sections.findIndex((s) => s.id === activeLesson.sectionId);
    return idx >= 0 ? idx : 0;
  }, [content?.sections, activeLesson]);

  const activeSection = content?.sections?.[activeSectionIdx] || null;

  const isUserEnrolled = Boolean(content?.isEnrolled || enrollmentStatus?.enrolled || enrollmentStatus?.courseAccess);
  const canPlayActiveLesson = Boolean(activeLesson && (isUserEnrolled || activeLesson.freePreview));
  const isLockedForUser = Boolean(activeLesson && !canPlayActiveLesson);

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
        if (posNum > 15 && !completedLessonIds.includes(activeLesson.id)) {
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
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    setResumePromptTime(null);
  };

  const handleStartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    try {
      if (activeLesson) {
        localStorage.removeItem(`ingage_video_pos_${courseId}_${activeLesson.id}`);
      }
    } catch {}
    setResumePromptTime(null);
  };

  // Video time update & progress calculation
  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeLesson) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    // Save playback position locally for immediate resume
    try {
      const posKey = `ingage_video_pos_${courseId}_${activeLesson.id}`;
      localStorage.setItem(posKey, String(cur));
    } catch {}

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
      } catch {}
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
        lessonProgress: 100,
        currentTime: verificationPayload?.currentTime || currentTime,
        watchDurationSeconds: verificationPayload?.watchDuration || currentTime,
        duration: verificationPayload?.duration || duration,
      });

      const updated = Array.from(new Set([...completedLessonIds, activeLesson.id]));
      setCompletedLessonIds(updated);
      dispatch(setReduxCompletedLessonIds(updated));

      if (onShowToast) onShowToast(`"${activeLesson.title}" marked as completed! ✓`, 'success');

      // Auto next countdown
      if (currentIndex < allLessons.length - 1) {
        setAutoNextCountdown(5);
        countdownTimerRef.current = setInterval(() => {
          setAutoNextCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownTimerRef.current!);
              countdownTimerRef.current = null;
              handleNextLesson();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error('Completion error:', err);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Next / Previous navigation
  const handleNextLesson = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      setActiveLessonId(next.id);
      dispatch(setReduxActiveLessonId(next.id));
    }
  };

  const handlePrevLesson = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      setActiveLessonId(prev.id);
      dispatch(setReduxActiveLessonId(prev.id));
    }
  };

  const handleSelectLesson = (lessonId: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    setIsMobileCurriculumOpen(false);

    const targetIdx = allLessons.findIndex((l) => l.id === lessonId);
    if (targetIdx === -1) return;

    setActiveLessonId(lessonId);
    dispatch(setReduxActiveLessonId(lessonId));
  };

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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
    } catch {}
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
    } catch {}
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    try {
      localStorage.setItem('ingage_video_speed', String(spd));
    } catch {}
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

  // Counts & stats
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonsCount > 0
    ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
    : 0;

  const totalQuizzesCount = allLessons.filter((l) => l.lessonType === 'QUIZ').length;
  const totalProjectsCount = allLessons.filter((l) => l.lessonType === 'ASSIGNMENT').length;

  const watermarkName = authUser?.name || 'Verified Learner';
  const watermarkEmail = authUser?.email || '';

  // Calculate current lesson watch progress percentage
  const currentLessonPercent = useMemo(() => {
    if (isCurrentCompleted) return 100;
    if (duration > 0) return Math.min(100, Math.round((currentTime / duration) * 100));
    return 0;
  }, [isCurrentCompleted, currentTime, duration]);

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen text-slate-900 pb-20 flex flex-col select-text font-sans">
      {/* 1. TOP HEADER: Back button, Course Title, Dynamic Breadcrumb & Student Profile */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Back Arrow, Course Title, Dynamic Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate(`/courses/${courseId}`)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Back to Course Details"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {course?.title || content?.title || 'Course Learning'}
              </h1>
              {activeLesson && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                  <span className="text-green-700 font-semibold truncate">
                    Module {activeSectionIdx + 1}: {activeSection?.title || activeLesson.sectionTitle}
                  </span>
                  <span>&gt;</span>
                  <span className="text-slate-700 font-medium truncate">{activeLesson.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Authenticated Student Profile & Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-600 to-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {authUser?.name || 'Verified Learner'}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {authUser?.role || 'Learner'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{authUser?.name || 'Student'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{authUser?.email || ''}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('/my-learning');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Learning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('/certificates');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Certificates</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      dispatch(logoutUserThunk());
                      onNavigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. HORIZONTAL LEARNING NAVIGATION TABS */}
        <div className="w-full px-4 sm:px-6 lg:px-8 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 max-w-7xl mx-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'quizzes'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quizzes</span>
              {totalQuizzesCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'quizzes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {totalQuizzesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Projects</span>
              {totalProjectsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {totalProjectsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'live'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Class</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileBarChart className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'payment'
                  ? 'bg-green-600 text-white shadow-xs'
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
              <span>Curriculum ({completedCount}/{totalLessonsCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex-1 flex flex-col">
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

        {/* TAB VIEW 1: VIDEOS / LEARNING PLAYER (Default Primary Interface) */}
        {!loading && !error && activeTab === 'videos' && activeLesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols (70-75%): Player, Controls, and Lesson Content */}
            <div ref={lessonContentRef} className="lg:col-span-8 space-y-6">
              {/* Resume Video Prompt Banner */}
              {resumePromptTime && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Resume from <strong>{formatDurationMMSS(resumePromptTime)}</strong>?
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResumePlayback}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={handleStartFromBeginning}
                      className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs transition cursor-pointer"
                    >
                      Start from beginning
                    </button>
                  </div>
                </div>
              )}

              {/* Free Preview Banner when user is not enrolled */}
              {activeLesson.freePreview && !isUserEnrolled && (
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

              {/* MAIN MEDIA PLAYER CONTAINER */}
              {activeLesson.lessonType === 'VIDEO' && (
                <div
                  ref={videoContainerRef}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative bg-black rounded-3xl overflow-hidden shadow-xl border border-slate-900 group select-none"
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
                                videoRef.current.play().catch(() => {});
                              }
                            }}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                      {/* Security Watermark */}
                      {!videoError && (
                        <div
                          className={`absolute pointer-events-none select-none transition-all duration-1000 ease-in-out z-20 ${
                            watermarkPos === 'top-left' ? 'top-4 left-4' :
                            watermarkPos === 'top-right' ? 'top-4 right-4' :
                            watermarkPos === 'bottom-left' ? 'bottom-16 left-4' :
                            watermarkPos === 'bottom-right' ? 'bottom-16 right-4' :
                            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-medium text-white/35 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                            {watermarkName} {watermarkEmail ? `(${watermarkEmail})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Custom Control Bar Overlay */}
                      {!videoError && (
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 space-y-2.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-30">
                          {/* Progress Scrubber */}
                          <div className="relative w-full h-1.5 hover:h-2.5 transition-all group/progress cursor-pointer flex items-center">
                            <input
                              type="range"
                              min={0}
                              max={duration || 100}
                              value={currentTime}
                              onChange={handleSeek}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all duration-100"
                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Control Buttons & Indicators */}
                          <div className="flex items-center justify-between text-white text-xs gap-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={togglePlay}
                                className="p-1 text-white hover:text-green-400 transition cursor-pointer"
                                title={isPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRewind(10)}
                                className="p-1 text-white/80 hover:text-white transition cursor-pointer hidden sm:block"
                                title="Rewind 10 seconds"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleForward(10)}
                                className="p-1 text-white/80 hover:text-white transition cursor-pointer hidden sm:block"
                                title="Forward 10 seconds"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
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
                                  className="w-14 sm:w-20 h-1 accent-green-500 bg-white/30 rounded cursor-pointer"
                                />
                              </div>

                              {/* Current / Duration Timer */}
                              <span className="font-mono text-[11px] text-white/90">
                                {formatDurationMMSS(currentTime)} / {formatDurationMMSS(duration)}
                              </span>
                            </div>

                            {/* Right: Speed, PiP, Fullscreen */}
                            <div className="flex items-center gap-2">
                              {/* Playback Speed selector */}
                              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 text-[11px]">
                                {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                  <button
                                    key={spd}
                                    type="button"
                                    onClick={() => handleSpeedChange(spd)}
                                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                                      playbackSpeed === spd ? 'bg-green-600 font-bold text-white' : 'text-white/70 hover:text-white'
                                    }`}
                                  >
                                    {spd}x
                                  </button>
                                ))}
                              </div>

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

              {/* QUIZ LESSON VIEW */}
              {activeLesson.lessonType === 'QUIZ' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <HelpCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Module Quiz Assessment</h3>
                        <p className="text-xs text-slate-500">Test your mastery of core concepts to unlock subsequent lessons.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-bold text-xs border border-purple-200">
                      Passing Score: 70%
                    </span>
                  </div>

                  {quizLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      <span className="text-xs">Loading assessment questions...</span>
                    </div>
                  ) : quizQuestions.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        <span>{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}% Complete</span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {quizQuestions[currentQuestionIndex].questionText || (quizQuestions[currentQuestionIndex] as any).question}
                        </h4>

                        <div className="space-y-2">
                          {quizQuestions[currentQuestionIndex].options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setSelectedOption(optIdx)}
                              className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-3 ${
                                selectedOption === optIdx
                                  ? 'bg-purple-50 border-purple-600 text-purple-900 font-semibold'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                selectedOption === optIdx ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quiz Navigation Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQuestionIndex > 0) {
                              setCurrentQuestionIndex(currentQuestionIndex - 1);
                              setSelectedOption(null);
                            }
                          }}
                          disabled={currentQuestionIndex === 0}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          Previous Question
                        </button>

                        {currentQuestionIndex < quizQuestions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentQuestionIndex(currentQuestionIndex + 1);
                              setSelectedOption(null);
                            }}
                            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              if (selectedOption === null) return;
                              setQuizSubmitting(true);
                              try {
                                const res = await submitQuizAnswer(Number(course?.id || courseId) || 0, activeLesson.id, {
                                  questionId: quizQuestions[currentQuestionIndex].id,
                                  selectedOptionIndex: selectedOption,
                                });
                                setQuizResult(res);
                                if (res.correct || res.quizCompleted) {
                                  handleMarkComplete(true);
                                }
                              } catch (err: any) {
                                setQuizError('Failed to submit answer.');
                              } finally {
                                setQuizSubmitting(false);
                              }
                            }}
                            disabled={quizSubmitting || selectedOption === null}
                            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {quizSubmitting ? 'Evaluating...' : 'Submit Assessment'}
                          </button>
                        )}
                      </div>

                      {quizResult && (
                        <div className={`p-4 rounded-2xl border ${
                          quizResult.correct ? 'bg-green-50 border-green-200 text-green-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <h5 className="font-bold text-sm">{quizResult.correct ? 'Congratulations! Correct Answer ✓' : 'Assessment Result'}</h5>
                          <p className="text-xs mt-1">{quizResult.explanation || (quizResult.correct ? 'Great job! Lesson progress recorded.' : 'Incorrect option selected. Please review and try again.')}</p>
                          {quizResult.quizCompleted && (
                            <p className="text-xs font-semibold text-green-700 mt-1">All questions in this quiz module have been successfully completed! ✓</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No questions configured for this quiz yet.
                    </div>
                  )}
                </div>
              )}

              {/* PDF LESSON VIEW */}
              {activeLesson.lessonType === 'PDF' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{activeLesson.title}</h3>
                        <p className="text-xs text-slate-500">Document Reader &amp; Course Reference Guide</p>
                      </div>
                    </div>
                    {activeLesson.contentUrl && (
                      <a
                        href={activeLesson.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold border border-sky-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    )}
                  </div>

                  {activeLesson.contentUrl ? (
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <iframe
                        src={activeLesson.contentUrl}
                        title={activeLesson.title}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Document attachment is being prepared by the instructor.
                    </div>
                  )}
                </div>
              )}

              {/* TEXT LESSON VIEW */}
              {activeLesson.lessonType === 'TEXT' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{activeLesson.title}</h3>
                      <p className="text-xs text-slate-500">Reading &amp; Foundational Concepts</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">
                      {activeLesson.duration || '15m read'}
                    </span>
                  </div>

                  <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3">
                    <p>{activeLesson.description || 'Welcome to this lesson. Read through the architectural notes below.'}</p>
                  </div>
                </div>
              )}

              {/* ASSIGNMENT LESSON VIEW */}
              {activeLesson.lessonType === 'ASSIGNMENT' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <FolderArchive className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{activeLesson.title}</h3>
                        <p className="text-xs text-slate-500">Hands-on Project &amp; Assignment Submission</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs border border-emerald-200">
                      Max Marks: 100
                    </span>
                  </div>

                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">Assignment Instructions:</h4>
                      <p>{activeLesson.description || 'Complete the exercises and submit your solution source code or project report.'}</p>
                    </div>

                    {assignmentSubmitted ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Assignment submitted successfully! Your mentor will review and grade your work.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                          <input
                            type="file"
                            id="assignment-file-input"
                            onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label htmlFor="assignment-file-input" className="cursor-pointer space-y-1 block">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="font-bold text-slate-800 text-xs">
                              {assignmentFile ? assignmentFile.name : 'Upload Project Archive (.zip, .pdf)'}
                            </p>
                            <p className="text-[11px] text-slate-400">Max size 25MB</p>
                          </label>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentSubmitted(true);
                              handleMarkComplete(true);
                            }}
                            disabled={!assignmentFile}
                            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            Submit Assignment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. PREVIOUS / NEXT NAVIGATION CONTROLS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrevLesson}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Lesson</span>
                </button>

                {/* Lesson Watch Progress Indicator */}
                <div className="flex items-center gap-2 text-xs">
                  {isCurrentCompleted ? (
                    <span className="flex items-center gap-1.5 text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      {currentLessonPercent}% watched
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextLesson}
                  disabled={currentIndex >= allLessons.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
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
                    onClick={handleNextLesson}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition"
                  >
                    Continue to Next Lesson
                  </button>
                </div>
              )}

              {/* 6. LESSON INFORMATION BELOW VIDEO */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-green-700 font-semibold mb-1">
                    <span>Module {activeSectionIdx + 1}: {activeSection?.title || activeLesson.sectionTitle}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {activeLesson.title}
                  </h2>
                </div>

                {/* Instructor Card */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-green-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {course?.instructor ? course.instructor.charAt(0).toUpperCase() : 'I'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{course?.instructor || 'Lead Technical Mentor'}</div>
                    <div className="text-[11px] text-slate-400">Course Instructor &amp; Content Architect</div>
                  </div>
                </div>

                {/* Lesson Description */}
                <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Lesson Overview</h4>
                  <p>{activeLesson.description || 'Welcome to this lesson. Master the architectural concepts and technical implementations demonstrated in this session.'}</p>
                </div>

                {/* Resources & Guide Downloads */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Lesson Resources &amp; Guides</h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Course Syllabus &amp; Technical Architecture Notes</p>
                        <p className="text-[11px] text-slate-400">PDF Guide • Available for enrolled students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeLesson.contentUrl) {
                            window.open(activeLesson.contentUrl, '_blank');
                          } else {
                            if (onShowToast) onShowToast('Resource download started', 'info');
                          }
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols (25-30%): Sticky Course Curriculum Sidebar */}
            <aside className={`lg:col-span-4 space-y-5 lg:sticky lg:top-24 ${
              isMobileCurriculumOpen ? 'fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 p-4 flex flex-col justify-end' : ''
            }`}>
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {/* Curriculum Header & Course Progress */}
                <div className="space-y-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span>Course Content</span>
                    </h3>
                    {isMobileCurriculumOpen && (
                      <button
                        type="button"
                        onClick={() => setIsMobileCurriculumOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Course Progress Section */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">Course Progress</span>
                      <span className="text-green-700 font-extrabold">{progressPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium text-right">
                      {completedCount} / {totalLessonsCount} Lessons Completed
                    </div>
                  </div>
                </div>

                {/* Modules & Lessons Accordion */}
                <div className="space-y-4">
                  {content?.sections && content.sections.map((section, secIdx) => {
                    const isExpanded = expandedSections[section.id] !== false;
                    let secSeconds = 0;
                    section.lessons?.forEach((l: any) => {
                      secSeconds += parseDurationToSeconds(l.duration, l.durationSeconds || l.duration_seconds);
                    });
                    const secDurationHuman = secSeconds > 0 ? formatDurationHuman(secSeconds) : '';

                    return (
                      <div
                        key={section.id}
                        className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                      >
                        {/* Module Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleSection(section.id)}
                          className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between text-left transition cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-[10px] font-bold text-green-800 uppercase tracking-wider">
                              Module {secIdx + 1}
                            </div>
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {section.title}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {section.lessons?.length || 0} Lessons {secDurationHuman ? `• ${secDurationHuman}` : ''}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {/* Lessons List Inside Module */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 p-1.5 space-y-1">
                            {section.lessons?.map((lesson) => {
                              const isCurrent = lesson.id === activeLesson.id;
                              const isDone = completedLessonIds.includes(lesson.id);
                              const isLocked = Boolean(lesson.locked) && !lesson.freePreview && !isUserEnrolled;

                              return (
                                <button
                                  key={lesson.id}
                                  type="button"
                                  onClick={() => handleSelectLesson(lesson.id)}
                                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                    isCurrent
                                      ? 'bg-green-50 border border-green-300 shadow-2xs'
                                      : isDone
                                      ? 'hover:bg-slate-50'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {/* Status Icon & Title */}
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {isDone ? (
                                      <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    ) : isCurrent ? (
                                      <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                        <Play className="w-2.5 h-2.5 fill-white" />
                                      </div>
                                    ) : isLocked ? (
                                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                        <Lock className="w-3 h-3" />
                                      </div>
                                    ) : lesson.lessonType === 'QUIZ' ? (
                                      <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <HelpCircle className="w-3 h-3" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center shrink-0" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                      <p className={`text-xs truncate font-medium ${
                                        isCurrent ? 'font-bold text-slate-900' : isDone ? 'text-slate-700' : 'text-slate-600'
                                      }`}>
                                        {lesson.title}
                                      </p>
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                        <span>{lesson.lessonType || 'Video'}</span>
                                        {lesson.duration && (
                                          <>
                                            <span>•</span>
                                            <span>{lesson.duration}</span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Current Progress / Done Badge */}
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                                      {isDone ? '✓ Done' : `${currentLessonPercent}%`}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* TAB VIEW 2: QUIZZES */}
        {!loading && !error && activeTab === 'quizzes' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <span>Course Quizzes &amp; Knowledge Checks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Assess your retention across each curriculum module.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allLessons
                .filter((l) => l.lessonType === 'QUIZ')
                .map((quiz, idx) => (
                  <div key={quiz.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-purple-700 font-bold mb-1">
                        <span>Quiz {idx + 1}</span>
                        <span>Passing: 70%</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{quiz.description || 'Module concept mastery evaluation.'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectLesson(quiz.id);
                        setActiveTab('videos');
                      }}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {completedLessonIds.includes(quiz.id) ? 'Review Quiz' : 'Start Assessment'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB VIEW 3: PROJECTS */}
        {!loading && !error && activeTab === 'projects' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-emerald-600" />
                <span>Hands-on Projects &amp; Capstones</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-world projects to build your portfolio and demonstrate competency.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allLessons.filter((l) => l.lessonType === 'ASSIGNMENT').length > 0 ? (
                allLessons
                  .filter((l) => l.lessonType === 'ASSIGNMENT')
                  .map((proj, idx) => (
                    <div key={proj.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                          <span>Project {idx + 1}</span>
                          <span>Max Marks: 100</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{proj.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{proj.description || 'Hands-on practical implementation.'}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleSelectLesson(proj.id);
                          setActiveTab('videos');
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Open Project
                      </button>
                    </div>
                  ))
              ) : (
                <div className="col-span-2 py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No projects configured for this course yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB VIEW 4: LIVE CLASS */}
        {!loading && !error && activeTab === 'live' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600" />
                <span>Live Interactive Mentorship Sessions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Join live webinars, architectural reviews, and Q&amp;A sessions with lead industry mentors.</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                  Upcoming Session
                </span>
                <h4 className="font-bold text-slate-900 text-base">Weekly Technical Mentoring &amp; Code Review</h4>
                <p className="text-xs text-slate-500">Every Saturday at 6:00 PM IST • Interactive Cloud Lab</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onShowToast) onShowToast('Live session link will activate 15 minutes before scheduled start time.', 'info');
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                Join Live Stream
              </button>
            </div>
          </div>
        )}

        {/* TAB VIEW 5: REPORTS & LEARNING ANALYTICS */}
        {!loading && !error && activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-sky-600" />
                <span>Learning Analytics &amp; Verified Progress Report</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Detailed breakdown of your course completion metrics and credential eligibility.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Progress</div>
                <div className="text-xl font-black text-slate-900 mt-1">{progressPercent}%</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Completed</div>
                <div className="text-xl font-black text-green-700 mt-1">{completedCount} / {totalLessonsCount}</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Quizzes Passed</div>
                <div className="text-xl font-black text-purple-700 mt-1">{totalQuizzesCount}</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Certificate</div>
                <div className="text-xs font-bold text-slate-900 mt-2">
                  {progressPercent >= 100 ? (
                    <span className="text-green-700">Eligible ✓</span>
                  ) : (
                    <span className="text-slate-400">In Progress</span>
                  )}
                </div>
              </div>
            </div>

            {progressPercent >= 100 && (
              <div className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Verified Certificate of Completion Ready!</h4>
                    <p className="text-xs text-slate-600">You have completed all curriculum requirements for this course.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                >
                  View Certificate
                </button>
              </div>
            )}
          </div>
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
                  {isUserEnrolled ? 'Active Lifetime Access' : 'Guest / Free Preview'}
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
      </main>

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
