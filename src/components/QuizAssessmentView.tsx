"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Award,
  Check,
  X,
  ListChecks,
  Loader2,
} from 'lucide-react';
import {
  QuizQuestion,
  QuizQuestionResult,
  QuizSubmitResponse,
  getLessonQuiz,
  submitQuizAnswer,
  parseQuizMeta,
  QuizMetadata
} from '../api/quizApi';
export interface QuizLessonItem {
  id: number;
  title: string;
  description?: string;
  duration?: string;
  durationSeconds?: number;
  lessonType?: string;
  sectionId?: number;
  sectionTitle?: string;
  isCompleted?: boolean;
  locked?: boolean;
  [key: string]: any;
}

interface QuizAssessmentViewProps {
  courseId: number | string;
  courseTitle?: string;
  allQuizzes: QuizLessonItem[];
  completedLessonIds: number[];
  initialQuizId?: number | null;
  onQuizCompleted: (quizLessonId: number, score: number, passed: boolean) => void;
  onNavigateToCourse?: () => void;
}

type AssessmentScreen = 'list' | 'taking' | 'result' | 'review';

export function QuizAssessmentView({
  courseId,
  courseTitle,
  allQuizzes,
  completedLessonIds,
  initialQuizId = null,
  onQuizCompleted,
  onNavigateToCourse,
}: QuizAssessmentViewProps) {
  // Current active quiz
  const [activeQuizId, setActiveQuizId] = useState<number | null>(initialQuizId);
  const [screen, setScreen] = useState<AssessmentScreen>(initialQuizId ? 'taking' : 'list');

  // Quiz questions & loading
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active quiz metadata
  const activeQuizLesson = useMemo(() => {
    return allQuizzes.find((q) => q.id === activeQuizId) || null;
  }, [allQuizzes, activeQuizId]);

  const quizMeta: QuizMetadata = useMemo(() => {
    return parseQuizMeta(activeQuizLesson?.description);
  }, [activeQuizLesson?.description]);

  // Attempt & answer state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [isTimeUpAutoSubmitted, setIsTimeUpAutoSubmitted] = useState<boolean>(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Result & review state
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Load saved attempt history from localStorage on active quiz change
  useEffect(() => {
    if (!activeQuizId) return;
    try {
      const storageKey = `ingage_quiz_attempt_${courseId}_${activeQuizId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAttemptCount(parsed.attemptCount || 0);
        if (parsed.lastResult && completedLessonIds.includes(activeQuizId)) {
          setQuizResult(parsed.lastResult);
        }
      }
    } catch {}
  }, [activeQuizId, courseId, completedLessonIds]);

  // If initialQuizId is provided, open taking screen directly
  useEffect(() => {
    if (initialQuizId) {
      setActiveQuizId(initialQuizId);
      setScreen('taking');
    }
  }, [initialQuizId]);

  // Load questions when activeQuizId changes and we are taking or reviewing
  useEffect(() => {
    if (!activeQuizId) {
      setQuestions([]);
      return;
    }

    let isMounted = true;
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessonQuiz(courseId, activeQuizId);
        if (isMounted) {
          setQuestions(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || 'Unable to load quiz questions.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [activeQuizId, courseId]);

  // Timer countdown while taking quiz
  useEffect(() => {
    if (screen !== 'taking' || quizMeta.timeLimit <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Auto submit when time expires
          setIsTimeUpAutoSubmitted(true);
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
  }, [screen, quizMeta.timeLimit]);

  // Start a quiz attempt
  const handleStartQuiz = (quiz: QuizLessonItem) => {
    setIsTimeUpAutoSubmitted(false);
    setActiveQuizId(quiz.id);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
    setShowConfirmSubmit(false);
    setError(null);

    const meta = parseQuizMeta(quiz.description);
    if (meta.status === 'Inactive' || meta.status === 'INACTIVE') {
      setError('This quiz is currently inactive and cannot be attempted.');
      return;
    }

    const maxAtt = meta.maxAttempts > 0 ? meta.maxAttempts : 1;
    if (attemptCount >= maxAtt) {
      setError(`Quiz attempt limit reached. You have already completed the maximum of ${maxAtt} attempt(s) for this quiz.`);
      return;
    }

    if (meta.timeLimit > 0) {
      setTimerSeconds(meta.timeLimit * 60);
    } else {
      setTimerSeconds(0);
    }
    startTimeRef.current = Date.now();
    setScreen('taking');
  };

  // Review a previously completed quiz
  const handleReviewPreviousQuiz = (quiz: QuizLessonItem) => {
    setActiveQuizId(quiz.id);
    try {
      const storageKey = `ingage_quiz_attempt_${courseId}_${quiz.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastResult) {
          setQuizResult(parsed.lastResult);
          setScreen('result');
          return;
        }
      }
    } catch {}
    // If no stored result, start taking
    handleStartQuiz(quiz);
  };

  // Select an option for current question
  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Final submit handler
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!activeQuizId || submitting) return;
    setShowConfirmSubmit(false);
    setSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    // Prepare answers payload
    const answersPayload = questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
    }));

    try {
      const res = await submitQuizAnswer(courseId, activeQuizId, {
        answers: answersPayload,
        timeTakenSeconds: elapsedSeconds,
      });

      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setQuizResult(res);
      setScreen('result');

      // Save attempt to localStorage
      try {
        const storageKey = `ingage_quiz_attempt_${courseId}_${activeQuizId}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            attemptCount: newAttemptCount,
            lastResult: res,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}

      // If passed, trigger LMS completion callback
      if (res.passed) {
        onQuizCompleted(activeQuizId, res.percentage || 0, true);
      }
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Quiz submission failed. Please try again.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Format time MM:SS
  const formatTimer = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredQuestionsCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredQuestionsCount;

  // -------------------------------------------------------------
  // 1. QUIZ LIST VIEW
  // -------------------------------------------------------------
  if (screen === 'list') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 select-text">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Course Quizzes &amp; Assessments</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Evaluate your comprehension and test module mastery to unlock subsequent learning content.
              </p>
            </div>
          </div>
        </div>

        {allQuizzes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Quizzes Available</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This course does not currently have any assigned quiz assessments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allQuizzes.map((quiz, idx) => {
              const meta = parseQuizMeta(quiz.description);
              const isCompleted = completedLessonIds.includes(quiz.id);

              // Check stored attempt count
              let storedAttempts = 0;
              let storedScore = 0;
              try {
                const s = localStorage.getItem(`ingage_quiz_attempt_${courseId}_${quiz.id}`);
                if (s) {
                  const p = JSON.parse(s);
                  storedAttempts = p.attemptCount || 0;
                  storedScore = p.lastResult?.percentage ?? 0;
                }
              } catch {}

              const isMaxReached = meta.maxAttempts > 0 && storedAttempts >= meta.maxAttempts;
              const displayDesc = meta.quizDescription.trim() || 'Test your understanding of core architectural and technical principles from this module.';

              return (
                <div
                  key={quiz.id}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all shadow-xs flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs">
                        Quiz {idx + 1}
                      </span>
                      {isCompleted ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed {storedScore > 0 ? `(${storedScore}%)` : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                          Not Started
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg">{quiz.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {displayDesc}
                      </p>
                    </div>

                    {/* Metadata Chips (Never raw JSON) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Passing Score</span>
                        <span className="font-bold text-slate-900 text-xs">{meta.passingScore}%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time Limit</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {meta.timeLimit > 0 ? `${meta.timeLimit} mins` : 'No Limit'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 col-span-2 flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-xs">Max Allowed Attempts:</span>
                        <span className="font-bold text-slate-900 text-xs">
                          {meta.maxAttempts > 0 ? `${storedAttempts} / ${meta.maxAttempts}` : `${storedAttempts} (Unlimited)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isMaxReached && !isCompleted ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed text-center"
                      >
                        Maximum Attempts Reached ({meta.maxAttempts}/{meta.maxAttempts})
                      </button>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewPreviousQuiz(quiz)}
                          className="flex-1 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                        >
                          Review Result
                        </button>
                        {!isMaxReached && (
                          <button
                            type="button"
                            onClick={() => handleStartQuiz(quiz)}
                            className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer text-center"
                          >
                            Retake Quiz
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartQuiz(quiz)}
                        className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Start Assessment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. TAKING ASSESSMENT SCREEN
  // -------------------------------------------------------------
  if (screen === 'taking') {
    if (loading) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">Loading quiz...</h4>
        </div>
      );
    }

    if (error || questions.length === 0) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">
            {error ? 'Unable to load this quiz' : 'No questions available'}
          </h3>
          <p className="text-xs text-slate-500">
            {error ? 'Unable to load this quiz. Please try again.' : 'This assessment does not have any questions yet.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setScreen('list')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const currentSelected = selectedAnswers[currentQ?.id];

    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 select-text">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (answeredQuestionsCount > 0) {
                if (window.confirm('Assessment is currently in progress. Your current attempt will not be saved until submitted. Are you sure you want to exit?')) {
                  setScreen('list');
                }
              } else {
                setScreen('list');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Quizzes</span>
          </button>

          <div className="text-center flex-1 min-w-[200px]">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{activeQuizLesson?.title}</h3>
            <span className="text-[11px] text-purple-700 font-semibold">
              Passing threshold: {quizMeta.passingScore}%
            </span>
          </div>

          {/* Timer Display */}
          {quizMeta.timeLimit > 0 && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                timerSeconds < 60
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : timerSeconds < 180
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time Remaining: {formatTimer(timerSeconds)}</span>
            </div>
          )}
        </div>

        {/* Progress & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Question <strong className="text-slate-900">{currentQuestionIndex + 1}</strong> of {questions.length}
            </span>
            <span>
              {answeredQuestionsCount} of {questions.length} Answered ({Math.round((answeredQuestionsCount / questions.length) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigator Grid */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Question Navigator
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 no-scrollbar flex-wrap">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center relative ${
                    isCurrent
                      ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={`Jump to Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                >
                  {idx + 1}
                  {isAnswered && !isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Question {currentQuestionIndex + 1}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {currentQ.questionText}
              </h4>
            </div>

            {/* Answer Options Radio Cards */}
            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = currentSelected === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-2 border-purple-600 bg-purple-50/70 text-purple-950 font-semibold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white text-slate-800'
                    }`}
                  >
                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected ? 'border-2 border-purple-600 bg-purple-600 text-white' : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white block" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="font-bold mr-2 text-slate-400">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Submit Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* Submit Confirmation Dialog Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <ListChecks className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Submit Assessment?</h3>
                <p className="text-xs text-slate-600">
                  You have answered <strong className="text-purple-700">{answeredQuestionsCount}</strong> of{' '}
                  <strong>{questions.length}</strong> questions.
                </p>
                {unansweredCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2 text-left">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>{unansweredCount} question(s)</strong> are currently unanswered. They will be marked as incorrect.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Continue Quiz
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Confirm &amp; Submit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. RESULT VIEW
  // -------------------------------------------------------------
  if (screen === 'result' && quizResult) {
    const passed = Boolean(quizResult.passed);
    const scorePct = quizResult.percentage || 0;
    const canRetake = quizMeta.maxAttempts <= 0 || attemptCount < quizMeta.maxAttempts;

    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 select-text max-w-3xl mx-auto">
        {isTimeUpAutoSubmitted && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h5 className="font-bold text-sm">Time&apos;s Up</h5>
              <p>Your quiz has been submitted automatically.</p>
            </div>
          </div>
        )}

        {/* Result Header Badge */}
        <div className="text-center space-y-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${
              passed ? 'bg-emerald-100 text-emerald-600 border-4 border-emerald-200' : 'bg-amber-100 text-amber-600 border-4 border-amber-200'
            }`}
          >
            {passed ? <Check className="w-10 h-10 stroke-[3]" /> : <Award className="w-10 h-10 stroke-[2.5]" />}
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {passed ? 'Assessment Passed! 🎉' : 'Assessment Completed'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {passed
                ? 'Excellent work! You have met the mastery threshold for this module quiz.'
                : `You scored ${scorePct}%. The required passing threshold is ${quizMeta.passingScore}%. Keep practicing and retake when ready.`}
            </p>
          </div>
        </div>

        {/* Score & Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Score</span>
            <span className={`text-2xl font-black block ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {scorePct}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Correct Answers</span>
            <span className="text-2xl font-black text-slate-900 block">
              {quizResult.correctCount} / {quizResult.totalQuestions}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Passing Score</span>
            <span className="text-2xl font-black text-slate-900 block">
              {quizMeta.passingScore}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Attempt</span>
            <span className="text-2xl font-black text-slate-900 block">
              {quizMeta.maxAttempts > 0 ? `${attemptCount} / ${quizMeta.maxAttempts}` : `${attemptCount}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
          {quizResult.results && quizResult.results.length > 0 && (
            <button
              type="button"
              onClick={() => setScreen('review')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ListChecks className="w-4 h-4" />
              <span>Review Answers</span>
            </button>
          )}

          {canRetake && (
            <button
              type="button"
              onClick={() => {
                if (activeQuizLesson) handleStartQuiz(activeQuizLesson);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Assessment</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setScreen('list')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer text-center"
          >
            Back to Quizzes
          </button>
          {onNavigateToCourse && (
            <button
              type="button"
              onClick={onNavigateToCourse}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Back to Course</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. REVIEW ANSWERS VIEW
  // -------------------------------------------------------------
  if (screen === 'review' && quizResult?.results) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 select-text max-w-4xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setScreen('result')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Result</span>
          </button>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-900">
              Score: {quizResult.percentage}% ({quizResult.correctCount}/{quizResult.totalQuestions} Correct)
            </span>
          </div>
        </div>

        {/* Detailed Questions List */}
        <div className="space-y-6">
          {quizResult.results.map((res, idx) => {
            const isCorrect = Boolean(res.isCorrect);
            const isUnanswered = res.selectedOptionIndex === null || res.selectedOptionIndex === undefined || res.selectedOptionIndex < 0;

            return (
              <div
                key={res.questionId || idx}
                className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isUnanswered
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question {idx + 1}
                  </span>
                  {isCorrect ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Correct
                    </span>
                  ) : isUnanswered ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                      Unanswered
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1">
                      <X className="w-3 h-3" /> Incorrect
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {res.questionText}
                </h4>

                {/* Options with Answer Markings */}
                <div className="space-y-2">
                  {(res.options || []).map((opt: string, optIdx: number) => {
                    const isUserChoice = res.selectedOptionIndex === optIdx;
                    const isCorrectAnswer = res.correctOptionIndex === optIdx;

                    let optClass = 'border-slate-200 bg-white text-slate-700';
                    if (isCorrectAnswer) {
                      optClass = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                    } else if (isUserChoice && !isCorrect) {
                      optClass = 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${optClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-white border text-xs font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>

                        <div className="shrink-0 text-xs font-bold">
                          {isCorrectAnswer && (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Correct Answer
                            </span>
                          )}
                          {isUserChoice && !isCorrectAnswer && (
                            <span className="text-rose-600 flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Your Choice
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {res.explanation && (
                  <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Explanation:</strong> {res.explanation}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setScreen('result')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Back to Result
          </button>
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return null;
}
