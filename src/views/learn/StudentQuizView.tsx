"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Clock,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
  X,
  ListChecks,
  Eye,
  Info,
  Brain,
  ShieldCheck,
  Target,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import {
  getLessonQuiz,
  submitQuizAnswer,
  parseQuizMeta,
  QuizQuestion,
  QuizSubmitResponse,
  QuizQuestionResult,
  QuizMetadata,
} from '@/api/quizApi';

interface StudentQuizViewProps {
  courseId?: number | string;
  quizzes?: any[];
  completedLessonIds?: number[];
  onCompleteQuiz?: (quizId: number) => void;
}

type QuizScreen = 'list' | 'taking' | 'result' | 'review';

function formatOptionText(text: string, idx: number): string {
  const trimmed = text.trim();
  if (/^[A-D][\)\.\:\-]\s*/i.test(trimmed)) {
    return trimmed;
  }
  const letter = String.fromCharCode(65 + idx);
  return `${letter}) ${trimmed}`;
}

export const StudentQuizView: React.FC<StudentQuizViewProps> = ({
  courseId = 0,
  quizzes = [],
  completedLessonIds = [],
  onCompleteQuiz,
}) => {
  // Screen management: 'list' | 'taking' | 'result' | 'review'
  const [screen, setScreen] = useState<QuizScreen>('list');
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

  // Questions & loading
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active quiz runner state
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [isTimeUpNotice, setIsTimeUpNotice] = useState<boolean>(false);

  // Results state
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [timeTakenDisplay, setTimeTakenDisplay] = useState<string>('0 sec');

  // Local attempts & scores tracker per quiz
  const [quizAttemptsState, setQuizAttemptsState] = useState<Record<number, {
    attemptCount: number;
    maxAttempts: number;
    score: number;
    earnedMarks?: number;
    totalMarks?: number;
    passed: boolean;
    completed: boolean;
    hasNetworkIssue?: boolean;
  }>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`ingage_quiz_attempts_${courseId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  const [activeTooltipQuizId, setActiveTooltipQuizId] = useState<number | string | null>(null);
  const [hoveredTooltipQuizId, setHoveredTooltipQuizId] = useState<number | string | null>(null);
  const networkIssueOccurredRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`ingage_quiz_attempts_${courseId}`);
        if (saved) {
          setQuizAttemptsState(JSON.parse(saved));
        }
      }
    } catch {}
  }, [courseId]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveTooltipQuizId(null);
    };
    const handleOffline = () => {
      networkIssueOccurredRef.current = true;
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleDocumentClick);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('click', handleDocumentClick);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Active quiz metadata
  const quizMeta: QuizMetadata = useMemo(() => {
    return parseQuizMeta(activeQuiz?.description || activeQuiz?.raw?.description);
  }, [activeQuiz]);

  const passingScore = useMemo(() => {
    if (activeQuiz?.passingScore && activeQuiz.passingScore > 0) return activeQuiz.passingScore;
    return quizMeta.passingScore > 0 ? quizMeta.passingScore : 70;
  }, [activeQuiz?.passingScore, quizMeta.passingScore]);

  const timeLimitMinutes = useMemo(() => {
    if (activeQuiz?.timeLimit && activeQuiz.timeLimit > 0) return activeQuiz.timeLimit;
    if (quizMeta.timeLimit > 0) return quizMeta.timeLimit;
    if (activeQuiz?.durationSeconds && activeQuiz.durationSeconds > 0) {
      return Math.round(activeQuiz.durationSeconds / 60);
    }
    return 15;
  }, [activeQuiz?.timeLimit, quizMeta.timeLimit, activeQuiz?.durationSeconds]);

  // Format seconds to MM:SS
  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Assessment Handler - loads EXACT quiz stored in backend
  const handleStartAssessment = async (quiz: any) => {
    networkIssueOccurredRef.current = false;
    setActiveQuiz(quiz);
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setCurrentIdx(0);
    setResult(null);
    setIsTimeUpNotice(false);
    setShowConfirmSubmit(false);

    const meta = parseQuizMeta(quiz.description || quiz.raw?.description);
    const maxAtt = meta.maxAttempts || quiz.maxAttempts || 1;
    const attemptInfo = quizAttemptsState[quiz.id];
    const currentAtt = Math.max(
      Number(quiz.attemptCount ?? quiz.attemptsUsed ?? 0),
      Number(attemptInfo?.attemptCount ?? 0)
    );
    if (currentAtt >= maxAtt) {
      setError('You have reached the maximum allowed attempts for this quiz.');
      setLoading(false);
      return;
    }

    const status = meta.status || quiz.status || 'Active';
    if (status === 'Inactive' || status === 'INACTIVE') {
      setError('This quiz is currently inactive and cannot be started.');
      setLoading(false);
      return;
    }

    try {
      // Load real questions from backend
      const qList = await getLessonQuiz(courseId, quiz.id);

      if (!qList || qList.length === 0) {
        setError('No questions have been configured for this quiz yet.');
        setQuestions([]);
        setLoading(false);
        return;
      }

      setQuestions(qList);

      const limitMins =
        quiz.timeLimit ||
        meta.timeLimit ||
        (quiz.durationSeconds ? Math.round(quiz.durationSeconds / 60) : 15);
      const totalSec = Math.max(60, limitMins * 60);

      // Initialize real timer from backend configured time limit
      startTimeRef.current = Date.now();
      setSecondsLeft(totalSec);
      setScreen('taking');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load assessment questions.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Retake Assessment Handler
  const handleRetakeAssessment = () => {
    if (!activeQuiz) return;
    handleStartAssessment(activeQuiz);
  };

  // Timer Tick while taking assessment
  useEffect(() => {
    if (screen !== 'taking' || secondsLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsTimeUpNotice(true);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [screen, secondsLeft]);

  // Option select handler
  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Final submission evaluation handled entirely by backend
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!activeQuiz || isSubmitting) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setShowConfirmSubmit(false);
    setIsSubmitting(true);
    setError(null);

    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const formattedTime = mins > 0 ? `${mins} min ${secs} sec` : `${secs} sec`;
    setTimeTakenDisplay(formattedTime);

    const hadNetworkIssueWhileTaking = Boolean(
      networkIssueOccurredRef.current ||
      (activeQuiz as any)?.hasNetworkIssue ||
      (activeQuiz as any)?.networkIssue
    );

    try {
      const res = await submitQuizAnswer(courseId, activeQuiz.id, {
        answers: selectedAnswers,
        timeTakenSeconds: elapsedSeconds,
        networkIssue: hadNetworkIssueWhileTaking,
        completionReason: hadNetworkIssueWhileTaking ? 'NETWORK_ISSUE' : 'NORMAL_COMPLETION',
      });

      setResult(res);
      setScreen('result');

      const attemptNum = res.attemptCount ?? ((quizAttemptsState[activeQuiz.id]?.attemptCount ?? 0) + 1);
      const maxAtt = res.maxAttempts ?? quizMeta.maxAttempts ?? 1;
      const isPassed = Boolean(res.passed);
      const isLimitReached = attemptNum >= maxAtt;
      const isCompleted = isPassed || isLimitReached;
      const hadNetworkIssue = Boolean(
        hadNetworkIssueWhileTaking ||
        (res as any)?.hasNetworkIssue ||
        (res as any)?.networkIssue
      );

      const newAttemptData = {
        attemptCount: attemptNum,
        maxAttempts: maxAtt,
        score: res.score ?? res.scorePercentage ?? 0,
        earnedMarks: res.earnedMarks ?? Math.round(((res.score ?? 0) / 100) * (quizMeta.totalMarks || 100)),
        totalMarks: res.totalMarks ?? quizMeta.totalMarks ?? 100,
        passed: isPassed,
        completed: isCompleted,
        hasNetworkIssue: hadNetworkIssue,
      };

      setQuizAttemptsState((prev) => {
        const next = { ...prev, [activeQuiz.id]: newAttemptData };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`ingage_quiz_attempts_${courseId}`, JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      if (onCompleteQuiz) {
        onCompleteQuiz(activeQuiz.id);
      }
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      // Attempt finished or marked complete because of network failure:
      // - Count the attempt as used
      // - Set hasNetworkIssue flag to show ? icon
      // - If max attempts reached, keep Start disabled and keep ? icon visible
      const prevAttempt = quizAttemptsState[activeQuiz.id];
      const maxAtt = quizMeta.maxAttempts || 1;
      const nextAttemptCount = (prevAttempt?.attemptCount ?? 0) + 1;
      const isLimitReached = nextAttemptCount >= maxAtt;

      const networkAttemptData = {
        attemptCount: nextAttemptCount,
        maxAttempts: maxAtt,
        score: prevAttempt?.score ?? 0,
        earnedMarks: prevAttempt?.earnedMarks ?? 0,
        totalMarks: quizMeta.totalMarks ?? 100,
        passed: false,
        completed: isLimitReached,
        hasNetworkIssue: true,
      };

      setQuizAttemptsState((prev) => {
        const next = { ...prev, [activeQuiz.id]: networkAttemptData };
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`ingage_quiz_attempts_${courseId}`, JSON.stringify(next));
          }
        } catch {}
        return next;
      });

      // Persist network issue attempt to backend database
      const syncAttemptToBackend = async () => {
        try {
          await submitQuizAnswer(courseId, activeQuiz.id, {
            answers: selectedAnswers,
            timeTakenSeconds: elapsedSeconds,
            networkIssue: true,
            completionReason: 'NETWORK_ISSUE',
            isNetworkIssueFinalize: true,
          });
        } catch {
          const handleOnline = async () => {
            try {
              await submitQuizAnswer(courseId, activeQuiz.id, {
                answers: selectedAnswers,
                timeTakenSeconds: elapsedSeconds,
                networkIssue: true,
                completionReason: 'NETWORK_ISSUE',
                isNetworkIssueFinalize: true,
              });
              window.removeEventListener('online', handleOnline);
            } catch {}
          };
          if (typeof window !== 'undefined') {
            window.addEventListener('online', handleOnline);
          }
        }
      };
      syncAttemptToBackend();

      if (onCompleteQuiz) {
        onCompleteQuiz(activeQuiz.id);
      }

      setError('This attempt was affected by a network issue while taking the quiz. The attempt has been counted. Please contact support if you need a retake.');
      setScreen('list');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit button click: verify if all answered
  const handleAttemptSubmit = () => {
    const unanswered = questions.filter((q) => selectedAnswers[q.id] === undefined).length;
    if (unanswered > 0) {
      setShowConfirmSubmit(true);
    } else {
      handleFinalSubmit(false);
    }
  };

  // Counts for current question runner
  const currentQ = questions[currentIdx] || questions[0];
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[Number(k)] !== undefined
  ).length;

  // Expanded rows state for table view
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

  const toggleExpand = (id: number | string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Format quiz list items dynamically strictly from backend data (NO hardcoded quizzes)
  const displayQuizzes = useMemo(() => {
    if (!quizzes || quizzes.length === 0) {
      return [];
    }

    return quizzes.map((q, idx) => {
      const meta = parseQuizMeta(q.description);
      const pass = meta.passingScore > 0 ? meta.passingScore : (q.passingScore || 70);
      const time = meta.timeLimit > 0 ? meta.timeLimit : (q.timeLimit || 15);
      const count = meta.numberOfQuestions || meta.questionsCount || (q.quizQuestions ? q.quizQuestions.length : 0);
      const marks = meta.totalMarks || (count > 0 ? count : 100);
      const attemptsAllowed = meta.maxAttempts || 1;
      const weekStr = meta.weekNumber || meta.order || `Quiz ${idx + 1}`;
      const cleanDesc = meta.quizDescription || meta.description || q.shortDescription || '';

      const attemptInfo = quizAttemptsState[q.id];
      const isDone = completedLessonIds.includes(q.id) || attemptInfo?.completed || Boolean(q.completed);
      const backendAttempts = Number(q.attemptCount ?? q.attemptsUsed ?? 0);
      const stateAttempts = Number(attemptInfo?.attemptCount ?? 0);
      const actualAttempts = Math.max(backendAttempts, stateAttempts, isDone ? 1 : 0);
      const isAttemptLimitReached = actualAttempts >= attemptsAllowed;
      const isStartDisabled = actualAttempts >= attemptsAllowed;
      const hasNetworkIssue = Boolean(
        Boolean(q.networkIssue) ||
        Boolean(q.hasNetworkIssue) ||
        Boolean(attemptInfo?.hasNetworkIssue) ||
        Boolean(meta?.hasNetworkIssue) ||
        Boolean(meta?.networkIssue)
      );
      const finalScore = attemptInfo ? (attemptInfo.earnedMarks ?? attemptInfo.score) : (isDone ? marks : 0);
      const st = meta.status || 'Active';

      return {
        id: q.id,
        week: weekStr,
        title: q.title || weekStr,
        subtitle: meta.quizTitle || q.title || `Assessment ${idx + 1}`,
        description: cleanDesc,
        questionsCount: count,
        timeLimit: time,
        passingScore: pass,
        totalMarks: marks,
        score: finalScore,
        attempts: `${actualAttempts}/${attemptsAllowed}`,
        attemptCount: actualAttempts,
        maxAttempts: attemptsAllowed,
        isAttemptLimitReached,
        isStartDisabled,
        hasNetworkIssue,
        completed: isDone || isAttemptLimitReached,
        passed: attemptInfo?.passed ?? isDone,
        status: st,
        raw: q,
      };
    });
  }, [quizzes, completedLessonIds, quizAttemptsState]);

  // Summary Metrics Stats calculated dynamically from real quizzes
  const stats = useMemo(() => {
    const totalCount = displayQuizzes.length;
    const completedList = displayQuizzes.filter((q) => q.completed);
    const completedCount = completedList.length;

    const totalScore = displayQuizzes.reduce((acc, q) => acc + (q.totalMarks || 0), 0);
    const earnedScore = completedList.reduce((acc, q) => acc + (q.score || 0), 0);
    const averageScore = totalScore > 0 ? (earnedScore / totalScore) * 100 : (completedCount > 0 ? 100 : 0);

    return {
      totalCount,
      completedCount,
      totalScore,
      earnedScore,
      averageScore,
    };
  }, [displayQuizzes]);

  // =========================================================================
  // SCREEN 4: REVIEW ANSWERS
  // =========================================================================
  if (screen === 'review' && result && activeQuiz) {
    const questionResults: QuizQuestionResult[] = result.questionResults || result.results || [];

    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
        {/* Review Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('result')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Back to Results"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Review Answers
              </h3>
              <span className="text-xs text-slate-500 font-medium">{activeQuiz.title}</span>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Score: {result.score ?? result.scorePercentage ?? 0}%
          </span>
        </div>

        {/* Questions Review List */}
        <div className="space-y-6">
          {questionResults.map((qRes, qIdx) => {
            const isCorrect = Boolean(qRes.isCorrect ?? qRes.correct);
            const options: string[] = qRes.options || [];
            const selectedIdx = qRes.selectedOptionIndex;
            const correctIdx = qRes.correctOptionIndex ?? 0;

            const selectedText =
              selectedIdx !== null && selectedIdx !== undefined && options[selectedIdx]
                ? `${String.fromCharCode(65 + selectedIdx)}) ${options[selectedIdx]}`
                : qRes.selectedAnswerText || 'Not Answered';

            const correctText = options[correctIdx]
              ? `${String.fromCharCode(65 + correctIdx)}) ${options[correctIdx]}`
              : qRes.correctAnswerText || `Option ${String.fromCharCode(65 + correctIdx)}`;

            return (
              <div
                key={qRes.questionId || qIdx}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {qIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Question {qIdx + 1} of {questionResults.length}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {qRes.questionText}
                </h4>

                {/* 2-Column Answer Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Your Answer */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Your Answer</span>
                    <div
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                          : selectedIdx === null || selectedIdx === undefined
                          ? 'border-slate-200 bg-slate-50 text-slate-400'
                          : 'border-rose-500 bg-rose-50/50 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isCorrect ? 'border-emerald-600 bg-emerald-600' : 'border-rose-600 bg-rose-600'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        </span>
                        <span className="truncate">{selectedText}</span>
                      </div>
                      {isCorrect ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                      ) : selectedIdx !== null && selectedIdx !== undefined ? (
                        <X className="w-4 h-4 text-rose-600 shrink-0 stroke-[3]" />
                      ) : null}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-500">Correct Answer</span>
                    <div className="p-3.5 rounded-xl border border-emerald-500 bg-emerald-50/50 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                        </span>
                        <span className="truncate">{correctText}</span>
                      </div>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Explanation Box from Backend */}
                {qRes.explanation && (
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-sky-800 font-bold">
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      <span>Explanation</span>
                    </div>
                    <p className="text-slate-700 pl-5">{qRes.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setScreen('result')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ← Back to Results
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetakeAssessment}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveQuiz(null);
                setScreen('list');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 3: QUIZ RESULT SCREEN
  // =========================================================================
  if (screen === 'result' && result && activeQuiz) {
    const isPassed = Boolean(result.passed);
    const scoreVal = result.score ?? result.scorePercentage ?? 0;
    const totalQ = result.totalQuestions || questions.length || 0;
    const correctVal = result.correctCount ?? result.correctAnswers ?? 0;
    const wrongVal = result.wrongCount ?? result.wrongAnswers ?? 0;

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 px-1">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-1">
              <span className="w-1.5 h-3.5 bg-emerald-600 rounded-xs" />
              <span className="w-1.5 h-5 bg-emerald-600 rounded-xs" />
              <span className="w-1.5 h-2.5 bg-emerald-600 rounded-xs" />
            </div>
            <div className="leading-none">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">InGage</span>
              <span className="text-[10px] text-slate-500 font-semibold ml-1">LMS</span>
            </div>
          </div>

          <div className="text-center hidden sm:block">
            <h3 className="text-base font-extrabold text-slate-900">{activeQuiz.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              Pass Score: {result.passingScore ?? passingScore}%
            </span>
          </div>
        </div>

        {/* Centered Result Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-200">
          <div
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center mx-auto shadow-xs ${
              isPassed ? 'bg-[#16A34A]' : 'bg-rose-600'
            }`}
          >
            {isPassed ? <Check className="w-8 h-8 stroke-[3]" /> : <X className="w-8 h-8 stroke-[3]" />}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quiz Completed!
            </h2>

            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 flex items-center justify-center gap-3">
              <span>
                {correctVal} / {totalQ}
              </span>
              <span className={isPassed ? 'text-[#16A34A]' : 'text-rose-600'}>{scoreVal}%</span>
            </div>

            <div className="mt-3">
              {isPassed ? (
                <span className="inline-block px-4 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A]">
                  Passed
                </span>
              ) : (
                <span className="inline-block px-4 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  Failed
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-md mx-auto">
              {isPassed
                ? `Congratulations! You scored ${scoreVal}%. You passed the assessment requirement of ${result.passingScore ?? passingScore}%.`
                : `You scored ${scoreVal}%. You needed ${result.passingScore ?? passingScore}% to pass this assessment.`}
            </p>
          </div>

          {/* 3 Stat Cards in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Correct Answers</p>
                <p className="text-lg font-bold text-[#16A34A] leading-tight">{correctVal}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Wrong Answers</p>
                <p className="text-lg font-bold text-rose-600 leading-tight">{wrongVal}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Time Taken</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {timeTakenDisplay}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => setScreen('review')}
              className="w-full sm:w-auto px-7 py-3 rounded-xl text-xs sm:text-sm font-bold border-2 border-[#16A34A] text-[#16A34A] hover:bg-[#F0FDF4] transition cursor-pointer"
            >
              Review Answers
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveQuiz(null);
                setScreen('list');
              }}
              className="w-full sm:w-auto px-7 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#F97316] hover:bg-[#EA580C] text-white transition cursor-pointer shadow-xs"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: QUIZ TAKING SCREEN
  // =========================================================================
  if (screen === 'taking' && activeQuiz) {
    const questionNumber = currentIdx + 1;
    const totalQuestions = questions.length;
    const progressPercent = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Bar with Back to Quizzes button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                setScreen('list');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Return to Quizzes List"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Quizzes</span>
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-end gap-1">
                <span className="w-1.5 h-3.5 bg-emerald-600 rounded-xs" />
                <span className="w-1.5 h-5 bg-emerald-600 rounded-xs" />
                <span className="w-1.5 h-2.5 bg-emerald-600 rounded-xs" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">InGage</span>
                <span className="text-[10px] text-slate-500 font-semibold ml-1">EduTech</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {activeQuiz.title}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Question {questionNumber} of {totalQuestions}
            </p>
            <div className="w-40 sm:w-52 h-1.5 bg-slate-200 rounded-full overflow-hidden mx-auto mt-1.5">
              <div
                className="bg-[#16A34A] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>{formatMMSS(secondsLeft)} remaining</span>
            </div>
          </div>
        </div>

        {/* Confirmation Modal when submitting with unanswered questions */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Unanswered Questions</h4>
                <p className="text-xs text-slate-600 mt-1">
                  You have <strong>{totalQuestions - answeredCount}</strong> unanswered question(s). Are you sure you want to submit your assessment?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Question Card dynamically rendering Admin Questions */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold text-white bg-[#16A34A]">
              Question {questionNumber}
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
            {currentQ?.questionText}
          </h2>

          {/* Multiple Choice Options dynamically rendered from Backend */}
          <div className="space-y-3 pt-1">
            {currentQ?.options?.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              const formattedOption = formatOptionText(opt, optIdx);

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm transition-all duration-200 flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#16A34A] bg-[#F0FDF4] text-slate-900 font-semibold'
                      : 'border border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-[#16A34A] bg-[#16A34A]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </span>

                  <span className="tracking-tight">{formattedOption}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="max-w-4xl mx-auto flex items-center justify-between pt-4 px-2">
          <button
            type="button"
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {questions.map((_, dotIdx) => {
              const isCurrent = dotIdx === currentIdx;
              const isAnswered = selectedAnswers[questions[dotIdx]?.id] !== undefined;

              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIdx(dotIdx)}
                  className={`rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'w-3.5 h-3.5 bg-[#16A34A]'
                      : isAnswered
                      ? 'w-2.5 h-2.5 bg-emerald-300 hover:bg-emerald-400'
                      : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Question ${dotIdx + 1}`}
                />
              );
            })}
          </div>

          {currentIdx < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => prev + 1)}
              className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAttemptSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Submit Quiz</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 1: QUIZZES LIST PAGE (Strictly Displays Admin-Created Quizzes)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Quizzes & Knowledge Checks Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Course Quizzes &amp; Knowledge Checks
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Assess your retention across topics. Quizzes are evaluated independently from video lectures.
        </p>
      </div>

      {/* 3 Summary Metric Cards Matching Reference Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#E8EFFF] border border-[#D2DCF8] shadow-xs">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            Total No. of Quiz Completed
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
            {stats.completedCount} / {stats.totalCount}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#EAE8F5] border border-[#DAD5EB] shadow-xs">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            Total Score
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
            {stats.earnedScore} / {stats.totalScore}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#FEF7D6] border border-[#F7EDB5] shadow-xs">
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            Average Score Per Quiz
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
            {stats.averageScore.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Section Title */}
      <div className="pt-2">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          List of Quiz ({displayQuizzes.length})
        </h3>
      </div>

      {/* Real Quizzes Table or Empty State */}
      {displayQuizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No Quizzes Published Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are no active quiz assessments added to this course by the administrator. Please check back later.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-xs font-bold text-slate-700">
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold">Time Limit (min)</th>
                  <th className="px-6 py-4 font-bold">No. of Questions</th>
                  <th className="px-6 py-4 font-bold">No. of Attempts</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {displayQuizzes.map((quiz) => {
                  const isExpanded = expandedIds.has(quiz.id);
                  const isInactive = quiz.status === 'Inactive' || quiz.status === 'INACTIVE';

                  return (
                    <React.Fragment key={quiz.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(quiz.id)}
                              className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                              title={isExpanded ? 'Collapse' : 'Expand details'}
                            >
                              {isExpanded ? (
                                <Minus className="w-3.5 h-3.5 text-slate-700" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>
                            <div>
                              <span className="font-semibold text-slate-800">{quiz.title}</span>
                              {isInactive && (
                                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {quiz.timeLimit}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {quiz.questionsCount}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {quiz.attempts}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {isInactive ? (
                            <span className="text-xs font-semibold text-slate-400">
                              Unavailable
                            </span>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2">
                              {quiz.isStartDisabled ? (
                                <button
                                  type="button"
                                  disabled
                                  aria-disabled="true"
                                  className="px-5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none shadow-none pointer-events-none"
                                >
                                  Start
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartAssessment(quiz.raw || quiz)}
                                  className="px-5 py-1.5 rounded-lg text-xs font-semibold bg-[#F3F4F6] hover:bg-[#F97316] hover:text-white text-slate-600 transition shadow-2xs cursor-pointer border border-slate-200/60"
                                >
                                  Start
                                </button>
                              )}

                              {quiz.hasNetworkIssue && (
                                <div className="relative inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTooltipQuizId((prev) => (prev === quiz.id ? null : quiz.id));
                                    }}
                                    onMouseEnter={() => setHoveredTooltipQuizId(quiz.id)}
                                    onMouseLeave={() => setHoveredTooltipQuizId(null)}
                                    className="w-5 h-5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-[11px] font-bold transition shadow-2xs cursor-pointer focus:outline-hidden"
                                    title="This attempt was affected by a network issue while taking the quiz. The attempt has been counted. Please contact support if you need a retake."
                                    aria-label="Quiz attempt affected by network issue"
                                  >
                                    ?
                                  </button>

                                  {(hoveredTooltipQuizId === quiz.id || activeTooltipQuizId === quiz.id) && (
                                    <div
                                      role="tooltip"
                                      aria-live="polite"
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-72 p-3 bg-slate-900 text-white text-xs font-normal rounded-xl shadow-xl z-50 text-left leading-relaxed border border-slate-700 pointer-events-auto"
                                    >
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <span>
                                          This attempt was affected by a network issue while taking the quiz. The attempt has been counted. Please contact support if you need a retake.
                                        </span>
                                      </div>
                                      <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-slate-900" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                    {quiz.title}
                                  </h4>
                                  {quiz.description ? (
                                    <p className="text-xs text-slate-600 mt-1">
                                      {quiz.description}
                                    </p>
                                  ) : null}
                                </div>
                                {!isInactive && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    {quiz.isStartDisabled ? (
                                      <button
                                        type="button"
                                        disabled
                                        aria-disabled="true"
                                        className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed select-none pointer-events-none"
                                      >
                                        Start
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleStartAssessment(quiz.raw || quiz)}
                                        className="px-4 py-1.5 rounded-lg bg-[#00A86B] hover:bg-[#008F5B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                      >
                                        Start
                                      </button>
                                    )}

                                    {quiz.hasNetworkIssue && (
                                      <div className="relative inline-flex items-center">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTooltipQuizId((prev) => (prev === `exp-${quiz.id}` ? null : `exp-${quiz.id}`));
                                          }}
                                          onMouseEnter={() => setHoveredTooltipQuizId(`exp-${quiz.id}`)}
                                          onMouseLeave={() => setHoveredTooltipQuizId(null)}
                                          className="w-5 h-5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-[11px] font-bold transition shadow-2xs cursor-pointer focus:outline-hidden"
                                          title="This attempt was affected by a network issue while taking the quiz. The attempt has been counted. Please contact support if you need a retake."
                                          aria-label="Quiz attempt affected by network issue"
                                        >
                                          ?
                                        </button>

                                        {(hoveredTooltipQuizId === `exp-${quiz.id}` || activeTooltipQuizId === `exp-${quiz.id}`) && (
                                          <div
                                            role="tooltip"
                                            aria-live="polite"
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-72 p-3 bg-slate-900 text-white text-xs font-normal rounded-xl shadow-xl z-50 text-left leading-relaxed border border-slate-700 pointer-events-auto"
                                          >
                                            <div className="flex items-start gap-2">
                                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                              <span>
                                                This attempt was affected by a network issue while taking the quiz. The attempt has been counted. Please contact support if you need a retake.
                                              </span>
                                            </div>
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-slate-900" />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100">
                                <span className="text-slate-500">
                                  Time Limit: <strong className="text-slate-800">{quiz.timeLimit} min</strong>
                                </span>
                                <span className="text-slate-500">
                                  Questions: <strong className="text-slate-800">{quiz.questionsCount} MCQs</strong>
                                </span>
                                <span className="text-slate-500">
                                  Pass Score: <strong className="text-emerald-700">{quiz.passingScore}%</strong>
                                </span>
                                <span className="text-slate-500">
                                  Total Marks: <strong className="text-slate-800">{quiz.totalMarks} Marks</strong>
                                </span>
                                <span className="text-slate-500">
                                  Max Attempts: <strong className="text-slate-800">{quiz.maxAttempts}</strong>
                                </span>
                                <span className="text-slate-500">
                                  Status: <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isInactive
                                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>{quiz.status}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
