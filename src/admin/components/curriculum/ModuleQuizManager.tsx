import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Loader2,
  Settings,
  Award,
  CheckSquare,
  CircleDot,
  ToggleLeft,
  BookOpen,
} from 'lucide-react';
import {
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  getCourseLesson,
} from '@/api/adminApi';

interface QuestionItem {
  id?: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: number; // for SINGLE_CHOICE / TRUE_FALSE
  correctAnswers: number[]; // for MULTIPLE_CHOICE
  marks: number;
  explanation?: string;
}

interface ModuleQuizManagerProps {
  section: any;
  sectionIndex: number;
  courseId?: number | string | null;
  onUpdateSectionLessons: (sectionId: number | string, updatedLessons: any[]) => void;
  onBack: () => void;
  onSwitchTab: (tab: 'VIDEOS' | 'QUIZ' | 'PROJECTS' | 'LIVE_CLASSES') => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null>;
}

export const ModuleQuizManager: React.FC<ModuleQuizManagerProps> = ({
  section,
  sectionIndex,
  courseId,
  onUpdateSectionLessons,
  onBack,
  onSwitchTab,
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  const allLessons = section.lessons || section.course_lessons || [];
  const existingQuizLesson = allLessons.find(
    (l: any) => (l.lessonType || l.lesson_type || '').toUpperCase() === 'QUIZ'
  );

  // Parse quiz settings from existing lesson
  const initialMeta = (() => {
    if (!existingQuizLesson?.description) return null;
    try {
      return JSON.parse(existingQuizLesson.description);
    } catch {
      return null;
    }
  })();

  const [quizTitle, setQuizTitle] = useState(
    existingQuizLesson?.title || `${section.title} Quiz`
  );
  const [passingScore, setPassingScore] = useState<number>(initialMeta?.passingScore ?? 70);
  const [timeLimit, setTimeLimit] = useState<number>(initialMeta?.timeLimit ?? 20);
  const [maxAttempts, setMaxAttempts] = useState<number>(initialMeta?.maxAttempts ?? 3);
  const [quizDescription, setQuizDescription] = useState(
    initialMeta?.description || 'Test your understanding of the concepts covered in this module.'
  );

  // Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    if (existingQuizLesson?.quizQuestions && Array.isArray(existingQuizLesson.quizQuestions)) {
      return existingQuizLesson.quizQuestions.map((q: any) => parseQuestionFromBackend(q));
    }
    return [];
  });

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Question Form modal / inline state
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('SINGLE_CHOICE');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<number>(0);
  const [formCorrectAnswers, setFormCorrectAnswers] = useState<number[]>([0]);
  const [formMarks, setFormMarks] = useState<number>(1);
  const [formExplanation, setFormExplanation] = useState<string>('');

  // Fetch full quiz questions with options from backend if lesson exists and has ID
  useEffect(() => {
    if (existingQuizLesson?.id && questions.length === 0) {
      let isMounted = true;
      setIsLoadingQuestions(true);
      getCourseLesson(existingQuizLesson.id)
        .then((res: any) => {
          if (isMounted && res?.quiz_questions && Array.isArray(res.quiz_questions)) {
            const mapped = res.quiz_questions.map((q: any) => parseQuestionFromBackend(q));
            setQuestions(mapped);
          }
        })
        .catch((err: any) => {
          console.warn('Could not fetch quiz questions:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingQuestions(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [existingQuizLesson?.id]);

  function parseQuestionFromBackend(q: any): QuestionItem {
    const options = Array.isArray(q.options)
      ? q.options
      : Array.isArray(q.quiz_question_options)
      ? q.quiz_question_options.map((o: any) => o.option_text)
      : ['Option A', 'Option B', 'Option C', 'Option D'];

    let questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' = 'SINGLE_CHOICE';
    let marks = 1;
    let correctAnswers = [q.correct_option_index ?? q.correctAnswer ?? 0];
    let explanation = q.explanation || '';

    // Check if explanation has JSON metadata
    if (explanation.startsWith('{') && explanation.endsWith('}')) {
      try {
        const meta = JSON.parse(explanation);
        if (meta.marks) marks = Number(meta.marks);
        if (meta.questionType) questionType = meta.questionType;
        if (Array.isArray(meta.correctAnswers)) correctAnswers = meta.correctAnswers;
        if (meta.explanation !== undefined) explanation = meta.explanation;
      } catch {}
    } else if (options.length === 2 && options[0].toLowerCase() === 'true' && options[1].toLowerCase() === 'false') {
      questionType = 'TRUE_FALSE';
    }

    return {
      id: q.id,
      questionText: q.question_text || q.questionText || q.question || '',
      questionType,
      options,
      correctAnswer: correctAnswers[0] ?? 0,
      correctAnswers,
      marks,
      explanation,
    };
  }

  // Calculate total marks automatically
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  const openAddQuestion = () => {
    setEditingQuestionIdx(null);
    setFormText('');
    setFormType('SINGLE_CHOICE');
    setFormOptions(['', '', '', '']);
    setFormCorrectAnswer(0);
    setFormCorrectAnswers([0]);
    setFormMarks(1);
    setFormExplanation('');
    setIsQuestionFormOpen(true);
  };

  const openEditQuestion = (idx: number) => {
    const q = questions[idx];
    setEditingQuestionIdx(idx);
    setFormText(q.questionText);
    setFormType(q.questionType);
    setFormOptions(q.questionType === 'TRUE_FALSE' ? ['True', 'False'] : [...q.options]);
    setFormCorrectAnswer(q.correctAnswer);
    setFormCorrectAnswers(q.correctAnswers || [q.correctAnswer]);
    setFormMarks(q.marks || 1);
    setFormExplanation(q.explanation || '');
    setIsQuestionFormOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!formText.trim()) {
      if (onShowToast) onShowToast('Please enter question text', 'error');
      return;
    }

    let finalOptions = formOptions;
    if (formType === 'TRUE_FALSE') {
      finalOptions = ['True', 'False'];
    } else {
      const cleanOpts = formOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        if (onShowToast) onShowToast('Please provide at least 2 options', 'error');
        return;
      }
      finalOptions = cleanOpts;
    }

    if (formType === 'MULTIPLE_CHOICE' && formCorrectAnswers.length === 0) {
      if (onShowToast) onShowToast('Please select at least one correct answer', 'error');
      return;
    }

    const newQuestion: QuestionItem = {
      questionText: formText.trim(),
      questionType: formType,
      options: finalOptions,
      correctAnswer: formType === 'MULTIPLE_CHOICE' ? (formCorrectAnswers[0] ?? 0) : formCorrectAnswer,
      correctAnswers: formType === 'MULTIPLE_CHOICE' ? formCorrectAnswers : [formCorrectAnswer],
      marks: Math.max(1, formMarks),
      explanation: formExplanation.trim(),
    };

    let updatedQuestions: QuestionItem[];
    if (editingQuestionIdx !== null) {
      updatedQuestions = questions.map((q, i) => (i === editingQuestionIdx ? newQuestion : q));
    } else {
      updatedQuestions = [...questions, newQuestion];
    }

    setQuestions(updatedQuestions);
    setIsQuestionFormOpen(false);

    // Auto-save quiz to backend with updated questions
    persistQuiz(updatedQuestions);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    persistQuiz(updated);
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const updated = [...questions];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setQuestions(updated);
    persistQuiz(updated);
  };

  const persistQuiz = async (customQuestions?: QuestionItem[]) => {
    const qsToSave = customQuestions || questions;
    setIsSaving(true);

    try {
      const formattedQuestionsForBackend = qsToSave.map((q, idx) => {
        // Embed marks and multiple choice info in explanation metadata JSON
        const meta = {
          marks: q.marks || 1,
          questionType: q.questionType,
          correctAnswers: q.correctAnswers || [q.correctAnswer],
          explanation: q.explanation || '',
        };

        return {
          questionText: q.questionText,
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: JSON.stringify(meta),
          displayOrder: idx,
        };
      });

      const quizMeta = {
        description: quizDescription,
        passingScore,
        timeLimit,
        maxAttempts,
        totalMarks: qsToSave.reduce((acc, q) => acc + (q.marks || 1), 0),
        questionsCount: qsToSave.length,
      };

      const payload = {
        title: quizTitle.trim(),
        lessonType: 'QUIZ',
        lesson_type: 'QUIZ',
        description: JSON.stringify(quizMeta),
        duration: `${timeLimit} min`,
        durationSeconds: timeLimit * 60,
        duration_seconds: timeLimit * 60,
        quizQuestions: formattedQuestionsForBackend,
        required: true,
      };

      if (existingQuizLesson?.id) {
        // Update existing quiz lesson
        const updated = await updateCourseLesson(existingQuizLesson.id, payload);
        const updatedLessons = allLessons.map((l: any) =>
          l.id === existingQuizLesson.id ? { ...l, ...updated, ...payload, quizQuestions: qsToSave } : l
        );
        onUpdateSectionLessons(section.id, updatedLessons);
        if (onShowToast) onShowToast('Quiz updated successfully! ✓', 'success');
      } else {
        // Create new quiz lesson in this section
        const created = await addCourseLesson(section.id, payload);
        const updatedLessons = [...allLessons, { ...created, ...payload, quizQuestions: qsToSave }];
        onUpdateSectionLessons(section.id, updatedLessons);
        if (onShowToast) onShowToast('Quiz created successfully! ✓', 'success');
      }
    } catch (err: any) {
      console.error('Save quiz error:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to save quiz', 'error');
    } finally {
      setIsSaving(false);
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to All Modules"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                MODULE {sectionIndex + 1}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz Management</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{quizTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Quiz Settings</span>
          </button>

          <button
            type="button"
            onClick={openAddQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Question</span>
          </button>
        </div>
      </div>

      {/* Module Content Switcher Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => onSwitchTab('VIDEOS')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Videos</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('QUIZ')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white text-green-800 shadow-xs cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-green-600" />
          <span>Quiz ({questions.length} Questions)</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('PROJECTS')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Projects</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchTab('LIVE_CLASSES')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
        >
          <span>Live Classes</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Quiz Title: <strong className="text-white">{quizTitle}</strong></div>
            <div className="text-sm font-bold text-white mt-0.5 flex flex-wrap items-center gap-3">
              <span>Questions: <strong className="text-green-400">{questions.length}</strong></span>
              <span className="text-slate-600">•</span>
              <span>Passing Score: <strong className="text-green-400">{passingScore}%</strong></span>
              <span className="text-slate-600">•</span>
              <span>Time Limit: <strong className="text-green-400">{timeLimit} min</strong></span>
              <span className="text-slate-600">•</span>
              <span>Total Marks: <strong className="text-green-400 font-mono">{totalMarks}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="text-xs font-semibold text-green-400 hover:text-green-300 hover:underline cursor-pointer"
        >
          [Edit Quiz Details]
        </button>
      </div>

      {/* Quiz Settings Modal / Box */}
      {isSettingsOpen && (
        <div className="bg-white border-2 border-green-500/30 rounded-2xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-bold text-slate-900">Quiz Configuration</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title *</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. Python Basics Quiz"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Limit (min)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden font-mono"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Instructions / Description</label>
              <textarea
                rows={2}
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => persistQuiz()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Question Form (Add or Edit) */}
      {isQuestionFormOpen && (
        <div className="bg-white border-2 border-green-500/30 rounded-2xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {editingQuestionIdx !== null ? `Edit Question ${editingQuestionIdx + 1}` : 'Add New Question'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsQuestionFormOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question *
              </label>
              <textarea
                rows={2}
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="e.g. What is Python?"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden"
                autoFocus
              />
            </div>

            {/* Question Type & Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Question Type</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qType"
                      checked={formType === 'SINGLE_CHOICE'}
                      onChange={() => {
                        setFormType('SINGLE_CHOICE');
                        if (formOptions.length < 2) setFormOptions(['Option A', 'Option B', 'Option C', 'Option D']);
                      }}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span>Single Choice</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qType"
                      checked={formType === 'MULTIPLE_CHOICE'}
                      onChange={() => {
                        setFormType('MULTIPLE_CHOICE');
                        if (formOptions.length < 2) setFormOptions(['Option A', 'Option B', 'Option C', 'Option D']);
                      }}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span>Multiple Choice (Checkboxes)</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="qType"
                      checked={formType === 'TRUE_FALSE'}
                      onChange={() => {
                        setFormType('TRUE_FALSE');
                        setFormOptions(['True', 'False']);
                        setFormCorrectAnswer(0);
                      }}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span>True / False</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formMarks}
                  onChange={(e) => setFormMarks(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Options List with Correct Answer Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Options &amp; Correct Answer Selection
                </label>
                <span className="text-[11px] text-slate-500">
                  {formType === 'MULTIPLE_CHOICE'
                    ? 'Check all options that are correct'
                    : 'Select the radio button of the correct answer'}
                </span>
              </div>

              {formType === 'TRUE_FALSE' ? (
                <div className="space-y-2">
                  {['True', 'False'].map((label, optIdx) => (
                    <label
                      key={label}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formCorrectAnswer === optIdx
                          ? 'border-green-500 bg-green-50/60 text-green-900 font-bold'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tfAnswer"
                        checked={formCorrectAnswer === optIdx}
                        onChange={() => setFormCorrectAnswer(optIdx)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs">{label}</span>
                      {formCorrectAnswer === optIdx && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Correct Answer
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formOptions.map((opt, optIdx) => {
                    const isSelected =
                      formType === 'MULTIPLE_CHOICE'
                        ? formCorrectAnswers.includes(optIdx)
                        : formCorrectAnswer === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          isSelected ? 'border-green-400 bg-green-50/40' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        {/* Selector (Radio for single choice, Checkbox for multiple choice) */}
                        <div className="px-2">
                          {formType === 'MULTIPLE_CHOICE' ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormCorrectAnswers([...formCorrectAnswers, optIdx]);
                                } else {
                                  setFormCorrectAnswers(formCorrectAnswers.filter((i) => i !== optIdx));
                                }
                              }}
                              className="rounded-sm text-green-600 focus:ring-green-500 cursor-pointer"
                              title="Check if correct answer"
                            />
                          ) : (
                            <input
                              type="radio"
                              name="singleChoiceAnswer"
                              checked={isSelected}
                              onChange={() => setFormCorrectAnswer(optIdx)}
                              className="text-green-600 focus:ring-green-500 cursor-pointer"
                              title="Select as correct answer"
                            />
                          )}
                        </div>

                        <span className="w-6 text-xs font-bold text-slate-500 font-mono">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>

                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...formOptions];
                            updated[optIdx] = e.target.value;
                            setFormOptions(updated);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-green-600 focus:outline-hidden"
                        />

                        {isSelected && (
                          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                            Correct
                          </span>
                        )}

                        {formOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formOptions.filter((_, i) => i !== optIdx);
                              setFormOptions(updated);
                              if (formCorrectAnswer === optIdx) setFormCorrectAnswer(0);
                              setFormCorrectAnswers(formCorrectAnswers.filter((i) => i !== optIdx));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {formOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setFormOptions([...formOptions, ''])}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 p-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Explanation / Hint */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Answer Explanation (Optional)
              </label>
              <input
                type="text"
                value={formExplanation}
                onChange={(e) => setFormExplanation(e.target.value)}
                placeholder="Explain why the answer is correct..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuestionFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <span>{editingQuestionIdx !== null ? 'Update Question' : 'Save Question'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {isLoadingQuestions ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            <span>Loading quiz questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No questions in this quiz yet</p>
              <p className="text-xs text-slate-500 mt-0.5">Click &quot;+ Add Question&quot; to create your first question.</p>
            </div>
            <button
              type="button"
              onClick={openAddQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Question</span>
            </button>
          </div>
        ) : (
          questions.map((q, idx) => {
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3.5"
              >
                {/* Header row: Question Number & Type Badge & Marks & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-7 h-7 rounded-lg bg-green-50 text-green-700 font-bold text-xs flex items-center justify-center shrink-0 border border-green-200">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Question {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {q.questionType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {q.marks || 1} {q.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {/* Up / Down buttons */}
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5 mr-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditQuestion(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      title="Edit Question"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-xs font-bold text-slate-900 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options display with correct answer highlighted */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect =
                      q.questionType === 'MULTIPLE_CHOICE'
                        ? (q.correctAnswers || []).includes(optIdx)
                        : q.correctAnswer === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50/70 border-slate-200/80 text-slate-600'
                        }`}
                      >
                        {q.questionType === 'MULTIPLE_CHOICE' ? (
                          <div
                            className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                            }`}
                          >
                            {isCorrect && '✓'}
                          </div>
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isCorrect ? 'bg-emerald-600 text-white font-bold' : 'border border-slate-300'
                            }`}
                          >
                            {isCorrect && '●'}
                          </div>
                        )}

                        <span className="font-mono text-slate-400 text-[11px]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="flex-1 truncate">{opt}</span>

                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                            (Correct)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation if present */}
                {q.explanation && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 mt-1">
                    <strong className="text-slate-700">Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
