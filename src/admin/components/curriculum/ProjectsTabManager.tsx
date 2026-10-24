"use client";

import React, { useState } from 'react';
import {
  FolderArchive,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  FileCode,
  Calendar,
  Layers,
  Award,
  Lock,
  ExternalLink,
  Code2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { StudentProjectView } from '@/views/learn/StudentProjectView';
import {
  addCourseSection,
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
  objective: 'Complete the practical capstone assignment by building a smart home monitoring system using IoT sensors and a web dashboard.',
  requirements: '• Basic IoT knowledge\n• Git and GitHub account\n• Basic programming knowledge',
  instructions: '1. Create the project repository.\n2. Configure the IoT sensors.\n3. Implement data collection.\n4. Build the monitoring dashboard.\n5. Push the completed project to GitHub.\n6. Submit the GitHub repository URL.',
  difficulty: 'Intermediate',
  submissionType: 'GitHub URL',
  maxMarks: 100,
};

interface ProjectsTabManagerProps {
  courseId?: number | string | null;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string, type?: any) => void;
  onSaveDraftIfNeeded?: () => Promise<number | string | null | undefined>;
}

export const ProjectsTabManager: React.FC<ProjectsTabManagerProps> = ({
  courseId,
  sections,
  setSections,
  onShowToast,
  onSaveDraftIfNeeded,
}) => {
  // Find all project lessons across sections
  const allProjects: { project: any; sectionId: number | string }[] = [];
  sections.forEach((sec) => {
    const lessons = sec.lessons || sec.course_lessons || [];
    lessons.forEach((l: any) => {
      const type = (l.lessonType || l.lesson_type || '').toUpperCase();
      if (type === 'PROJECT' || type === 'ASSIGNMENT') {
        allProjects.push({ project: l, sectionId: sec.id });
      }
    });
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    project: any;
    sectionId: number | string;
    index: number;
  } | null>(null);
  const [formData, setFormData] = useState<ProjectData>(DEFAULT_PROJECT);
  const [isSaving, setIsSaving] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<{
    project: any;
    sectionId: number | string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  const getOrCreateProjectSection = async (): Promise<number | string> => {
    if (sections.length > 0) return sections[0].id;

    let activeCourseId = courseId;
    if (!activeCourseId && onSaveDraftIfNeeded) {
      activeCourseId = await onSaveDraftIfNeeded();
    }
    if (activeCourseId) {
      const res = await addCourseSection(activeCourseId, {
        title: 'Course Projects & Capstones',
        displayOrder: 0,
      });
      const created = res.data || res;
      const newSec = {
        id: created.id || Date.now(),
        title: created.title || 'Course Projects & Capstones',
        displayOrder: 0,
        lessons: [],
      };
      setSections([newSec]);
      return newSec.id;
    }
    const localSec = {
      id: `draft-sec-${Date.now()}`,
      title: 'Course Projects & Capstones',
      displayOrder: 0,
      lessons: [],
    };
    setSections([localSec]);
    return localSec.id;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      objective: '',
      requirements: '',
      instructions: '',
      difficulty: 'Intermediate',
      submissionType: 'GitHub URL',
      maxMarks: 100,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (
    item: { project: any; sectionId: number | string },
    index: number
  ) => {
    setEditingItem({ ...item, index });
    let parsed: any = {};
    if (item.project.description) {
      try {
        parsed = JSON.parse(item.project.description);
      } catch (e) {
        parsed = {
          objective: item.project.description,
          shortDescription: item.project.description,
        };
      }
    }

    setFormData({
      title: item.project.title || '',
      objective: parsed.objective || parsed.shortDescription || '',
      requirements: parsed.requirements || '',
      instructions: parsed.instructions || '',
      difficulty: parsed.difficulty || 'Intermediate',
      submissionType: parsed.submissionType || 'GitHub URL',
      maxMarks: Number(parsed.maxMarks) || 100,
    });
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required fields validation
    if (!formData.title.trim()) {
      if (onShowToast) onShowToast('Project Title is required', 'error');
      return;
    }
    if (!formData.difficulty) {
      if (onShowToast) onShowToast('Difficulty is required', 'error');
      return;
    }
    if (!formData.submissionType) {
      if (onShowToast) onShowToast('Submission Type is required', 'error');
      return;
    }
    if (!formData.maxMarks || formData.maxMarks <= 0) {
      if (onShowToast) onShowToast('Max Marks must be greater than 0', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const projectOrder =
        editingItem !== null ? editingItem.index + 1 : allProjects.length + 1;

      const meta = {
        title: formData.title.trim(),
        objective: formData.objective.trim(),
        shortDescription: formData.objective.trim(),
        requirements: formData.requirements.trim(),
        instructions: formData.instructions.trim(),
        difficulty: formData.difficulty,
        submissionType: formData.submissionType,
        maxMarks: Number(formData.maxMarks),
        projectOrder: projectOrder,
        updatedAt: new Date().toISOString(),
      };

      const payload = {
        title: formData.title.trim(),
        lessonType: 'PROJECT',
        lesson_type: 'PROJECT',
        description: JSON.stringify(meta),
        duration: 'Capstone',
        required: true,
      };

      if (editingItem?.project?.id) {
        // Update existing project
        if (!String(editingItem.project.id).startsWith('draft-')) {
          await updateCourseLesson(editingItem.project.id, payload);
        }

        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== editingItem.sectionId) return sec;
            const currentLessons = sec.lessons || sec.course_lessons || [];
            const updated = currentLessons.map((l: any) =>
              l.id === editingItem.project.id ? { ...l, ...payload } : l
            );
            return { ...sec, lessons: updated, course_lessons: updated };
          })
        );
        if (onShowToast) onShowToast('Project updated successfully!', 'success');
      } else {
        // Create new project
        const sectionId = await getOrCreateProjectSection();
        let createdLesson: any = null;

        if (!String(sectionId).startsWith('draft-')) {
          const res = await addCourseLesson(sectionId, payload);
          createdLesson = res.data || res;
        }

        const newLesson = {
          id: createdLesson?.id || `draft-project-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
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
        if (onShowToast)
          onShowToast(`Project "${formData.title.trim()}" created!`, 'success');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save project:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to save project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      if (!String(projectToDelete.project.id).startsWith('draft-')) {
        await deleteCourseLesson(projectToDelete.project.id);
      }

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== projectToDelete.sectionId) return sec;
          const currentLessons = sec.lessons || sec.course_lessons || [];
          const updated = currentLessons.filter(
            (l: any) => l.id !== projectToDelete.project.id
          );
          return { ...sec, lessons: updated, course_lessons: updated };
        })
      );

      if (onShowToast)
        onShowToast(`Project "${projectToDelete.project.title}" deleted`, 'success');
      setProjectToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Course Projects &amp; Capstones
            </h3>
            <p className="text-xs text-slate-600">
              {allProjects.length}{' '}
              {allProjects.length === 1 ? 'Project' : 'Projects'} scheduled for this course
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowStudentPreview(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            title="Preview how students see these projects"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Preview Student View</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      {allProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Projects Added Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create practical project assignments where learners can build real-world systems and submit code repositories or files.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allProjects.map((item, idx) => {
            const { project } = item;
            let meta: any = {};
            if (project.description) {
              try {
                meta = JSON.parse(project.description);
              } catch (e) {
                meta = {
                  objective: project.description,
                  shortDescription: project.description,
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
                key={project.id || idx}
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
                          {project.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item, idx)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    onClick={() => handleOpenEdit(item, idx)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-purple-50 hover:text-purple-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-purple-300 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(item)}
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
      {isModalOpen && (
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
                    {editingItem ? 'Edit Project' : 'Create Project'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingItem
                      ? `Updating details for Project ${editingItem.index + 1}`
                      : `Configuring Project ${allProjects.length + 1} for this course`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
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
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
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
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
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
                        value={formData.difficulty}
                        onChange={(e) =>
                          setFormData({ ...formData, difficulty: e.target.value as any })
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
                        value={formData.submissionType}
                        onChange={(e) =>
                          setFormData({ ...formData, submissionType: e.target.value as any })
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
                      value={formData.maxMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, maxMarks: Number(e.target.value) })
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
                          editingItem !== null
                            ? editingItem.index + 1
                            : allProjects.length + 1
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                {/* Purple "Save Project" / "Save Changes" button (right) */}
                <button
                  type="submit"
                  disabled={isSaving || !formData.title.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingItem ? 'Save Changes' : 'Save Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE PROJECT CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete &ldquo;{projectToDelete.project.title}&rdquo;?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Project</span>
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
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      LIVE STUDENT PREVIEW
                    </span>
                    <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                    <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                      Course Projects View
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Cross-Check: Student View of Projects &amp; Capstones
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

            {/* Modal Body: Embedded StudentProjectView */}
            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
              <StudentProjectView
                courseId={courseId || 0}
                projects={allProjects.map((item) => item.project)}
                completedLessonIds={[]}
                onCompleteProject={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
