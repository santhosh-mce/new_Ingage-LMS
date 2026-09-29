"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
  Download,
  XCircle
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
  lessonType: string;
  sectionId: number;
  sectionTitle: string;
  isCompleted: boolean;
  locked: boolean;
  freePreview?: boolean;
  contentUrl?: string | null;
  videoUrl?: string | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState<boolean>(false);

  // Auto-next countdown state (10-second wait after legitimate completion)
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

  // Certificate state on course completion - course-specific CertificateDto
  const [courseCertificate, setCourseCertificate] = useState<any | null>(null);
  const [isDownloadingCert, setIsDownloadingCert] = useState<boolean>(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const { user } = useAppSelector((state) => state.auth);

  // Clear certificate state when switching courses to prevent stale cross-course certificate display
  useEffect(() => {
    setCourseCertificate(null);
  }, [courseId]);

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
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Anti-cheat watch progress tracking refs
  const maxWatchedTimeRef = useRef<number>(0);
  const accumulatedWatchTimeRef = useRef<number>(0);
  const lastPlaybackTimeRef = useRef<number>(0);

  // Dynamic security watermark state
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>('top-right');

  // Backend API base URL for protected video streaming endpoint
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';
  const authToken = typeof window !== 'undefined' ? (localStorage.getItem('ingage_token') || '') : '';

  // Download deterrence: Prevent Save / View Source keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track fullscreen state across all standard & vendor-prefixed browser APIs
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

  // Subtle watermark position shifting every 15 seconds to deter screen recordings
  useEffect(() => {
    const positions: WatermarkPosition[] = ['top-right', 'bottom-left', 'top-left', 'bottom-right', 'center'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setWatermarkPos(positions[idx]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadCourseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, contentRes] = await Promise.all([
        getCourseById(courseId),
        getCourseContent(courseId),
      ]);

      setCourse(courseRes);
      setContent(contentRes);

      const resolvedId = courseRes?.id || (contentRes as any)?.id || courseId;

      // Fetch enrollment status if logged in
      try {
        const enrollRes = await getCourseEnrollmentStatus(resolvedId);
        setEnrollmentStatus(enrollRes);
      } catch {
        // Continue if unauthenticated or error
      }

      // Server completed lessons & progress
      const serverCompleted: number[] = contentRes.completedLessonIds || [];
      let localCompleted: number[] = [];
      try {
        const stored = localStorage.getItem(`ingage_completed_lessons_${courseId}`);
        if (stored) {
          localCompleted = JSON.parse(stored);
        }
      } catch {
        // noop
      }

      const combinedCompleted = Array.from(new Set([...serverCompleted, ...localCompleted]));
      setCompletedLessonIds(combinedCompleted);
      dispatch(setReduxCompletedLessonIds(combinedCompleted));

      if (contentRes.progressPercentage !== undefined) {
        dispatch(setCourseProgress(contentRes.progressPercentage));
      }

      // Initialize active lesson (prefer first incomplete lesson, or first lesson)
      const allFetchedLessonIds: number[] = [];
      contentRes.sections?.forEach((sec) => {
        sec.lessons?.forEach((l) => allFetchedLessonIds.push(l.id));
      });

      const firstUncompletedId = allFetchedLessonIds.find((id) => !combinedCompleted.includes(id));
      const initialLessonId = firstUncompletedId ?? allFetchedLessonIds[0] ?? null;

      setActiveLessonId(initialLessonId);
      dispatch(setReduxActiveLessonId(initialLessonId));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load this course lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Flatten curriculum lessons for easy previous/next navigation
  const allLessons: FlattenedLesson[] = React.useMemo(() => {
    if (!content || !content.sections) return [];
    const list: FlattenedLesson[] = [];
    content.sections.forEach((sec) => {
      sec.lessons.forEach((les) => {
        list.push({
          id: les.id,
          title: les.title,
          description: les.description,
          duration: les.duration,
          lessonType: les.lessonType,
          sectionId: sec.id,
          sectionTitle: sec.title,
          isCompleted: completedLessonIds.includes(les.id),
          locked: les.locked,
          freePreview: les.freePreview,
          contentUrl: (les as any).contentUrl || (les as any).videoUrl || (les as any).content_url || null,
          videoUrl: (les as any).videoUrl || (les as any).contentUrl || (les as any).content_url || null,
        });
      });
    });
    return list;
  }, [content, completedLessonIds]);

  const currentIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = allLessons[currentIndex] || allLessons[0] || null;

  const isUserEnrolled = Boolean(content?.isEnrolled || enrollmentStatus?.enrolled || enrollmentStatus?.courseAccess);
  const canPlayActiveLesson = Boolean(activeLesson && (isUserEnrolled || activeLesson.freePreview));
  const isLockedForUser = Boolean(activeLesson && !canPlayActiveLesson);

  const isCourseFullyCompleted = Boolean(
    (enrollmentStatus?.completed || enrollmentStatus?.enrollmentStatus === 'COMPLETED' || (enrollmentStatus?.progress || 0) >= 100) ||
    (allLessons.length > 0 && allLessons.every((l) => completedLessonIds.includes(l.id)))
  );

  // Load course certificate strictly for this courseId if completed
  useEffect(() => {
    let isCurrent = true;
    if (isCourseFullyCompleted && courseId) {
      getCourseCertificate(courseId)
        .then((data) => {
          if (isCurrent && data?.id && Number(data.courseId) === Number(courseId)) {
            setCourseCertificate(data);
          }
        })
        .catch(() => {
          // If not generated, attempt claim/generation for THIS courseId
          generateCourseCertificate(courseId)
            .then((data) => {
              if (isCurrent && data?.id && Number(data.courseId) === Number(courseId)) {
                setCourseCertificate(data);
              }
            })
            .catch(() => {});
        });
    } else {
      setCourseCertificate(null);
    }
    return () => {
      isCurrent = false;
    };
  }, [courseId, isCourseFullyCompleted]);

  const handleDownloadCourseCertificate = async () => {
    setIsDownloadingCert(true);
    const currentCourseTitle = content?.title || course?.title || 'Course';
    if (onShowToast) onShowToast(`Downloading official certificate for ${currentCourseTitle}...`, 'info');
    try {
      let activeCert = courseCertificate;

      // Verify activeCert belongs to the current course
      if (!activeCert?.id || Number(activeCert.courseId) !== Number(courseId)) {
        try {
          activeCert = await getCourseCertificate(courseId);
        } catch {
          activeCert = await generateCourseCertificate(courseId);
        }
        if (activeCert && Number(activeCert.courseId) === Number(courseId)) {
          setCourseCertificate(activeCert);
        }
      }

      if (activeCert?.id && Number(activeCert.courseId) === Number(courseId)) {
        await downloadCertificatePdf(
          activeCert.id,
          activeCert.certificateNumber,
          activeCert.courseTitle || currentCourseTitle
        );
        if (onShowToast) onShowToast('Official Certificate PDF downloaded successfully!', 'success');
      } else {
        throw new Error('No certificate is available for this course yet.');
      }
    } catch (err: any) {
      console.error('Certificate Download Error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to download certificate PDF from server. Please try again.';
      if (onShowToast) onShowToast(errMsg, 'error');
    } finally {
      setIsDownloadingCert(false);
    }
  };

  // Compute authenticated video streaming URL
  // Direct video URL playback, local uploads folder video, or backend streaming endpoint
  const rawVideo = activeLesson && (activeLesson.contentUrl || activeLesson.videoUrl || (activeLesson as any).content_url);
  const fallbackStream = activeLesson
    ? `${API_BASE_URL}/courses/${course?.id || courseId}/lessons/${activeLesson.id}/video${authToken ? `?token=${encodeURIComponent(authToken)}` : ''}`
    : '';

  const resolveStreamUrl = (): string => {
    if (!activeLesson || !canPlayActiveLesson) return '';

    let videoUrl = rawVideo ? String(rawVideo).trim() : '';

    // If empty or points to old Google sample / localhost backend, use uploads/videos/video.mp4
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

  // Reset video error & loading states, cancel auto-next countdown, and smooth scroll on active lesson change
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

    // Reset quiz states for active lesson
    setSelectedOption(null);
    setQuizResult(null);
    setQuizError(null);
    setCurrentQuestionIndex(0);

    // Smooth scroll to the lesson content area
    if (lessonContentRef.current) {
      lessonContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeLesson?.id]);

  // Clean up auto-next countdown on component unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // Fetch quiz questions whenever active lesson is a QUIZ
  useEffect(() => {
    if (!activeLesson || activeLesson.lessonType !== 'QUIZ') {
      setQuizQuestions([]);
      return;
    }

    let isMounted = true;
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

  // Restore saved video position and genuine watched progress for the active lesson
  useEffect(() => {
    if (!activeLesson || !videoRef.current) return;

    try {
      const posKey = `ingage_video_pos_${courseId}_${activeLesson.id}`;
      const watchedKey = `ingage_watched_sec_${courseId}_${activeLesson.id}`;

      const savedPos = localStorage.getItem(posKey);
      const posNum = savedPos && Number(savedPos) > 0 ? Number(savedPos) : 0;

      const savedWatched = localStorage.getItem(watchedKey);
      let watchedNum = savedWatched && Number(savedWatched) > 0 ? Number(savedWatched) : 0;

      // Check server watch duration if available
      const serverWatch = activeLesson
        ? (content?.sections?.flatMap((s) => s.lessons).find((l) => l.id === activeLesson.id) as any)?.watchDurationSeconds
        : 0;
      if (serverWatch && serverWatch > watchedNum) {
        watchedNum = serverWatch;
      }

      if (isCurrentCompleted) {
        watchedNum = videoRef.current.duration || duration || 1000;
      }

      videoRef.current.currentTime = posNum;
      setCurrentTime(posNum);
      setWatchedTime(watchedNum);
      accumulatedWatchTimeRef.current = watchedNum;
      lastPlaybackTimeRef.current = posNum;
    } catch {
      // noop
    }
  }, [activeLesson?.id, courseId, isCurrentCompleted, content]);

  // Save video position periodically as user watches & track genuine watched progress
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
    } catch {
      // noop
    }

    // Genuine watched progress tracking:
    // Only increment when moving forward at realistic playback speed (without seeking/jumping)
    const lastTime = lastPlaybackTimeRef.current;
    const delta = cur - lastTime;
    if (delta > 0 && delta <= 1.5 * playbackSpeed) {
      accumulatedWatchTimeRef.current += delta;
      const newWatched = dur > 0
        ? Math.min(dur, accumulatedWatchTimeRef.current)
        : accumulatedWatchTimeRef.current;
      setWatchedTime(newWatched);

      try {
        const watchedKey = `ingage_watched_sec_${courseId}_${activeLesson.id}`;
        localStorage.setItem(watchedKey, String(newWatched));
      } catch {
        // noop
      }
    }
    lastPlaybackTimeRef.current = cur;

    // Dispatch Redux playback state
    dispatch(
      updateLessonPlayback({
        lessonId: activeLesson.id,
        currentTime: cur,
        duration: dur,
        watchDuration: accumulatedWatchTimeRef.current,
      })
    );

    // Automatic end-of-video detection:
    // If video reached >= duration - 2.5s with verified watch coverage >= 85%, complete it!
    if (
      !isCurrentCompleted &&
      activeLesson.lessonType === 'VIDEO' &&
      dur > 5 &&
      cur >= dur - 2.5 &&
      accumulatedWatchTimeRef.current >= dur * 0.85 &&
      !isSubmittingCompletion
    ) {
      handleMarkComplete({
        currentTime: cur,
        duration: dur,
        watchDurationSeconds: Math.round(accumulatedWatchTimeRef.current),
      });
    }
  };

  // Periodic background progress sync to backend every 8 seconds while playing
  useEffect(() => {
    if (!isPlaying || !activeLesson || isCurrentCompleted) return;

    const interval = setInterval(() => {
      if (videoRef.current && activeLesson) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;
        const watchSec = Math.round(accumulatedWatchTimeRef.current);
        if (cur > 0 && dur > 0) {
          dispatch(
            saveLessonProgressThunk({
              lessonId: activeLesson.id,
              currentTime: cur,
              duration: dur,
              watchDurationSeconds: watchSec,
            })
          );
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isPlaying, activeLesson?.id, isCurrentCompleted, dispatch]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (!videoRef.current) return;

    videoRef.current.currentTime = time;
    setCurrentTime(time);
    lastPlaybackTimeRef.current = time;
    // Seeking does NOT mark content as watched!
  };

  const handleSkipBackward = () => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, videoRef.current.currentTime - 10);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    lastPlaybackTimeRef.current = newTime;
    // Exactly 10s backward, does not change watched progress
  };

  const handleSkipForward = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || duration || 0;
    const target = Math.min(dur, videoRef.current.currentTime + 10);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    lastPlaybackTimeRef.current = target;
    // Exactly 10s forward, does not mark skipped content as watched
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    try {
      localStorage.setItem('ingage_video_muted', String(newMuted));
    } catch {
      // noop
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const muted = val === 0;
    setIsMuted(muted);
    try {
      localStorage.setItem('ingage_video_volume', String(val));
      localStorage.setItem('ingage_video_muted', String(muted));
    } catch {
      // noop
    }
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = muted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (!videoContainerRef.current) return;
    const doc = document as any;
    const el = videoContainerRef.current as any;
    const isFull = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    try {
      if (isFull) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      } else {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      }
    } catch {
      // Graceful fallback
    }
  };

  // Keyboard Shortcuts (Space, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, M, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (!videoRef.current) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipBackward();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipForward();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume((prev) => {
          const next = Math.min(1, Math.round((prev + 0.1) * 10) / 10);
          try {
            localStorage.setItem('ingage_video_volume', String(next));
            localStorage.setItem('ingage_video_muted', 'false');
          } catch {
            // noop
          }
          if (videoRef.current) {
            videoRef.current.volume = next;
            videoRef.current.muted = false;
          }
          setIsMuted(false);
          return next;
        });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume((prev) => {
          const next = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
          const muted = next === 0;
          try {
            localStorage.setItem('ingage_video_volume', String(next));
            localStorage.setItem('ingage_video_muted', String(muted));
          } catch {
            // noop
          }
          if (videoRef.current) {
            videoRef.current.volume = next;
            videoRef.current.muted = muted;
          }
          setIsMuted(muted);
          return next;
        });
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, isCurrentCompleted, activeLesson, isMuted, volume]);

  const handleVideoLoadedData = () => {
    setIsVideoLoading(false);
    setIsVideoBuffering(false);
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const handleVideoError = () => {
    setIsPlaying(false);
    // If an external URL failed, fallback immediately to guaranteed local uploads video
    if (videoRef.current && !videoRef.current.src.includes('/uploads/videos/video.mp4')) {
      videoRef.current.src = '/uploads/videos/video.mp4';
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setVideoError(null);
        })
        .catch(() => {});
      return;
    }
    setIsVideoLoading(false);
    setIsVideoBuffering(false);
    setVideoError('Unable to load video. Please check your connection or try again.');
  };

  const handleRetryVideo = () => {
    setVideoError(null);
    setIsVideoLoading(true);
    setIsVideoBuffering(false);
    if (videoRef.current) {
      videoRef.current.src = '/uploads/videos/video.mp4';
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsVideoLoading(false);
        })
        .catch(() => {
          setIsVideoLoading(false);
        });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (!activeLesson) return;
    if (isCurrentCompleted) return;

    const dur = videoRef.current?.duration || duration || 0;
    const cur = videoRef.current?.currentTime || currentTime || dur;
    const watchSec = Math.round(accumulatedWatchTimeRef.current);

    // If genuine watch duration satisfies requirements, mark complete
    if (dur > 0 && watchSec >= dur * 0.85) {
      handleMarkComplete({
        currentTime: dur,
        duration: dur,
        watchDurationSeconds: watchSec,
      });
    } else {
      if (onShowToast) {
        onShowToast('You must watch the complete video to finish this lesson.', 'error');
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Mark lesson as complete via backend API with verification
  const handleMarkComplete = async (verificationPayload?: {
    currentTime?: number;
    duration?: number;
    watchDurationSeconds?: number;
  }) => {
    if (!activeLesson) return;
    if (isCurrentCompleted) return;

    // For VIDEO lessons, enforce video playback completion condition
    if (activeLesson.lessonType === 'VIDEO' && !verificationPayload) {
      const dur = videoRef.current?.duration || duration || 0;
      const cur = videoRef.current?.currentTime || currentTime || 0;
      const watchSec = Math.round(accumulatedWatchTimeRef.current);

      if (dur > 0 && (cur < dur - 3 || watchSec < dur * 0.85)) {
        if (onShowToast) {
          onShowToast('Please watch the full video until completion to finish this lesson.', 'info');
        }
        return;
      }
      verificationPayload = {
        currentTime: cur,
        duration: dur,
        watchDurationSeconds: watchSec,
      };
    }

    setIsSubmittingCompletion(true);
    try {
      const res: any = await dispatch(
        completeLessonThunk({
          lessonId: activeLesson.id,
          ...(verificationPayload || {}),
        })
      ).unwrap();

      if (res?.certificateNumber) {
        setCourseCertificate({
          id: res.certificateId,
          certificateNumber: res.certificateNumber,
          verificationCode: res.verificationCode,
        });
      }

      const updated = Array.from(new Set([...completedLessonIds, activeLesson.id]));
      setCompletedLessonIds(updated);
      try {
        localStorage.setItem(`ingage_completed_lessons_${courseId}`, JSON.stringify(updated));
      } catch {
        // noop
      }

      if (onShowToast) {
        onShowToast(`"${activeLesson.title}" marked as completed!`, 'success');
      }

      // If next lesson exists, start 10-second countdown
      if (currentIndex < allLessons.length - 1) {
        startAutoNextCountdown();
      }

      // Refresh enrollment status from backend for updated course progress %
      try {
        const enrollRes = await getCourseEnrollmentStatus(courseId);
        setEnrollmentStatus(enrollRes);
      } catch {
        // noop
      }

      // If course is completed or certificate generated, fetch certificate if not yet set
      if (res?.courseCompleted || res?.certificateGenerated) {
        try {
          const cert = await getCourseCertificate(courseId);
          if (cert?.id) {
            setCourseCertificate({
              id: cert.id,
              certificateNumber: cert.certificateNumber,
              verificationCode: cert.verificationCode,
            });
          }
        } catch {
          // noop
        }
      }
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Unable to complete lesson';
      if (onShowToast) {
        onShowToast(msg, 'error');
      }
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // 10-Second Countdown & Auto-Next Handlers
  const startAutoNextCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(10);

    countdownTimerRef.current = setInterval(() => {
      setAutoNextCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          handleAutoNextNavigate();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAutoNextNavigate = () => {
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      setActiveLessonId(next.id);
      dispatch(setReduxActiveLessonId(next.id));
    }
  };

  const handleContinueNow = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
    handleNextLesson();
  };

  const handleCancelAutoNext = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);
  };

  // Quiz submission & question navigation handlers
  const handleSubmitQuizAnswer = async () => {
    if (selectedOption === null || !activeLesson || quizQuestions.length === 0) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    setQuizSubmitting(true);
    try {
      const res = await submitQuizAnswer(Number(course?.id || courseId) || 0, activeLesson.id, {
        questionId: currentQ.id,
        selectedOptionIndex: selectedOption,
      });
      setQuizResult(res);

      if (res.correct && res.quizCompleted) {
        // Mark lesson completed in local and Redux states
        const updated = Array.from(new Set([...completedLessonIds, activeLesson.id]));
        setCompletedLessonIds(updated);
        dispatch(setReduxCompletedLessonIds(updated));
        try {
          localStorage.setItem(`ingage_completed_lessons_${courseId}`, JSON.stringify(updated));
        } catch {
          // noop
        }

        if (onShowToast) {
          onShowToast('Quiz completed successfully!', 'success');
        }

        // Auto-next 10-second countdown if next lesson exists
        if (currentIndex < allLessons.length - 1) {
          startAutoNextCountdown();
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err?.response?.data?.message || 'Error submitting answer', 'error');
      }
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setQuizResult(null);
    }
  };

  const handleRetryQuizQuestion = () => {
    setSelectedOption(null);
    setQuizResult(null);
  };

  // Navigation handlers
  const handlePreviousLesson = () => {
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

  const handleNextLesson = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    if (!isCurrentCompleted) {
      if (onShowToast) {
        onShowToast('Complete this lesson to continue.', 'info');
      }
      return;
    }
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      setActiveLessonId(next.id);
      dispatch(setReduxActiveLessonId(next.id));
    }
  };

  const handleSelectLesson = (lessonId: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoNextCountdown(null);

    const targetIdx = allLessons.findIndex((l) => l.id === lessonId);
    if (targetIdx === -1) return;

    // Can always view already completed lessons or current lesson
    if (completedLessonIds.includes(lessonId) || lessonId === activeLesson?.id) {
      setActiveLessonId(lessonId);
      dispatch(setReduxActiveLessonId(lessonId));
      return;
    }

    // For uncompleted future lessons: ensure prior lesson is completed
    const priorLesson = allLessons[targetIdx - 1];
    if (priorLesson && !completedLessonIds.includes(priorLesson.id)) {
      if (onShowToast) {
        onShowToast('Complete the previous lesson to unlock this lesson.', 'info');
      }
      return;
    }

    setActiveLessonId(lessonId);
    dispatch(setReduxActiveLessonId(lessonId));
  };

  // Safe dynamic course progress calculation based on actual curriculum lesson count
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessonsCount > 0
    ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
    : 0;

  // Real authenticated user information for dynamic watermark
  const watermarkName = authUser?.name || 'Verified Learner';
  const watermarkEmail = authUser?.email || '';

  return (
    <div className="w-full bg-[#f8fafc] min-h-[calc(100vh-4.5rem)] text-gray-900 pb-16 flex flex-col select-text">
      {/* 1. Dedicated Course Player Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="back-to-course-btn"
              onClick={() => onNavigate(`/courses/${courseId}`)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Course Overview</span>
            </button>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-xs sm:max-w-md lg:max-w-lg">
              {course?.title || 'Course Learning'}
            </span>
          </div>

          {/* Course Overall Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Course Progress
              </span>
              <span className="text-xs font-black text-gray-900">
                {progressPercent}% Complete
              </span>
            </div>

            <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#8DB600] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Loading State */}
        {loading && (
          <div className="w-full space-y-6 animate-pulse">
            <div className="aspect-video w-full max-w-4xl mx-auto bg-gray-200 rounded-3xl" />
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-100 rounded" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto my-12">
            <AlertCircle className="w-10 h-10 text-rose-600" />
            <h3 className="font-bold text-gray-900">Unable to load this lesson</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={loadCourseData}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main 2-Column Responsive Layout */}
        {!loading && !error && activeLesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (8 cols): Responsive Video Player / Quiz / Text & Lesson Details */}
            <div ref={lessonContentRef} className="lg:col-span-8 space-y-6">
              {/* Free Preview Notification Banner when user is not enrolled */}
              {activeLesson.freePreview && !isUserEnrolled && (
                <div className="bg-lime-50 border border-lime-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-lime-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8DB600] shrink-0" />
                    <span>
                      <strong>Free Preview Lesson:</strong> You are viewing an unlocked preview lesson. Enroll in this course to access all modules and protected video walkthroughs.
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate(`/courses/${courseId}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Buy / Enroll Now
                  </button>
                </div>
              )}

              {/* 1. Responsive Video Container with Security Features & Dynamic Watermark (For VIDEO lessons) */}
              {activeLesson.lessonType === 'VIDEO' && (
                <div
                  ref={videoContainerRef}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-900 group select-none"
                >
                {/* When lesson is protected and user is not enrolled, show locked screen directly */}
                {isLockedForUser ? (
                  <div className="w-full aspect-video bg-black flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h4 className="text-white font-bold text-base sm:text-lg">
                        Protected Video Content
                      </h4>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        This video lesson requires an active course enrollment. Please enroll to unlock all curriculum modules and certifications.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => onNavigate(`/courses/${courseId}`)}
                        className="px-5 py-2.5 rounded-xl bg-[#8DB600] text-gray-950 font-bold text-xs hover:bg-[#7ba000] transition-colors cursor-pointer"
                      >
                        Course Overview &amp; Enroll
                      </button>
                    </div>
                  </div>
                ) : (
                  /* HTML5 Video Element with Backend Protected Stream URL */
                  <video
                    ref={videoRef}
                    src={videoStreamUrl}
                    controlsList="nodownload"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onLoadStart={() => setIsVideoLoading(true)}
                    onLoadedData={handleVideoLoadedData}
                    onCanPlay={() => {
                      setIsVideoLoading(false);
                      setIsVideoBuffering(false);
                    }}
                    onWaiting={() => setIsVideoBuffering(true)}
                    onPlaying={() => {
                      setIsVideoLoading(false);
                      setIsVideoBuffering(false);
                    }}
                    onError={handleVideoError}
                    onEnded={handleVideoEnded}
                    playsInline
                    className="w-full aspect-video object-contain bg-black cursor-pointer"
                    onClick={togglePlay}
                  />
                )}

                {/* Video Initial Loading State */}
                {isVideoLoading && !videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-15 gap-2">
                    <Loader2 className="w-9 h-9 text-[#8DB600] animate-spin" />
                    <span className="text-xs text-white/90 font-medium">Loading video...</span>
                  </div>
                )}

                {/* Video Buffering Indicator */}
                {!isVideoLoading && isVideoBuffering && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-15">
                    <div className="bg-black/70 backdrop-blur-xs px-3.5 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
                      <Loader2 className="w-4 h-4 text-[#8DB600] animate-spin" />
                      <span className="text-xs text-white/90 font-medium">Buffering...</span>
                    </div>
                  </div>
                )}

                {/* Video Playback / Network Error Overlay */}
                {videoError && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h4 className="text-white font-bold text-base sm:text-lg">
                        Unable to load video
                      </h4>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {videoError}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleRetryVideo}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8DB600] text-gray-950 font-bold text-xs hover:bg-[#7ba000] transition-colors cursor-pointer shadow-lg"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dynamic Forensic Watermark Overlay (Works in Standard & Fullscreen) */}
                {!videoError && (
                  <div
                    className={`absolute pointer-events-none select-none transition-all duration-1000 ease-in-out z-20 ${
                      watermarkPos === 'top-left'
                        ? 'top-4 left-4 text-left'
                        : watermarkPos === 'top-right'
                        ? 'top-4 right-4 text-right'
                        : watermarkPos === 'bottom-left'
                        ? 'bottom-20 left-4 text-left'
                        : watermarkPos === 'bottom-right'
                        ? 'bottom-20 right-4 text-right'
                        : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center'
                    }`}
                  >
                    <div className="bg-black/30 backdrop-blur-[2px] px-3 py-1.5 rounded-lg border border-white/10 opacity-30 hover:opacity-40 transition-opacity">
                      <p className="text-[11px] sm:text-xs font-mono font-bold text-white/90 leading-tight tracking-wide">
                        {watermarkName}
                      </p>
                      {watermarkEmail && (
                        <p className="text-[9px] sm:text-[10px] font-mono text-white/70 leading-tight mt-0.5">
                          {watermarkEmail}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Video Control Overlay Bar */}
                {!videoError && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 space-y-2 opacity-95 group-hover:opacity-100 transition-opacity z-25">
                    {/* Dual Progress Bar: Green = Watched Progress, White Marker = Current Playback Position */}
                    <div className="relative w-full h-4 flex items-center group/bar cursor-pointer select-none">
                      {/* Base Track (Unwatched duration) */}
                      <div className="w-full h-1.5 bg-white/25 rounded-full overflow-hidden relative group-hover/bar:h-2 transition-all">
                        {/* Green Line = Actual Watched Progress Only */}
                        <div
                          className="h-full bg-[#8DB600] rounded-full transition-all duration-100"
                          style={{
                            width: `${
                              isCurrentCompleted
                                ? 100
                                : duration > 0
                                ? Math.min(100, Math.max(0, (watchedTime / duration) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      {/* Current Playback Marker (White Thumb Indicator) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border border-black/20 pointer-events-none group-hover/bar:scale-125 transition-transform z-10"
                        style={{
                          left: `${
                            duration > 0
                              ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
                              : 0
                          }%`,
                        }}
                      />

                      {/* Transparent Range Input for Accessible & Smooth Seeking */}
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        title={`Current: ${formatTime(currentTime)} / Watched: ${formatTime(watchedTime)}`}
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-white text-xs gap-1 sm:gap-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {/* Play / Pause */}
                        <button
                          onClick={togglePlay}
                          className="p-1.5 sm:p-2 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
                          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />}
                        </button>

                        {/* Skip backward 10s */}
                        <button
                          onClick={handleSkipBackward}
                          className="hidden xs:flex p-1.5 sm:px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer items-center gap-0.5 sm:gap-1 text-xs font-semibold shrink-0"
                          title="Skip backward 10s (Left Arrow)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[10px] sm:text-[11px] font-mono">10</span>
                        </button>

                        {/* Skip forward 10s */}
                        <button
                          onClick={handleSkipForward}
                          className="hidden xs:flex p-1.5 sm:px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer items-center gap-0.5 sm:gap-1 text-xs font-semibold shrink-0"
                          title="Skip forward 10s (Right Arrow)"
                        >
                          <span className="text-[10px] sm:text-[11px] font-mono">10</span>
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Time display: 0:27 / 10:15 */}
                        <span className="font-mono text-white/90 text-[10px] sm:text-xs ml-0.5 sm:ml-1 whitespace-nowrap">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        {/* Volume & Mute */}
                        <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
                          <button
                            onClick={toggleMute}
                            className="p-1 text-white/80 hover:text-white cursor-pointer transition-colors"
                            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
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
                            className="w-14 sm:w-18 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#8DB600] hidden sm:inline-block"
                            title="Volume (Up/Down Arrow)"
                          />
                        </div>
                      </div>

                      {/* Right side controls: Speed & Fullscreen */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <select
                          value={playbackSpeed}
                          onChange={(e) => handleSpeedChange(Number(e.target.value))}
                          className="bg-white/15 border border-white/20 text-white text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-medium"
                          title="Playback Speed"
                        >
                          <option value={0.5} className="text-gray-900">0.5x</option>
                          <option value={0.75} className="text-gray-900">0.75x</option>
                          <option value={1} className="text-gray-900">1x</option>
                          <option value={1.25} className="text-gray-900">1.25x</option>
                          <option value={1.5} className="text-gray-900">1.5x</option>
                          <option value={1.75} className="text-gray-900">1.75x</option>
                          <option value={2} className="text-gray-900">2x</option>
                        </select>

                        <button
                          onClick={handleFullscreen}
                          className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                        >
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. QUIZ LESSON: Question & Answer Section */}
            {activeLesson.lessonType === 'QUIZ' && (
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6 select-none">
                {/* Quiz Header & Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-900 border border-lime-200 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <HelpCircle className="w-5 h-5 text-[#8DB600]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-950 text-sm sm:text-base">
                        Knowledge Check &amp; Assessment
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Select the correct answer and submit to validate your comprehension.
                      </p>
                    </div>
                  </div>
                  {quizQuestions.length > 0 && (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 self-start sm:self-auto shrink-0 shadow-2xs">
                      Question {currentQuestionIndex + 1} of {quizQuestions.length}
                    </span>
                  )}
                </div>

                {/* Quiz Question Progress Indicator */}
                {quizQuestions.length > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#8DB600] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((currentQuestionIndex + (quizResult?.correct ? 1 : 0)) / quizQuestions.length) * 100)}%`
                      }}
                    />
                  </div>
                )}

                {/* Quiz Loading & Error States */}
                {quizLoading && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#8DB600] animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">Loading quiz questions...</span>
                  </div>
                )}

                {!quizLoading && quizError && (
                  <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                    <p className="text-xs text-rose-700 font-semibold">{quizError}</p>
                  </div>
                )}

                {/* Active Question & Options */}
                {!quizLoading && !quizError && quizQuestions.length > 0 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#8DB600] uppercase tracking-wider">
                        Question {currentQuestionIndex + 1}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-gray-950 leading-snug">
                        {quizQuestions[currentQuestionIndex].questionText}
                      </h2>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3">
                      {quizQuestions[currentQuestionIndex].options.map((opt, idx) => {
                        const isSelected = selectedOption === idx;
                        const hasAnswered = quizResult !== null;
                        const isCorrectOption = hasAnswered && quizResult.correctOptionIndex === idx;
                        const isUserWrongSelection = hasAnswered && !quizResult.correct && isSelected;

                        return (
                          <label
                            key={idx}
                            onClick={() => {
                              if (!quizResult) setSelectedOption(idx);
                            }}
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                              isSelected && !hasAnswered
                                ? 'border-[#8DB600] bg-lime-50/50 shadow-xs ring-1 ring-[#8DB600]'
                                : isCorrectOption
                                ? 'border-emerald-400 bg-emerald-50/80 text-emerald-950 font-semibold'
                                : isUserWrongSelection
                                ? 'border-rose-400 bg-rose-50/80 text-rose-950'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-question-${currentQuestionIndex}`}
                              checked={isSelected}
                              disabled={hasAnswered}
                              onChange={() => {
                                if (!quizResult) setSelectedOption(idx);
                              }}
                              className="accent-[#8DB600] w-4 h-4 cursor-pointer shrink-0"
                            />
                            <span className="text-xs sm:text-sm font-medium leading-relaxed">
                              {opt}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Answer Feedback & Explanation */}
                    {quizResult && (
                      <div
                        className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 animate-in fade-in ${
                          quizResult.correct
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          {quizResult.correct ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span>✓ Correct Answer</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              <span>Incorrect Answer</span>
                            </>
                          )}
                        </div>
                        {quizResult.explanation && (
                          <p className="text-xs leading-relaxed opacity-90 pl-7">
                            {quizResult.explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      {!quizResult ? (
                        <button
                          onClick={handleSubmitQuizAnswer}
                          disabled={selectedOption === null || quizSubmitting}
                          className="px-6 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                        >
                          {quizSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>Submit Answer</span>
                        </button>
                      ) : quizResult.correct ? (
                        currentQuestionIndex < quizQuestions.length - 1 ? (
                          <button
                            onClick={handleNextQuizQuestion}
                            className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                          >
                            <span>Next Question</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Quiz Completed ✓</span>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={handleRetryQuizQuestion}
                          className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. TEXT LESSON: Reading / Article Layout */}
            {activeLesson.lessonType === 'TEXT' && (
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-900 border border-sky-200 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                      <BookOpen className="w-5 h-5 text-sky-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-950 text-sm sm:text-base">
                        Reading &amp; Architecture Notes
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Carefully read the module concepts before proceeding to subsequent lessons.
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shrink-0 flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{activeLesson.duration || '15m read'}</span>
                  </span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-800 space-y-4">
                  <p className="text-sm sm:text-base leading-relaxed text-gray-700">
                    {activeLesson.description || 'Foundational architectural patterns and best practices for modern enterprise web application design.'}
                  </p>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8DB600]" />
                      <span>Core Architectural Concepts</span>
                    </h4>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-2 list-disc list-inside">
                      <li>Component-driven state architecture with unidirectional data flow.</li>
                      <li>Optimized byte-range partial content streaming with cryptographic token verification.</li>
                      <li>Separation of concerns across controllers, service logic, and persistence repositories.</li>
                      <li>Graceful error recovery and authenticated session persistence across browser reloads.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Metadata & Navigation Control Bar */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-200">
                        {course?.category || 'Curriculum'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {activeLesson.sectionTitle}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
                      {activeLesson.title}
                    </h1>

                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{activeLesson.duration || '12m'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Instructor: {course?.instructor || 'Faculty'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Protected Stream</span>
                      </span>
                    </div>
                  </div>

                  {/* Mark As Complete Button */}
                  <button
                    id="mark-lesson-complete-btn"
                    onClick={() => handleMarkComplete()}
                    disabled={isSubmittingCompletion || (activeLesson.lessonType === 'VIDEO' && !isCurrentCompleted)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all shrink-0 ${
                      isCurrentCompleted
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default'
                        : activeLesson.lessonType === 'VIDEO'
                        ? 'bg-gray-150 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 cursor-pointer'
                    }`}
                    title={
                      isCurrentCompleted
                        ? 'Lesson completed'
                        : activeLesson.lessonType === 'VIDEO'
                        ? 'Watch video to 100% to complete'
                        : 'Mark lesson as complete'
                    }
                  >
                    {isCurrentCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    ) : activeLesson.lessonType === 'VIDEO' ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-gray-950" />
                    )}
                    <span>
                      {isCurrentCompleted
                        ? 'Completed ✓'
                        : activeLesson.lessonType === 'VIDEO'
                        ? 'Watch to 100% to Complete'
                        : 'Mark as Complete'}
                    </span>
                  </button>
                </div>

                {/* 10-Second Auto-Next Countdown Banner */}
                {autoNextCountdown !== null && autoNextCountdown > 0 && (
                  <div className="p-4 bg-lime-50/90 border border-lime-300 rounded-2xl text-xs shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2.5 text-lime-950 font-semibold">
                      <Clock className="w-4 h-4 text-[#8DB600] animate-spin" />
                      <span>
                        Next lesson starts in <strong className="text-sm font-black text-gray-950 px-2 py-0.5 bg-lime-200/80 rounded-md">{autoNextCountdown}</strong> second{autoNextCountdown === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={handleContinueNow}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>Continue Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelAutoNext}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Stay on this lesson
                      </button>
                    </div>
                  </div>
                )}

                {/* Previous / Next Lesson Control Strip */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 sm:gap-3">
                  <button
                    onClick={handlePreviousLesson}
                    disabled={currentIndex <= 0}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Previous Lesson</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                    <span className="hidden sm:inline">Lesson </span>{currentIndex + 1} of {allLessons.length}
                  </span>

                  {/* Next Lesson Control Strip with Lock & Notification */}
                  {currentIndex < allLessons.length - 1 ? (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        id="next-lesson-btn"
                        onClick={handleNextLesson}
                        disabled={!isCurrentCompleted}
                        className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                          isCurrentCompleted
                            ? 'bg-gray-900 hover:bg-black text-white cursor-pointer shadow-2xs'
                            : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                        }`}
                        title={!isCurrentCompleted ? 'Complete this lesson to continue' : 'Proceed to next lesson'}
                      >
                        <span className="hidden sm:inline">Next Lesson</span>
                        <span className="sm:hidden">Next</span>
                        {!isCurrentCompleted ? (
                          <Lock className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {!isCurrentCompleted && (
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          Complete this lesson to continue.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        id="course-complete-btn"
                        onClick={() => {
                          setIsCertModalOpen(true);
                        }}
                        disabled={!isCurrentCompleted}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                          isCurrentCompleted
                            ? 'bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 cursor-pointer shadow-2xs'
                            : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                        }`}
                        title={!isCurrentCompleted ? 'Complete this lesson to finish course' : 'View Course Certificate'}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Course Completed • Certificate</span>
                      </button>
                      {!isCurrentCompleted && (
                        <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                          Complete this lesson to continue.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Completed Celebration & Certificate Card */}
                {isCourseFullyCompleted && (
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-slate-900/5 border border-lime-300 shadow-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#8DB600] flex items-center justify-center text-gray-950 shrink-0 shadow-sm">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-950">Course Completed!</h4>
                          <span className="px-2 py-0.5 rounded-md bg-lime-200/80 text-lime-950 text-[11px] font-bold">100% Mastery</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Congratulations! You have successfully completed this course.
                        </p>
                        {courseCertificate && (
                          <p className="text-[11px] font-mono text-gray-600 mt-1">
                            Certificate ID: <strong className="text-gray-900 font-bold">{courseCertificate.certificateNumber}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                      <button
                        onClick={() => setIsCertModalOpen(true)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-[#8DB600]" />
                        <span>View Certificate</span>
                      </button>
                      <button
                        onClick={handleDownloadCourseCertificate}
                        disabled={isDownloadingCert}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isDownloadingCert ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{isDownloadingCert ? 'Downloading...' : 'Download Certificate'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson Tabs: Overview vs Notes */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'border-[#8DB600] text-gray-950'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    Lesson Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`pb-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'notes'
                        ? 'border-[#8DB600] text-gray-950'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    Notes &amp; Resources
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <p>{activeLesson.description || 'Welcome to this lesson. Watch the video above to master the foundational concepts.'}</p>
                    {course?.description && (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Course Information
                        </span>
                        <p className="text-gray-700 font-medium">{course.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                    <div className="p-4 bg-lime-50/60 rounded-2xl border border-lime-200/80 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-lime-900">
                        <Sparkles className="w-4 h-4 text-[#8DB600]" />
                        <span>Key Learning Takeaway</span>
                      </div>
                      <p className="text-lime-950/90 leading-relaxed text-xs">
                        Follow along with the hands-on concepts demonstrated in this lesson. Practice the queries and visualizations in your local development environment.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Lesson Reference Guide</p>
                          <p className="text-[11px] text-gray-500">PDF Guide • Available for enrolled learners</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700">
                        Included
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols): Course Curriculum Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-5 lg:sticky lg:top-20">
              {/* Curriculum Header */}
              <div className="space-y-2 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8DB600]" />
                    <span>Course Curriculum</span>
                  </h2>
                  <span className="text-xs font-extrabold text-[#8DB600]">
                    {completedCount} / {totalLessonsCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Select any lesson below to switch or review.
                </p>
              </div>

              {/* Sections & Lessons Accordion */}
              <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                {content?.sections && content.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    {/* Section Header */}
                    <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </div>

                    {/* Lessons list */}
                    <div className="space-y-1.5">
                      {section.lessons.map((lesson) => {
                        const isCurrent = lesson.id === activeLesson.id;
                        const isDone = completedLessonIds.includes(lesson.id);
                        const lessonIdx = allLessons.findIndex((l) => l.id === lesson.id);
                        const priorLesson = lessonIdx > 0 ? allLessons[lessonIdx - 1] : null;
                        const isLockedByProgression = priorLesson ? !completedLessonIds.includes(priorLesson.id) && !isDone && !isCurrent : false;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isCurrent
                                ? 'bg-lime-50/80 border-[#8DB600] text-gray-950 shadow-2xs'
                                : isDone
                                ? 'bg-white border-gray-150 hover:bg-gray-50 text-gray-800'
                                : isLockedByProgression
                                ? 'bg-gray-50/50 border-gray-100 opacity-60 text-gray-500'
                                : 'bg-gray-50/70 border-gray-100 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Status Icon */}
                              {isDone ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : isCurrent ? (
                                <div className="w-5 h-5 rounded-full bg-[#8DB600] text-gray-950 flex items-center justify-center shrink-0 mt-0.5">
                                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                                </div>
                              ) : isLockedByProgression ? (
                                <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                  <Lock className="w-2.5 h-2.5 text-gray-400" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className={`text-xs font-bold line-clamp-1 ${isCurrent ? 'text-gray-950' : 'text-gray-800'}`}>
                                    {lesson.title}
                                  </p>
                                  {lesson.freePreview && !isUserEnrolled && (
                                    <span className="text-[9px] uppercase font-bold text-lime-700 bg-lime-100 px-1.5 py-0.5 rounded-full shrink-0">
                                      Free Preview
                                    </span>
                                  )}
                                  {((lesson.locked && !isUserEnrolled && !lesson.freePreview) || isLockedByProgression) && (
                                    <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  {lesson.duration || '10m'} • {lesson.lessonType}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Certificate View Modal */}
      {isCertModalOpen && (
        <CertificateViewModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={
            courseCertificate && Number(courseCertificate.courseId) === Number(courseId)
              ? courseCertificate
              : {
                  id: courseCertificate?.id || 0,
                  certificateNumber: courseCertificate?.certificateNumber || 'PENDING',
                  verificationCode: courseCertificate?.verificationCode || '',
                  studentName:
                    (user as any)?.name ||
                    (user as any)?.fullName ||
                    (user?.email ? user.email.split('@')[0].replace('.', ' ') : 'Student'),
                  courseId: typeof courseId === 'string' ? parseInt(courseId, 10) : courseId,
                  courseTitle: content?.title || course?.title || 'Course Completion',
                  courseCategory: content?.category || course?.category || 'Professional Learning',
                  courseDuration: content?.duration || course?.duration || '',
                  instructor: content?.instructor || course?.instructor || 'Lead Instructor',
                  formattedDate: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                  issuedAt: new Date().toISOString(),
                  status: 'ACTIVE',
                  verificationUrl: `/certificate/verify/${courseCertificate?.verificationCode || ''}`,
                  downloadUrl: courseCertificate?.id ? `/api/certificates/${courseCertificate.id}/download` : '',
                }
          }
          onNavigate={onNavigate}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

export default CourseLearnPage;
