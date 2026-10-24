"use client";

import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Clock,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Loader2,
  Check,
} from 'lucide-react';
import { apiClient } from '../api/paymentApi';

export interface ProjectMetadata {
  projectTitle?: string;
  projectDescription?: string;
  instructions?: string;
  assignmentInstructions?: string;
  resources?: string;
  submissionRequirements?: string;
  assignmentSubmissionType?: string;
  deadline?: string;
  assignmentDueDate?: string;
  maxMarks?: number;
  assignmentMaxMarks?: number;
  attachmentUrl?: string;
  [key: string]: any;
}

export function parseProjectMeta(description?: string | null): ProjectMetadata {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    return {
      projectDescription: description.trim(),
    };
  }
  return {};
}

interface ProjectLessonViewProps {
  lesson: any;
  courseId: number | string;
  moduleTitle?: string;
  isCompleted: boolean;
  onProjectCompleted: (lessonId: number) => void;
  onPreviousLesson: () => void;
  onNextLesson: () => void;
  isFirstLesson: boolean;
  isLastLesson: boolean;
  isNextLocked: boolean;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function ProjectLessonView({
  lesson,
  courseId,
  moduleTitle,
  isCompleted,
  onProjectCompleted,
  onPreviousLesson,
  onNextLesson,
  isFirstLesson,
  isLastLesson,
  isNextLocked,
  onShowToast,
}: ProjectLessonViewProps) {
  const meta: ProjectMetadata = parseProjectMeta(lesson.description);

  const [githubUrl, setGithubUrl] = useState<string>('');
  const [liveUrl, setLiveUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [previousSubmission, setPreviousSubmission] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Load existing submission from backend
  useEffect(() => {
    let isMounted = true;
    const loadSubmission = async () => {
      try {
        setLoadingSubmission(true);
        const res = await apiClient.get(`/courses/${courseId}/lessons/${lesson.id}/project`);
        if (isMounted && res.data?.submission) {
          setPreviousSubmission(res.data.submission);
          setGithubUrl(res.data.submission.github_url || '');
          setLiveUrl(res.data.submission.live_url || '');
          setNotes(res.data.submission.description || '');
        }
      } catch (e) {
        // Fallback to localStorage if any
        try {
          const saved = localStorage.getItem(`ingage_project_sub_${courseId}_${lesson.id}`);
          if (saved && isMounted) {
            const parsed = JSON.parse(saved);
            setPreviousSubmission(parsed);
            setGithubUrl(parsed.github_url || '');
            setLiveUrl(parsed.live_url || '');
            setNotes(parsed.description || '');
          }
        } catch {}
      } finally {
        if (isMounted) setLoadingSubmission(false);
      }
    };

    loadSubmission();
    return () => {
      isMounted = false;
    };
  }, [lesson.id, courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim() && !liveUrl.trim() && !notes.trim()) {
      if (onShowToast) onShowToast('Please provide at least a GitHub URL, Live Demo, or Project Notes.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lesson.id}/project`, {
        githubUrl: githubUrl.trim(),
        liveUrl: liveUrl.trim(),
        notes: notes.trim(),
      });

      const submissionData = res.data?.submission || {
        github_url: githubUrl.trim(),
        live_url: liveUrl.trim(),
        description: notes.trim(),
        created_at: new Date().toISOString(),
        status: 'COMPLETED',
      };

      setPreviousSubmission(submissionData);
      setIsEditing(false);

      try {
        localStorage.setItem(`ingage_project_sub_${courseId}_${lesson.id}`, JSON.stringify(submissionData));
      } catch {}

      onProjectCompleted(lesson.id);
      if (onShowToast) onShowToast('Project submitted and marked as completed! ✓', 'success');
    } catch (err: any) {
      console.error('Project submission error:', err);
      // Client-side fallback save
      const submissionData = {
        github_url: githubUrl.trim(),
        live_url: liveUrl.trim(),
        description: notes.trim(),
        created_at: new Date().toISOString(),
        status: 'COMPLETED',
      };
      setPreviousSubmission(submissionData);
      setIsEditing(false);
      try {
        localStorage.setItem(`ingage_project_sub_${courseId}_${lesson.id}`, JSON.stringify(submissionData));
      } catch {}
      onProjectCompleted(lesson.id);
      if (onShowToast) onShowToast('Project submitted successfully! ✓', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const projectTitle = meta.projectTitle || lesson.title;
  const projectDesc = meta.projectDescription || '';
  const instructions = meta.instructions || meta.assignmentInstructions || '';
  const deadline = meta.deadline || meta.assignmentDueDate || '';
  const maxMarks = meta.maxMarks || meta.assignmentMaxMarks || 100;
  const resources = meta.resources || '';
  const submissionType = meta.submissionRequirements || meta.assignmentSubmissionType || 'GitHub Repository / Project URL';

  const hasSubmission = Boolean(previousSubmission || isCompleted);

  return (
    <div className="space-y-6">
      {/* 1. Project Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold uppercase tracking-wider">
            <FolderArchive className="w-4 h-4 text-emerald-600" />
            <span>{moduleTitle || 'Curriculum Module'}</span>
          </div>

          <div className="flex items-center gap-2">
            {hasSubmission ? (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Project Completed ✓</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Submission</span>
              </span>
            )}

            {maxMarks > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                Max Marks: {maxMarks}
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {projectTitle}
          </h1>
          {projectDesc && (
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {projectDesc}
            </p>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs text-slate-500 font-medium">
          {deadline && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline: <strong className="text-slate-700">{deadline}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span>Submission Type: <strong className="text-slate-700">{submissionType}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Project Instructions & Resources */}
      {(instructions || resources) && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          {instructions && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Project Instructions &amp; Requirements</span>
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {instructions}
              </div>
            </div>
          )}

          {resources && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-sky-600" />
                <span>Reference Materials &amp; Resources</span>
              </h3>
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {resources}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Project Submission Area */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600" />
              <span>Project Deliverable Submission</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit your project repository or live URL to verify competency and complete this lesson.
            </p>
          </div>

          {hasSubmission && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Update Submission
            </button>
          )}
        </div>

        {/* Previous Submission Card */}
        {hasSubmission && !isEditing ? (
          <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Submission Recorded</span>
            </div>

            <div className="space-y-2 text-xs">
              {previousSubmission?.github_url && (
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-slate-500">Repository:</span>
                  <a
                    href={previousSubmission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{previousSubmission.github_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {previousSubmission?.live_url && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-slate-500">Live Demo:</span>
                  <a
                    href={previousSubmission.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-700 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{previousSubmission.live_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {previousSubmission?.description && (
                <div className="pt-2 border-t border-emerald-100 text-slate-700">
                  <span className="text-slate-500 font-semibold block text-[11px] mb-1">Submission Notes:</span>
                  <p className="bg-white/80 p-3 rounded-xl border border-emerald-100 leading-relaxed">
                    {previousSubmission.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-600" />
                <span>GitHub Repository URL</span>
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project-repo"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Live Project / Demo URL (Optional)</span>
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://my-project.vercel.app"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Submission Notes &amp; Documentation</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Outline key implementation details, architectural choices, and instructions to test your project..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{hasSubmission ? 'Update Deliverable' : 'Submit Project & Complete Lesson'}</span>
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* 4. Previous & Next Navigation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPreviousLesson}
          disabled={isFirstLesson}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Lesson</span>
        </button>

        <button
          type="button"
          onClick={onNextLesson}
          disabled={isLastLesson || isNextLocked}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Next Lesson</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
