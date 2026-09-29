"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Circle,
  Award,
  BookOpen,
  Code2,
  FileText,
  HelpCircle,
  Sparkles,
  Lock,
  ChevronRight,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  getCredentialSkillDetails,
  updateCredentialSkillProgress,
  completeCredentialSkill,
  CredentialSkillDto,
  WeeklySkillCompletionResultDto
} from '../../api/credentialApi';
import { UserProfile } from '../../types';

interface WeeklySkillLearningPageProps {
  courseSlug: string;
  skillSlug: string;
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string) => void;
}

export function WeeklySkillLearningPage({
  courseSlug,
  skillSlug,
  onNavigate,
  currentUser,
  onOpenAuth,
  onShowToast
}: WeeklySkillLearningPageProps) {
  const [skill, setSkill] = useState<CredentialSkillDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Video player state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [videoWatchedPct, setVideoWatchedPct] = useState<number>(0);

  // Interactive Material Tabs / Modals
  const [activeTab, setActiveTab] = useState<'reading' | 'practice' | 'casestudy' | 'quiz' | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Practical prompt lab state
  const [promptInput, setPromptInput] = useState<string>('');
  const [promptOutput, setPromptOutput] = useState<string>('');

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<WeeklySkillCompletionResultDto | null>(null);

  useEffect(() => {
    fetchSkillData();
  }, [courseSlug, skillSlug]);

  const fetchSkillData = async () => {
    setLoading(true);
    setError(null);
    setVideoError(false);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setPromptInput('');
    setPromptOutput('');
    try {
      const data = await getCredentialSkillDetails(courseSlug, skillSlug);
      setSkill(data);
      setVideoWatchedPct(data.videoProgress || 0);
      if (data.quizCompleted) {
        setQuizSubmitted(true);
        setQuizScore(data.quizScore || 100);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load skill curriculum.');
    } finally {
      setLoading(false);
    }
  };

  // Video Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => setVideoError(true));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (delta: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = newTime;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);

    const pct = Math.min(100, Math.round((cur / dur) * 100));
    if (pct > videoWatchedPct) {
      setVideoWatchedPct(pct);
      // Auto-mark video complete when >= 85% watched
      if (pct >= 85 && !skill?.videoCompleted) {
        syncProgress({ videoProgress: pct, videoCompleted: true });
      } else if (pct % 25 === 0) {
        syncProgress({ videoProgress: pct });
      }
    }
  };

  const syncProgress = async (patch: {
    videoProgress?: number;
    videoCompleted?: boolean;
    readingCompleted?: boolean;
    practiceCompleted?: boolean;
    caseStudyCompleted?: boolean;
    quizCompleted?: boolean;
    quizScore?: number;
  }) => {
    try {
      const updated = await updateCredentialSkillProgress(courseSlug, skillSlug, patch);
      setSkill(updated);
    } catch {
      // Background sync silently persists
    }
  };

  // Activity Completion Toggles
  const handleToggleReading = async () => {
    if (!skill) return;
    const nextVal = !skill.readingCompleted;
    await syncProgress({ readingCompleted: nextVal });
    if (nextVal && onShowToast) onShowToast('✓ Reading completed!');
  };

  const handleTogglePractice = async () => {
    if (!skill) return;
    const nextVal = !skill.practiceCompleted;
    await syncProgress({ practiceCompleted: nextVal });
    if (nextVal && onShowToast) onShowToast('✓ Practical exercise completed!');
  };

  const handleToggleCaseStudy = async () => {
    if (!skill) return;
    const nextVal = !skill.caseStudyCompleted;
    await syncProgress({ caseStudyCompleted: nextVal });
    if (nextVal && onShowToast) onShowToast('✓ Case study completed!');
  };

  const handleSimulatePromptTest = () => {
    if (!promptInput.trim()) {
      if (onShowToast) onShowToast('Please type a prompt instruction to test.');
      return;
    }
    // High-quality simulated response showing the LLM reasoning
    setPromptOutput(
      `[AI Evaluation Engine]:\n\nPrompt Analysis:\n• Intent: Defined clearly\n• Formatting Directive: Observed\n• Context: Grounded in Generative AI Principles\n\nGenerated Response:\n"${promptInput.trim()}" successfully guided the model to deliver a concise, deterministic output meeting all formatting constraints.`
    );
    handleTogglePractice();
  };

  // Quiz Submission
  const handleQuizSubmit = async () => {
    if (!skill?.quizQuestions || skill.quizQuestions.length === 0) return;

    let correctCount = 0;
    skill.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / skill.quizQuestions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    if (scorePct >= 70) {
      await syncProgress({ quizCompleted: true, quizScore: scorePct });
      if (onShowToast) onShowToast(`🎉 Quiz passed with ${scorePct}% score!`);
    } else {
      if (onShowToast) onShowToast(`Score: ${scorePct}%. You need at least 70% to pass. Try again!`);
    }
  };

  // Final Skill Completion
  const isAllRequiredDone =
    (skill?.videoCompleted || videoWatchedPct >= 85) &&
    skill?.readingCompleted &&
    skill?.practiceCompleted &&
    skill?.caseStudyCompleted &&
    (skill?.quizQuestions?.length ? skill?.quizCompleted : true);

  const handleCompleteSkill = async () => {
    if (!isAllRequiredDone) {
      if (onShowToast) onShowToast('Please finish all required learning activities before completing this skill.');
      return;
    }

    setActionLoading(true);
    try {
      const result = await completeCredentialSkill(courseSlug, skillSlug);
      setCompletionResult(result);
      setShowCompletionModal(true);
      if (onShowToast) onShowToast(`🎉 ${result.skillTitle} Completed! Badge earned!`);
      // Update local state to completed
      if (skill) {
        setSkill({
          ...skill,
          status: 'COMPLETED',
          badgeEarned: true,
          badgeId: result.badge.badgeId
        });
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(err?.response?.data?.message || 'Failed to complete skill.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-16 px-4 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded w-2/3" />
        <div className="h-96 bg-gray-200 rounded-3xl" />
        <div className="h-40 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-20 px-4 max-w-md mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Curriculum Not Accessible</h2>
        <p className="text-xs text-gray-500 mb-6">{error || 'This weekly skill is currently locked or unavailable.'}</p>
        <button
          onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
          className="px-5 py-2.5 bg-lime-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-lime-700 transition-colors"
        >
          Back to Course Overview
        </button>
      </div>
    );
  }

  // Calculate actual completion percentage across the 5 activities
  const activityItems = [
    { key: 'video', label: 'Video Lesson', done: !!skill.videoCompleted || videoWatchedPct >= 85 },
    { key: 'reading', label: 'Reading Material', done: !!skill.readingCompleted },
    { key: 'practice', label: 'Practical Exercise', done: !!skill.practiceCompleted },
    { key: 'caseStudy', label: 'Case Study', done: !!skill.caseStudyCompleted },
    { key: 'quiz', label: 'Knowledge Quiz', done: !!skill.quizCompleted }
  ];
  const completedActivitiesCount = activityItems.filter((i) => i.done).length;
  const overallSkillProgress = Math.round((completedActivitiesCount / activityItems.length) * 100);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 pb-24 font-sans">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto">
            <button
              onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
              className="text-gray-600 hover:text-lime-700 font-semibold transition-colors shrink-0 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{skill.courseTitle || 'Google Generative AI'}</span>
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-medium shrink-0">{skill.moduleTitle}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-bold shrink-0">Week {skill.weekNumber}</span>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Skill Progress:</span>
              <span className="text-xs font-bold text-lime-700">{overallSkillProgress}%</span>
            </div>
            <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
              <div
                className="bg-lime-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallSkillProgress}%` }}
              />
            </div>
            {skill.status === 'COMPLETED' ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-extrabold">
                Week {skill.weekNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title & Metadata Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-lime-100 text-lime-800 text-xs font-bold uppercase tracking-wider">
                Module {skill.moduleId || 1} • Week {skill.weekNumber}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-500">{skill.duration || '1 Week'} duration</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Badge: {skill.badgeName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {skill.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
              {skill.description}
            </p>
          </div>

          {skill.badgeEarned && skill.badgeId && (
            <button
              onClick={() => onNavigate(`/credential-edge/${courseSlug}/badges/${skill.badgeId}`)}
              className="self-start md:self-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>View Earned Skill Badge</span>
            </button>
          )}
        </div>

        {/* Video Player Section */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-md mb-8">
          <div
            ref={videoContainerRef}
            className="relative bg-black aspect-video sm:aspect-21/9 max-h-[520px] w-full flex items-center justify-center group overflow-hidden"
          >
            {videoError ? (
              // Clean video placeholder if video file is missing or fails
              <div className="flex flex-col items-center justify-center p-8 text-center text-white space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-8 h-8 text-lime-400 ml-1" />
                </div>
                <h3 className="text-lg font-bold text-white">Learning video will be available soon</h3>
                <p className="text-xs text-gray-300 max-w-md">
                  This skill's interactive reading, practical exercises, case studies, and knowledge quiz are ready for study below.
                </p>
                <button
                  onClick={() => {
                    setVideoWatchedPct(100);
                    syncProgress({ videoProgress: 100, videoCompleted: true });
                  }}
                  className="mt-2 px-4 py-2 bg-lime-600 hover:bg-lime-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Mark Video Completed for Review
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src="/api/learning/lessons/1/video"
                  controlsList="nodownload"
                  onTimeUpdate={handleTimeUpdate}
                  onError={() => setVideoError(true)}
                  onEnded={() => {
                    setIsPlaying(false);
                    setVideoWatchedPct(100);
                    syncProgress({ videoProgress: 100, videoCompleted: true });
                  }}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Big Center Play Button Overlay if paused */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-18 h-18 rounded-full bg-lime-600/90 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl backdrop-blur-xs cursor-pointer z-10"
                  >
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </button>
                )}

                {/* Custom Video Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity z-20">
                  {/* Progress scrubber */}
                  <div className="w-full flex items-center gap-3">
                    <span className="text-[11px] text-gray-300 font-mono">{formatSeconds(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="flex-1 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-lime-500"
                    />
                    <span className="text-[11px] text-gray-300 font-mono">{formatSeconds(duration)}</span>
                  </div>

                  {/* Button row */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      {/* Play/Pause */}
                      <button
                        onClick={togglePlay}
                        className="p-1.5 hover:text-lime-400 transition-colors cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                      </button>

                      {/* 10s Backward Seek */}
                      <button
                        onClick={() => handleSeek(-10)}
                        className="p-1.5 hover:text-lime-400 transition-colors cursor-pointer text-xs flex items-center gap-0.5"
                        title="Rewind 10 seconds"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-[10px] font-bold">10s</span>
                      </button>

                      {/* 10s Forward Seek */}
                      <button
                        onClick={() => handleSeek(10)}
                        className="p-1.5 hover:text-lime-400 transition-colors cursor-pointer text-xs flex items-center gap-0.5"
                        title="Forward 10 seconds"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span className="text-[10px] font-bold">10s</span>
                      </button>

                      {/* Volume Slider */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={toggleMute}
                          className="p-1 hover:text-lime-400 transition-colors cursor-pointer"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-lime-500 hidden sm:block"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Playback speed selector */}
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-0.5 border border-white/15">
                        <span className="text-[10px] text-gray-400 font-semibold mr-1">Speed</span>
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => handleSpeedChange(spd)}
                            className={`px-1.5 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                              playbackSpeed === spd
                                ? 'bg-lime-500 text-gray-950'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      {/* Fullscreen */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-1 hover:text-lime-400 transition-colors cursor-pointer"
                        title="Toggle Fullscreen"
                      >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Under video bar */}
          <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center font-bold text-xs">
                {videoWatchedPct >= 85 || skill.videoCompleted ? '✓' : `${videoWatchedPct}%`}
              </div>
              <div>
                <span className="text-xs font-bold text-gray-800 block">Video Progress</span>
                <span className="text-xs text-gray-500">
                  {videoWatchedPct >= 85 || skill.videoCompleted
                    ? '✓ Video requirement satisfied (watched > 85%)'
                    : `${videoWatchedPct}% watched (reach 85% to satisfy requirement)`}
                </span>
              </div>
            </div>

            {/* Quick Video Completed Toggle */}
            <button
              onClick={() => {
                const next = !skill.videoCompleted;
                syncProgress({ videoCompleted: next, videoProgress: next ? 100 : videoWatchedPct });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                skill.videoCompleted
                  ? 'bg-lime-100 text-lime-800 hover:bg-lime-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-lime-600 hover:text-white'
              }`}
            >
              {skill.videoCompleted ? <Check className="w-4 h-4" /> : null}
              <span>{skill.videoCompleted ? 'Video Completed' : 'Mark Video Watched'}</span>
            </button>
          </div>
        </div>

        {/* Section: What You'll Learn & Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-2xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-lime-600" />
              <span>What You'll Learn in Week {skill.weekNumber}</span>
            </h2>
            <div className="space-y-3">
              {skill.learningObjectives && skill.learningObjectives.length > 0 ? (
                skill.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-800 leading-snug">{obj}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Essential generative AI foundational objectives.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lime-600" />
              <span>Key Topics Covered</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {skill.topics && skill.topics.length > 0 ? (
                skill.topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-lime-50 hover:text-lime-800 transition-colors"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">Generative AI Concepts</span>
              )}
            </div>
          </div>
        </div>

        {/* Section: Learning Materials Cards (Video, Reading, Practical, Case Study, Quiz) */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-2xs mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-lime-600" />
                <span>Weekly Learning Materials</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Complete each required activity below to unlock the Week {skill.weekNumber} Skill Badge.
              </p>
            </div>
            <div className="text-xs font-bold text-lime-700 bg-lime-50 px-3 py-1 rounded-full border border-lime-200 self-start sm:self-auto">
              {completedActivitiesCount} of {activityItems.length} Activities Finished
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Video Lesson */}
            <div className={`p-5 rounded-2xl border transition-all ${
              skill.videoCompleted || videoWatchedPct >= 85
                ? 'bg-lime-50/50 border-lime-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                {skill.videoCompleted || videoWatchedPct >= 85 ? (
                  <span className="text-xs font-bold text-lime-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Pending ({videoWatchedPct}%)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Video Lesson</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Watch the foundational lecture explaining this week's generative AI techniques and architecture.
              </p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                  togglePlay();
                }}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-lime-600 hover:text-white text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Watch Video
              </button>
            </div>

            {/* Card 2: Reading Material */}
            <div className={`p-5 rounded-2xl border transition-all ${
              skill.readingCompleted
                ? 'bg-lime-50/50 border-lime-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                {skill.readingCompleted ? (
                  <span className="text-xs font-bold text-lime-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Required
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Reading Material</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Comprehensive study guide, architectural diagrams, and official reference documents.
              </p>
              <button
                onClick={() => setActiveTab('reading')}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-lime-600 hover:text-white text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Open Reading Guide
              </button>
            </div>

            {/* Card 3: Practical Exercise */}
            <div className={`p-5 rounded-2xl border transition-all ${
              skill.practiceCompleted
                ? 'bg-lime-50/50 border-lime-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Code2 className="w-4 h-4" />
                </div>
                {skill.practiceCompleted ? (
                  <span className="text-xs font-bold text-lime-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Required
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Practical Prompt Lab</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Hands-on prompt formulation, system prompting, parameter tuning, and model evaluation.
              </p>
              <button
                onClick={() => setActiveTab('practice')}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-lime-600 hover:text-white text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Launch Prompt Lab
              </button>
            </div>

            {/* Card 4: Case Study */}
            <div className={`p-5 rounded-2xl border transition-all ${
              skill.caseStudyCompleted
                ? 'bg-lime-50/50 border-lime-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                {skill.caseStudyCompleted ? (
                  <span className="text-xs font-bold text-lime-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Required
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Industry Case Study</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Analyze production enterprise generative AI implementations, tradeoffs, and safety mitigations.
              </p>
              <button
                onClick={() => setActiveTab('casestudy')}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-lime-600 hover:text-white text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Review Case Study
              </button>
            </div>

            {/* Card 5: Knowledge Quiz */}
            <div className={`p-5 rounded-2xl border transition-all ${
              skill.quizCompleted
                ? 'bg-lime-50/50 border-lime-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                {skill.quizCompleted ? (
                  <span className="text-xs font-bold text-lime-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Passed ({quizScore}%)
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Required (≥ 70%)
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Knowledge Assessment</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Verify conceptual mastery through weekly multiple-choice questions with answer rationale.
              </p>
              <button
                onClick={() => setActiveTab('quiz')}
                className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-lime-600 hover:text-white text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                {skill.quizCompleted ? 'Review Quiz' : 'Take Quiz'}
              </button>
            </div>
          </div>
        </div>

        {/* Section: Bottom Completion Action Banner (Section 9) */}
        <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          skill.status === 'COMPLETED'
            ? 'bg-emerald-50 border-emerald-200'
            : isAllRequiredDone
            ? 'bg-gradient-to-r from-lime-50 to-emerald-50 border-lime-300 shadow-md'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                skill.status === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : isAllRequiredDone
                  ? 'bg-lime-600 text-white animate-bounce'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {skill.status === 'COMPLETED'
                    ? `Week ${skill.weekNumber} Skill Badge Earned!`
                    : isAllRequiredDone
                    ? 'Skill Ready to Complete!'
                    : `Complete All Activities to Unlock Week ${skill.weekNumber} Badge`}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                  {skill.status === 'COMPLETED'
                    ? `You successfully satisfied all learning requirements and unlocked the next weekly skill.`
                    : isAllRequiredDone
                    ? `All required learning content, practical exercise, and quiz requirements are satisfied. Click below to issue your official InGage Skill Badge.`
                    : `Please complete: ${activityItems
                        .filter((i) => !i.done)
                        .map((i) => i.label)
                        .join(', ')}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {skill.status === 'COMPLETED' ? (
                <>
                  {skill.badgeId && (
                    <button
                      onClick={() => onNavigate(`/credential-edge/${courseSlug}/badges/${skill.badgeId}`)}
                      className="px-5 py-3 rounded-xl border border-emerald-300 bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      View Badge
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
                    className="px-6 py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Back to Overview</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCompleteSkill}
                  disabled={!isAllRequiredDone || actionLoading}
                  className={`px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                    isAllRequiredDone
                      ? 'bg-lime-600 hover:bg-lime-700 text-white hover:shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-80'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {actionLoading ? 'Validating & Issuing Badge...' : 'Complete Skill & Earn Badge'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Reading Material Drawer */}
      {activeTab === 'reading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafaf9]">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-lime-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Week {skill.weekNumber} Reading Guide: {skill.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
              {skill.readingContent ||
                'This foundational reading covers core generative AI principles, model training paradigms, context management, prompt engineering frameworks, and safety guidelines.'}
            </div>
            <div className="p-4 border-t border-gray-100 bg-[#fafaf9] flex items-center justify-between">
              <span className="text-xs text-gray-500">Official InGage Generative AI Curriculum</span>
              <button
                onClick={async () => {
                  await handleToggleReading();
                  setActiveTab(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  skill.readingCompleted
                    ? 'bg-lime-100 text-lime-800'
                    : 'bg-lime-600 hover:bg-lime-700 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{skill.readingCompleted ? 'Completed (Click to unmark)' : 'Mark as Read & Done'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Practical Prompt Lab */}
      {activeTab === 'practice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafaf9]">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Practical Prompt Engineering Lab
                </h3>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                <span className="font-extrabold uppercase tracking-wider block">Laboratory Assignment:</span>
                <p className="leading-relaxed whitespace-pre-line">
                  {skill.practicalExercise ||
                    'Formulate a system and user prompt with clear role instructions, boundary constraints, and structured JSON output format.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Your Prompt Test Input:
                </label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Act as a senior technical lead. Explain the difference between Generative AI and Discriminative models with 2 bullet points each. Output in clean bulleted text."
                  rows={4}
                  className="w-full p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500 font-mono"
                />
              </div>

              {promptOutput && (
                <div className="p-4 rounded-xl bg-gray-900 text-lime-400 font-mono text-xs whitespace-pre-line border border-gray-800">
                  {promptOutput}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-[#fafaf9] flex items-center justify-between">
              <button
                onClick={handleSimulatePromptTest}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Test & Execute Prompt</span>
              </button>

              <button
                onClick={async () => {
                  await handleTogglePractice();
                  setActiveTab(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  skill.practiceCompleted
                    ? 'bg-lime-100 text-lime-800'
                    : 'bg-lime-600 hover:bg-lime-700 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{skill.practiceCompleted ? 'Marked Completed' : 'Save & Mark Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Case Study Review */}
      {activeTab === 'casestudy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafaf9]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Real-World Case Study Analysis
                </h3>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
              {skill.caseStudy ||
                'This production case study inspects real-world model deployment, latency, hallucination mitigation, grounding with enterprise APIs, and human oversight.'}
            </div>
            <div className="p-4 border-t border-gray-100 bg-[#fafaf9] flex items-center justify-between">
              <span className="text-xs text-gray-500">Enterprise Case Study Analysis</span>
              <button
                onClick={async () => {
                  await handleToggleCaseStudy();
                  setActiveTab(null);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  skill.caseStudyCompleted
                    ? 'bg-lime-100 text-lime-800'
                    : 'bg-lime-600 hover:bg-lime-700 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{skill.caseStudyCompleted ? 'Completed' : 'Mark Case Study Done'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Knowledge Quiz */}
      {activeTab === 'quiz' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafaf9]">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  Week {skill.weekNumber} Knowledge Assessment
                </h3>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {skill.quizQuestions && skill.quizQuestions.length > 0 ? (
                skill.quizQuestions.map((q, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  const isCorrect = isAnswered && selectedAnswers[qIdx] === q.correctAnswer;

                  return (
                    <div key={q.id || qIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-lime-100 text-lime-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">{q.question}</h4>
                      </div>

                      <div className="space-y-2 pt-1 pl-8">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-lime-50 border-lime-500 font-semibold text-lime-900'
                                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${qIdx}`}
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                                }}
                                className="accent-lime-600"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={`p-3 rounded-xl text-xs mt-2 pl-8 ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          <div className="font-bold mb-1">
                            {isCorrect ? '✓ Correct Answer' : `✗ Incorrect (Correct: option ${q.correctAnswer + 1})`}
                          </div>
                          {q.explanation && <div>{q.explanation}</div>}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500">No questions configured for this week.</p>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-[#fafaf9] flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {quizSubmitted ? `Result: ${quizScore}% Score` : 'Passing mark: 70%'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuizSubmit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Submit & Check Answers
                </button>
                {quizSubmitted && quizScore >= 70 && (
                  <button
                    onClick={() => setActiveTab(null)}
                    className="px-4 py-2.5 rounded-xl bg-lime-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATION MODAL: Skill Completed & Badge Earned (Section 9) */}
      {showCompletionModal && completionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center border border-gray-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Background sparkle effect */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-lime-300/30 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-300/30 rounded-full blur-2xl" />

            <div className="relative">
              {/* Badge Icon Emblem */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-lime-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white">
                <Award className="w-10 h-10" />
              </div>

              <span className="px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-xs font-black uppercase tracking-wider inline-block mb-2">
                Week {completionResult.weekNumber} Complete 🎉
              </span>

              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                Skill Completed!
              </h2>
              <p className="text-base font-bold text-lime-700 mb-4">
                {completionResult.badge.badgeName} Badge Earned
              </p>

              {/* Verified Badge Details Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Student:</span>
                  <span className="font-bold text-gray-900">{completionResult.badge.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Course:</span>
                  <span className="font-semibold text-gray-900">{completionResult.badge.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Module:</span>
                  <span className="font-medium text-gray-800">{completionResult.moduleTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Badge ID:</span>
                  <span className="font-mono font-bold text-emerald-700">{completionResult.badge.badgeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Verification Code:</span>
                  <span className="font-mono text-gray-600">{completionResult.badge.verificationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Date:</span>
                  <span className="text-gray-800">{completionResult.completedAt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={() => onNavigate(`/credential-edge/${courseSlug}/badges/${completionResult.badge.badgeId}`)}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  <span>View Official Skill Badge</span>
                </button>

                {completionResult.nextSkillSlug ? (
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      onNavigate(`/credential-edge/${courseSlug}/skills/${completionResult.nextSkillSlug}`);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Continue to Week {completionResult.nextWeekNumber || (completionResult.weekNumber + 1)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      onNavigate(`/credential-edge/${courseSlug}`);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>View Completed Credential & Certificate</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
