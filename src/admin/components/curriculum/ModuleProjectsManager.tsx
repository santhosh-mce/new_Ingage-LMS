import React, { useState } from 'react';
import {
  FolderArchive,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  X,
  Loader2,
  CheckCircle2,
  FileCode,
  Calendar,
  Layers,
  Award,
  Lock,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import {
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
} from '@/api/adminApi';

export interface ProjectData {
  title: string;
  objective: string;
  requirements: string;
  instructions: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  submissionType: 'GitHub URL' | 'File Upload' | 'External URL';
  maxMarks: number;
}

const DEFAULT_PROJECT: ProjectData = {
  title: 'Smart Home IoT Monitoring System',
  objective:
    'Complete the practical capstone assignment by building a smart home monitoring system using IoT sensors and a web dashboard.',
  requirements:
    '• Basic IoT knowledge\n• Git and GitHub account\n• Basic programming knowledge',
  instructions:
    '1. Create the project repository.\n2. Configure the IoT sensors.\n3. Implement data collection.\n4. Build the monitoring dashboard.\n5. Push the completed project to GitHub.\n6. Submit the GitHub repository URL.',
  difficulty: 'Intermediate',
  submissionType: 'GitHub URL',
  maxMarks: 100,
};

interface ModuleProjectsManagerProps {
  section: any;
  sectionIndex: number;
  courseId?: number | string | null;
  onUpdateSectionLessons: (sectionId: number | string, updatedLessons: any[]) => void;
  onBack: () => void;
  onSwitchTab: (tab: 'VIDEOS' | 'QUIZ' | 'PROJECTS' | 'LIVE_CLASSES') => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null>;
}

export const ModuleProjectsManager: React.FC<ModuleProjectsManagerProps> = ({
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
  const projectLessons = allLessons.filter((l: any) => {
    const t = (l.lessonType || l.lesson_type || '').toUpperCase();
    return t === 'PROJECT' || t === 'ASSIGNMENT';
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ lesson: any; index: number } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<ProjectData>(DEFAULT_PROJECT);

  const openAddForm = () => {
    setEditingLesson(null);
    setForm({
      title: '',
      objective: '',
      requirements: '',
      instructions: '',
      difficulty: 'Intermediate',
      submissionType: 'GitHub URL',
      maxMarks: 100,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (lesson: any, index: number) => {
    setEditingLesson({ lesson, index });
    let parsed: any = {};
    if (lesson.description) {
      try {
        parsed = JSON.parse(lesson.description);
      } catch (e) {
        parsed = {
          objective: lesson.description,
          shortDescription: lesson.description,
        };
      }
    }

    setForm({
      title: lesson.title || '',
      objective: parsed.objective || parsed.shortDescription || '',
      requirements: parsed.requirements || '',
      instructions: parsed.instructions || '',
      difficulty: parsed.difficulty || 'Intermediate',
      submissionType: parsed.submissionType || 'GitHub URL',
      maxMarks: Number(parsed.maxMarks) || 100,
    });
    setIsFormOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      if (onShowToast) onShowToast('Project Title is required', 'error');
      return;
    }
    if (!form.difficulty) {
      if (onShowToast) onShowToast('Difficulty is required', 'error');
      return;
    }
    if (!form.submissionType) {
      if (onShowToast) onShowToast('Submission Type is required', 'error');
      return;
    }
    if (!form.maxMarks || form.maxMarks <= 0) {
      if (onShowToast) onShowToast('Max Marks must be greater than 0', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const projectOrder =
        editingLesson !== null ? editingLesson.index + 1 : projectLessons.length + 1;

      const meta = {
        title: form.title.trim(),
        objective: form.objective.trim(),
        shortDescription: form.objective.trim(),
        requirements: form.requirements.trim(),
        instructions: form.instructions.trim(),
        difficulty: form.difficulty,
        submissionType: form.submissionType,
        maxMarks: Number(form.maxMarks),
        projectOrder: projectOrder,
        updatedAt: new Date().toISOString(),
      };

      const payload = {
        title: form.title.trim(),
        lessonType: 'PROJECT',
        lesson_type: 'PROJECT',
        description: JSON.stringify(meta),
        duration: 'Capstone',
        required: true,
      };

      if (editingLesson?.lesson?.id) {
        // Update existing lesson
        if (!String(editingLesson.lesson.id).startsWith('draft-')) {
          await updateCourseLesson(editingLesson.lesson.id, payload);
        }

        const updated = allLessons.map((l: any) =>
          l.id === editingLesson.lesson.id ? { ...l, ...payload } : l
        );
        onUpdateSectionLessons(section.id, updated);
        if (onShowToast) onShowToast('Project updated successfully!', 'success');
      } else {
        // Create new project lesson
        let createdLesson: any = null;
        if (!String(section.id).startsWith('draft-')) {
          const res = await addCourseLesson(section.id, payload);
          createdLesson = res.data || res;
        }

        const newLesson = {
          id: createdLesson?.id || `draft-project-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
        };

        const updated = [...allLessons, newLesson];
        onUpdateSectionLessons(section.id, updated);
        if (onShowToast) onShowToast(`Project "${form.title.trim()}" created!`, 'success');
      }

      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Failed to save project:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setDeletingId(lessonId);
    try {
      if (!String(lessonId).startsWith('draft-')) {
        await deleteCourseLesson(lessonId);
      }
      const updated = allLessons.filter((l: any) => l.id !== lessonId);
      onUpdateSectionLessons(section.id, updated);
      if (onShowToast) onShowToast('Project deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Sub-Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
            title="Back to Module Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 uppercase">
                Module {sectionIndex + 1}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {section.title || 'Untitled Module'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Hands-on Projects &amp; Capstones
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Project</span>
        </button>
      </div>

      {/* Projects List */}
      {projectLessons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Projects in this Module</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Assign capstones and practical tasks for learners to submit real code, repositories, or documentation.
          </p>
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectLessons.map((lesson: any, idx: number) => {
            let meta: any = {};
            if (lesson.description) {
              try {
                meta = JSON.parse(lesson.description);
              } catch (e) {
                meta = {
                  objective: lesson.description,
                  shortDescription: lesson.description,
                };
              }
            }

            const projectNumber = idx + 1;
            const difficultyLabel = (meta.difficulty || 'Intermediate').toUpperCase();
            const submissionType = meta.submissionType || 'GitHub URL';
            const maxMarks = meta.maxMarks || 100;
            const brief =
              meta.objective ||
              meta.shortDescription ||
              'Complete the practical capstone assignment.';

            return (
              <div
                key={lesson.id || idx}
                className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs p-5 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                        <FolderArchive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 uppercase tracking-wide">
                            Project {projectNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {difficultyLabel}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {lesson.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(lesson, idx)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lesson.id)}
                        disabled={deletingId === lesson.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Project"
                      >
                        {deletingId === lesson.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {brief}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400">Submission</p>
                      <p className="text-xs font-bold text-slate-800">{submissionType}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <p className="text-[10px] font-semibold text-slate-400">Max Marks</p>
                      <p className="text-xs font-bold text-purple-700">Max: {maxMarks} Pts</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditForm(lesson, idx)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-purple-50 hover:text-purple-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-purple-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lesson.id)}
                    disabled={deletingId === lesson.id}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT PROJECT (MODERN, CLEAN & FULLY VISIBLE)  */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Sticky Top) */}
            <div className="px-6 py-4 sm:px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingLesson ? 'Edit Project' : 'Create Project'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingLesson
                      ? `Updating details for Project ${editingLesson.index + 1}`
                      : `Configuring Project ${projectLessons.length + 1} for this module`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProject} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-4">
                {/* 1. Project Title * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Project Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Smart Home IoT Monitoring System"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs"
                  />
                </div>

                {/* 2. Objective / Brief */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Objective / Brief
                  </label>
                  <textarea
                    rows={2}
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="Complete the practical capstone assignment by building a smart home monitoring system using IoT sensors and a web dashboard."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs resize-none"
                  />
                </div>

                {/* 3. Requirements & 4. Step-by-Step Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Requirements / Prerequisites
                    </label>
                    <textarea
                      rows={5}
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      placeholder="• Basic IoT knowledge&#10;• Git and GitHub account&#10;• Basic programming knowledge"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Step-by-Step Instructions
                    </label>
                    <textarea
                      rows={5}
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      placeholder="1. Create the project repository.&#10;2. Configure the IoT sensors.&#10;3. Implement data collection.&#10;4. Build the monitoring dashboard.&#10;5. Push the completed project to GitHub.&#10;6. Submit the GitHub repository URL."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none transition shadow-2xs resize-none"
                    />
                  </div>
                </div>

                {/* 5. Difficulty, 6. Submission Type, 7. Max Marks, 8. Project Order */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-purple-50/40 rounded-2xl border border-purple-100">
                  {/* Difficulty * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Difficulty <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.difficulty}
                        onChange={(e) =>
                          setForm({ ...form, difficulty: e.target.value as any })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none transition appearance-none pr-8 cursor-pointer shadow-2xs"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Submission Type * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Submission Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.submissionType}
                        onChange={(e) =>
                          setForm({ ...form, submissionType: e.target.value as any })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none transition appearance-none pr-8 cursor-pointer shadow-2xs"
                      >
                        <option value="GitHub URL">GitHub URL</option>
                        <option value="File Upload">File Upload</option>
                        <option value="External URL">External URL</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Max Marks * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Max Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={form.maxMarks}
                      onChange={(e) =>
                        setForm({ ...form, maxMarks: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none transition shadow-2xs"
                    />
                  </div>

                  {/* Project Order / Number (Auto-calculated, locked) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Project Order
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={`Project ${
                          editingLesson !== null
                            ? editingLesson.index + 1
                            : projectLessons.length + 1
                        }`}
                        className="w-full px-3 py-2 bg-purple-100/50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 cursor-not-allowed pr-8 shadow-2xs"
                      />
                      <Lock className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Footer */}
              <div className="px-6 py-4 sm:px-8 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-2xs z-10">
                {/* Cancel button (left) */}
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Purple "Save Project" / "Save Changes" button (right) */}
                <button
                  type="submit"
                  disabled={isSaving || !form.title.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingLesson ? 'Save Changes' : 'Save Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
