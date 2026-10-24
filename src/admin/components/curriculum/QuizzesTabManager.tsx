"use client";

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Lock,
  X,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  HelpCircle,
  Target,
  Percent,
  Check,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  Eye,
} from 'lucide-react';
import { StudentQuizView } from '@/views/learn/StudentQuizView';
import {
  addCourseSection,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  getCourseLesson,
} from '@/api/adminApi';

export interface QuestionItem {
  id?: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizzesTabManagerProps {
  courseId?: number | string | null;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string, type?: any) => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null | undefined>;
}

export const QuizzesTabManager: React.FC<QuizzesTabManagerProps> = ({
  courseId,
  sections,
  setSections,
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  // Extract all quiz lessons across course sections
  const allQuizzes: { quiz: any; sectionId: number | string }[] = [];
  sections.forEach((sec) => {
    const lessons = sec.lessons || sec.course_lessons || [];
    lessons.forEach((l: any) => {
      if ((l.lessonType || l.lesson_type || '').toUpperCase() === 'QUIZ') {
        allQuizzes.push({ quiz: l, sectionId: sec.id });
      }
    });
  });

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuizItem, setEditingQuizItem] = useState<{ quiz: any; sectionId: number | string } | null>(null);

  // Form Fields matching Admin specification
  const [quizTitle, setQuizTitle] = useState('Week-01, IoT Fundamentals Quiz');
  const [timeLimit, setTimeLimit] = useState(60);
  const [numberOfQuestions, setNumberOfQuestions] = useState(25);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [weekNumber, setWeekNumber] = useState('Week-01');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [quizDescription, setQuizDescription] = useState('Test your understanding of the fundamental concepts and applications of Internet of Things.');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  // Questions Builder State
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      questionText: 'Which of the following is a common communication protocol used in IoT devices?',
      options: ['HTTP', 'MQTT', 'FTP', 'SMTP'],
      correctAnswer: 1,
      explanation: 'MQTT is a lightweight messaging protocol widely used in IoT.',
    },
  ]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<{ quiz: any; sectionId: number | string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to ensure container section exists
  const getOrCreateQuizSection = async (): Promise<number | string> => {
    if (sections.length > 0) return sections[0].id;

    let activeCourseId = courseId;
    if (!activeCourseId && onSaveDraftIfNeeded) {
      activeCourseId = await onSaveDraftIfNeeded();
    }
    if (activeCourseId) {
      const res = await addCourseSection(activeCourseId, {
        title: 'Course Quizzes & Assessments',
        displayOrder: 0,
      });
      const created = res.data || res;
      const newSec = {
        id: created.id || Date.now(),
        title: created.title || 'Course Quizzes & Assessments',
        displayOrder: 0,
        lessons: [],
      };
      setSections([newSec]);
      return newSec.id;
    }
    const localSec = {
      id: `draft-sec-${Date.now()}`,
      title: 'Course Quizzes & Assessments',
      displayOrder: 0,
      lessons: [],
    };
    setSections([localSec]);
    return localSec.id;
  };

  // Open Create Quiz Modal with all 8 fields initialized
  const handleOpenCreateQuiz = () => {
    setEditingQuizItem(null);
    const nextWeek = `Week-${String(allQuizzes.length + 1).padStart(2, '0')}`;
    setQuizTitle(`${nextWeek}, IoT Fundamentals Quiz`);
    setTimeLimit(60);
    setNumberOfQuestions(25);
    setTotalMarks(100);
    setPassingScore(70);
    setMaxAttempts(1);
    setWeekNumber(nextWeek);
    setStatus('Active');
    setQuizDescription('Test your understanding of the weekly curriculum and practical concepts.');
    setQuestions([
      {
        questionText: 'Which of the following is a common communication protocol used in IoT devices?',
        options: ['HTTP', 'MQTT', 'FTP', 'SMTP'],
        correctAnswer: 1,
        explanation: 'MQTT is a lightweight messaging protocol widely used in IoT.',
      },
    ]);
    setActiveQuestionIdx(0);
    setIsEditorOpen(true);
  };

  // Open Edit Quiz Modal — Loads ALL 8 fields and existing questions
  const handleOpenEditQuiz = async (item: { quiz: any; sectionId: number | string }) => {
    setEditingQuizItem(item);
    setQuizTitle(item.quiz.title || 'Week-01, IoT Fundamentals Quiz');

    let meta: any = {};
    if (item.quiz.description) {
      try {
        if (typeof item.quiz.description === 'string' && item.quiz.description.startsWith('{')) {
          meta = JSON.parse(item.quiz.description);
        } else if (typeof item.quiz.description === 'object') {
          meta = item.quiz.description;
        } else {
          meta = { description: item.quiz.description };
        }
      } catch {
        meta = { description: item.quiz.description };
      }
    }

    const tLimit = meta.timeLimit || (item.quiz.durationSeconds ? Math.round(item.quiz.durationSeconds / 60) : 60);
    const pScore = meta.passingScore || 70;
    const numQ = meta.numberOfQuestions || meta.questionsCount || (item.quiz.quizQuestions ? item.quiz.quizQuestions.length : 25);
    const marks = meta.totalMarks || (numQ * 4) || 100;
    const maxAtt = meta.maxAttempts || 1;
    const wNum = meta.weekNumber || meta.order || 'Week-01';
    const st = meta.status || 'Active';
    const qDesc = meta.description || meta.quizDescription || (typeof item.quiz.description === 'string' && !item.quiz.description.startsWith('{') ? item.quiz.description : '');

    setTimeLimit(tLimit);
    setPassingScore(pScore);
    setNumberOfQuestions(numQ);
    setTotalMarks(marks);
    setMaxAttempts(maxAtt);
    setWeekNumber(wNum);
    setStatus(st === 'Inactive' || st === 'INACTIVE' ? 'Inactive' : 'Active');
    setQuizDescription(qDesc);

    // Fetch complete questions & options from backend
    if (item.quiz.id && !String(item.quiz.id).startsWith('draft-')) {
      try {
        const res = await getCourseLesson(item.quiz.id);
        const backendQuestions = res?.quiz_questions || res?.quizQuestions;
        if (Array.isArray(backendQuestions) && backendQuestions.length > 0) {
          const parsed: QuestionItem[] = backendQuestions.map((q: any) => {
            const rawOpts = Array.isArray(q.options)
              ? q.options
              : Array.isArray(q.quiz_question_options)
              ? q.quiz_question_options.map((o: any) => o.option_text)
              : [];

            const opts = [
              rawOpts[0] || 'HTTP',
              rawOpts[1] || 'MQTT',
              rawOpts[2] || 'FTP',
              rawOpts[3] || 'SMTP',
            ];

            let correct = 0;
            if (typeof q.correct_option_index === 'number') {
              correct = q.correct_option_index;
            } else if (typeof q.correctAnswer === 'number') {
              correct = q.correctAnswer;
            } else if (Array.isArray(q.quiz_question_options)) {
              const cIdx = q.quiz_question_options.findIndex((o: any) => o.is_correct);
              if (cIdx >= 0) correct = cIdx;
            }

            return {
              id: q.id,
              questionText: q.question_text || q.questionText || '',
              options: opts,
              correctAnswer: correct,
              explanation: q.explanation || '',
            };
          });

          setQuestions(parsed);
          setActiveQuestionIdx(0);
          setIsEditorOpen(true);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch quiz questions from API:', err);
      }
    }

    // Check if questions were in memory
    if (item.quiz.quizQuestions && Array.isArray(item.quiz.quizQuestions) && item.quiz.quizQuestions.length > 0) {
      setQuestions(item.quiz.quizQuestions);
    } else {
      setQuestions([
        {
          questionText: 'Which of the following is a common communication protocol used in IoT devices?',
          options: ['HTTP', 'MQTT', 'FTP', 'SMTP'],
          correctAnswer: 1,
          explanation: 'MQTT is a lightweight messaging protocol widely used in IoT.',
        },
      ]);
    }

    setActiveQuestionIdx(0);
    setIsEditorOpen(true);
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQ: QuestionItem = {
      questionText: `Which of the following describes the key principle of Question ${questions.length + 1}?`,
      options: ['Option A text', 'Option B text', 'Option C text', 'Option D text'],
      correctAnswer: 0,
      explanation: '',
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    setActiveQuestionIdx(updated.length - 1);
  };

  // Remove a question
  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      if (onShowToast) onShowToast('A quiz must have at least one question', 'error');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (activeQuestionIdx >= idx && activeQuestionIdx > 0) {
      setActiveQuestionIdx((prev) => prev - 1);
    }
  };

  // Update option text for active question
  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  // Set correct answer for active question
  const handleSetCorrectAnswer = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctAnswer: optIdx } : q))
    );
  };

  // Save Quiz (Create / Edit)
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!quizTitle.trim()) {
      if (onShowToast) onShowToast('Quiz Title is required', 'error');
      return;
    }
    if (!timeLimit || timeLimit <= 0) {
      if (onShowToast) onShowToast('Please enter a valid time limit in minutes', 'error');
      return;
    }
    if (passingScore < 0 || passingScore > 100) {
      if (onShowToast) onShowToast('Pass Mark must be between 0% and 100%', 'error');
      return;
    }
    if (questions.length === 0) {
      if (onShowToast) onShowToast('At least one question is required', 'error');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        if (onShowToast) onShowToast(`Question ${i + 1} text is required`, 'error');
        setActiveQuestionIdx(i);
        return;
      }
      if (!q.options || q.options.some((opt) => !opt.trim())) {
        if (onShowToast) onShowToast(`All 4 options are required for Question ${i + 1}`, 'error');
        setActiveQuestionIdx(i);
        return;
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        if (onShowToast) onShowToast(`Please select the correct answer for Question ${i + 1}`, 'error');
        setActiveQuestionIdx(i);
        return;
      }
    }

    setIsSaving(true);
    try {
      const quizMeta = {
        quizTitle: quizTitle.trim(),
        title: quizTitle.trim(),
        weekNumber: weekNumber.trim(),
        order: weekNumber.trim(),
        timeLimit: Number(timeLimit) || 60,
        numberOfQuestions: Number(numberOfQuestions) || questions.length || 25,
        questionsCount: Number(numberOfQuestions) || questions.length || 25,
        totalMarks: Number(totalMarks) || 100,
        passingScore: Number(passingScore) || 70,
        maxAttempts: Number(maxAttempts) || 1,
        status: status,
        description: quizDescription.trim(),
        quizDescription: quizDescription.trim(),
      };

      const formattedQuestionsForBackend = questions.map((q, idx) => ({
        questionText: q.questionText.trim(),
        questionType: 'SINGLE_CHOICE',
        options: q.options.map((opt) => opt.trim()),
        correctAnswer: q.correctAnswer,
        explanation: (q.explanation || '').trim(),
        displayOrder: idx,
      }));

      const payload = {
        title: quizTitle.trim(),
        lessonType: 'QUIZ',
        lesson_type: 'QUIZ',
        description: JSON.stringify(quizMeta),
        duration: `${timeLimit} min`,
        durationSeconds: Number(timeLimit) * 60,
        duration_seconds: Number(timeLimit) * 60,
        quizQuestions: formattedQuestionsForBackend,
        required: true,
      };

      if (editingQuizItem?.quiz?.id) {
        // UPDATE (PUT) existing quiz using quizId - NO duplicate created
        if (!String(editingQuizItem.quiz.id).startsWith('draft-')) {
          await updateCourseLesson(editingQuizItem.quiz.id, payload);
        }

        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== editingQuizItem.sectionId) return sec;
            const currentLessons = sec.lessons || sec.course_lessons || [];
            const updated = currentLessons.map((l: any) =>
              l.id === editingQuizItem.quiz.id
                ? { ...l, ...payload, quizQuestions: questions }
                : l
            );
            return { ...sec, lessons: updated, course_lessons: updated };
          })
        );
        if (onShowToast) onShowToast('Quiz updated successfully!', 'success');
      } else {
        // CREATE (POST) new quiz
        const sectionId = await getOrCreateQuizSection();
        let createdLesson: any = null;

        if (!String(sectionId).startsWith('draft-')) {
          const res = await addCourseLesson(sectionId, payload);
          createdLesson = res.data || res;
        }

        const newLesson = {
          id: createdLesson?.id || `draft-quiz-${Date.now()}`,
          ...payload,
          quizQuestions: questions,
        };

        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const currentLessons = sec.lessons || sec.course_lessons || [];
            return {
              ...sec,
              lessons: [...currentLessons, newLesson],
              course_lessons: [...currentLessons, newLesson],
            };
          })
        );
        if (onShowToast) onShowToast(`Quiz "${quizTitle.trim()}" created successfully!`, 'success');
      }

      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Failed to save quiz:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to save quiz', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setIsDeleting(true);
    try {
      if (!String(quizToDelete.quiz.id).startsWith('draft-')) {
        await deleteCourseLesson(quizToDelete.quiz.id);
      }

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== quizToDelete.sectionId) return sec;
          const currentLessons = sec.lessons || sec.course_lessons || [];
          const updated = currentLessons.filter((l: any) => l.id !== quizToDelete.quiz.id);
          return { ...sec, lessons: updated, course_lessons: updated };
        })
      );

      if (onShowToast) onShowToast(`Quiz "${quizToDelete.quiz.title}" deleted`, 'success');
      setQuizToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete quiz:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to delete quiz', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentQ = questions[activeQuestionIdx] || questions[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header matching InGage Admin UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white border border-emerald-100 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#00A86B] text-white shrink-0 shadow-xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Course Quizzes &amp; Knowledge Checks
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {allQuizzes.length} {allQuizzes.length === 1 ? 'Quiz' : 'Quizzes'} configured for this curriculum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowStudentPreview(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            title="Preview how students see these quizzes"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Preview Student View</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateQuiz}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A86B] hover:bg-[#008F5B] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Quiz</span>
          </button>
        </div>
      </div>

      {/* Quizzes List: Table View or Cards View */}
      {allQuizzes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center mx-auto border border-emerald-100">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Quizzes Created Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create independent quizzes to test student retention across weekly modules with time limits, passing score thresholds, and allowed attempts.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateQuiz}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A86B] hover:bg-[#008F5B] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add First Quiz</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* CLEAN TABLE VIEW FOR ADMIN (Matching User Specification) */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700">
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Time Limit</th>
                  <th className="px-4 py-3.5">No. of Questions</th>
                  <th className="px-4 py-3.5">Total Marks</th>
                  <th className="px-4 py-3.5">Pass %</th>
                  <th className="px-4 py-3.5">Max Attempts</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {allQuizzes.map((item, idx) => {
                  const { quiz } = item;
                  let meta: any = {};
                  if (quiz.description) {
                    try {
                      if (typeof quiz.description === 'string' && quiz.description.startsWith('{')) {
                        meta = JSON.parse(quiz.description);
                      } else if (typeof quiz.description === 'object') {
                        meta = quiz.description;
                      }
                    } catch {
                      meta = {};
                    }
                  }

                  const weekTag = meta.weekNumber || meta.order || `Week-${String(idx + 1).padStart(2, '0')}`;
                  const tLimit = meta.timeLimit || 60;
                  const qCount = meta.numberOfQuestions || meta.questionsCount || (quiz.quizQuestions ? quiz.quizQuestions.length : 25);
                  const marks = meta.totalMarks || (qCount * 4) || 100;
                  const passScore = meta.passingScore || 70;
                  const maxAtt = meta.maxAttempts || 1;
                  const st = meta.status || 'Active';
                  const isActive = st !== 'Inactive' && st !== 'INACTIVE';

                  return (
                    <tr key={quiz.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                            {weekTag}
                          </span>
                          <span className="font-bold text-slate-900 line-clamp-1">
                            {quiz.title}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Time Limit */}
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {tLimit} min
                      </td>

                      {/* Column 3: No. of Questions */}
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {qCount}
                      </td>

                      {/* Column 4: Total Marks */}
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {marks}
                      </td>

                      {/* Column 5: Pass % */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {passScore}%
                        </span>
                      </td>

                      {/* Column 6: Max Attempts */}
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {maxAtt}
                      </td>

                      {/* Column 7: Status */}
                      <td className="px-4 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Column 8: Actions (Edit / Delete) */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuiz(item)}
                            className="p-1.5 text-slate-500 hover:text-[#00A86B] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Edit Quiz"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuizToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Quiz"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* OPTIONAL CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allQuizzes.map((item, idx) => {
            const { quiz } = item;
            let meta: any = {};
            if (quiz.description) {
              try {
                if (typeof quiz.description === 'string' && quiz.description.startsWith('{')) {
                  meta = JSON.parse(quiz.description);
                } else if (typeof quiz.description === 'object') {
                  meta = quiz.description;
                }
              } catch {
                meta = {};
              }
            }
            const qCount = meta.numberOfQuestions || meta.questionsCount || meta.totalMarks || (quiz.quizQuestions ? quiz.quizQuestions.length : 25);
            const pScore = meta.passingScore || 70;
            const tLimit = meta.timeLimit || 60;
            const weekTag = meta.weekNumber || meta.order || `Week-${String(idx + 1).padStart(2, '0')}`;

            return (
              <div
                key={quiz.id || idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00A86B] flex items-center justify-center shrink-0 border border-emerald-100">
                        <ClipboardCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-[#00A86B] uppercase tracking-wide">
                          {weekTag}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{quiz.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditQuiz(item)}
                        className="p-1.5 text-slate-500 hover:text-[#00A86B] hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Edit Quiz"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {meta.description || meta.quizDescription || 'Test your understanding of the weekly curriculum.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400">Questions</p>
                      <p className="text-xs font-bold text-slate-800">{qCount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400">Pass Mark</p>
                      <p className="text-xs font-bold text-emerald-600">{pScore}%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400">Duration</p>
                      <p className="text-xs font-bold text-slate-800">{tLimit} min</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditQuiz(item)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#00A86B] text-xs font-bold rounded-xl border border-emerald-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Quiz</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: ADMIN PANEL FORM FOR ADDING / EDITING QUIZZES                */}
      {/* (Contains all 8 required fields + Orange/Green InGage theme)        */}
      {/* ------------------------------------------------------------------- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00A86B] text-white flex items-center justify-center shadow-xs">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingQuizItem ? 'Edit Quiz' : 'Add New Quiz'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure weekly quiz parameters, marks, and passing thresholds for learners.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with all 8 fields */}
            <form onSubmit={handleSaveQuiz} className="space-y-5">
              {/* Row 1: Quiz Title & Order / Week Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Quiz Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Quiz Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    required
                    placeholder="e.g. Week-01, IoT Fundamentals Quiz"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                  />
                </div>

                {/* 7. Order / Week Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Order / Week Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    required
                    placeholder="e.g. Week-01, Week-02"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Time Limit, Number of Questions, Total Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 2. Time Limit in minutes */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Time Limit (minutes) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Math.max(1, Number(e.target.value)))}
                      required
                      placeholder="e.g. 60, 15, 70"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Number of Questions */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Number of Questions <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(Math.max(1, Number(e.target.value)))}
                      required
                      placeholder="e.g. 25, 1, 32"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                    />
                    <HelpCircle className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Total Marks */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Total Marks <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Math.max(1, Number(e.target.value)))}
                      required
                      placeholder="e.g. 100, 50"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                    />
                    <Target className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 3: Pass Percentage, Max Attempts, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 5. Pass Percentage / Passing Score */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Pass Percentage / Passing Score <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Math.min(100, Math.max(1, Number(e.target.value))))}
                      required
                      placeholder="e.g. 70%"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                    />
                    <span className="text-slate-400 font-bold text-xs sm:text-sm absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                {/* 6. Maximum Attempts allowed */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Maximum Attempts Allowed <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Math.max(1, Number(e.target.value)))}
                      required
                      placeholder="e.g. 1"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs"
                    />
                    <RotateCcw className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 8. Status (radio or dropdown) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="quizStatus"
                        value="Active"
                        checked={status === 'Active'}
                        onChange={() => setStatus('Active')}
                        className="w-4 h-4 text-[#00A86B] accent-[#00A86B] cursor-pointer"
                      />
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="quizStatus"
                        value="Inactive"
                        checked={status === 'Inactive'}
                        onChange={() => setStatus('Inactive')}
                        className="w-4 h-4 text-slate-600 accent-slate-600 cursor-pointer"
                      />
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Quiz Description / Learning Objective
                </label>
                <textarea
                  rows={2}
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Describe what this quiz evaluates and instructions for students..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs resize-none"
                />
              </div>

              {/* Row 4: Question Builder Header */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Question Builder ({questions.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Manage multiple choice questions, options, and explanations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {/* Jumper Tabs if multiple questions */}
              {questions.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {questions.map((_, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => setActiveQuestionIdx(qIdx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                        activeQuestionIdx === qIdx
                          ? 'bg-[#00A86B] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Q{qIdx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Question Card */}
              {currentQ && (
                <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  {/* Question Header: Badge Q1 & "Question 1 of X" & Delete Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#00A86B] text-white text-xs font-bold">
                        Q{activeQuestionIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Question {activeQuestionIdx + 1} of {questions.length}
                      </span>
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(activeQuestionIdx)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        title="Remove Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Question Text <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={currentQ.questionText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions((prev) =>
                          prev.map((q, i) => (i === activeQuestionIdx ? { ...q, questionText: val } : q))
                        );
                      }}
                      required
                      placeholder="Which of the following describes the key principle?"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs resize-none"
                    />
                  </div>

                  {/* Options & Correct Answer */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Options &amp; Correct Answer (select the radio for correct option)
                    </label>

                    {currentQ.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = currentQ.correctAnswer === optIdx;

                      return (
                        <div key={optIdx} className="flex items-center gap-3">
                          {/* Radio Button */}
                          <input
                            type="radio"
                            name={`correct-opt-${activeQuestionIdx}`}
                            checked={isCorrect}
                            onChange={() => handleSetCorrectAnswer(activeQuestionIdx, optIdx)}
                            className="w-4 h-4 text-[#00A86B] accent-[#00A86B] cursor-pointer"
                          />

                          {/* Letter A, B, C, D */}
                          <span className="text-xs sm:text-sm font-bold text-slate-700 w-4 text-center">
                            {letter}
                          </span>

                          {/* Option Input Field */}
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(activeQuestionIdx, optIdx, e.target.value)}
                              placeholder={`Option ${letter}`}
                              required
                              className={`w-full pl-3.5 pr-8 py-2 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none transition shadow-2xs ${
                                isCorrect
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/30 font-semibold'
                                  : 'border-slate-200 focus:border-[#00A86B]'
                              }`}
                            />
                            {isCorrect && (
                              <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Explanation (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={currentQ.explanation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuestions((prev) =>
                          prev.map((q, i) => (i === activeQuestionIdx ? { ...q, explanation: val } : q))
                        );
                      }}
                      placeholder="Explain why this option is correct for student review..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/20 focus:outline-none transition shadow-2xs resize-none"
                    />
                  </div>

                  {/* Next / Previous Question Navigation inside card */}
                  {questions.length > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                        disabled={activeQuestionIdx === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous Question</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                        disabled={activeQuestionIdx === questions.length - 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Bottom Action Buttons matching InGage Branding */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !quizTitle.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00A86B] hover:bg-[#008F5B] active:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingQuizItem ? 'Save Changes' : 'Save Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Quiz?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete &ldquo;{quizToDelete.quiz.title}&rdquo;?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student View Live Cross-Check Preview Modal */}
      {showStudentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LIVE STUDENT PREVIEW
                    </span>
                    <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                    <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                      Course Quizzes View
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Cross-Check: Student View of Quizzes
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentPreview(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Embedded StudentQuizView */}
            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
              <StudentQuizView
                courseId={courseId || 0}
                quizzes={allQuizzes.map((item) => item.quiz)}
                completedLessonIds={[]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
