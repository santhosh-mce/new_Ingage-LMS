"use client";
import React from 'react';
import {
  X,
  Code,
  Clock,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  Play,
  ArrowRight,
  Layers,
  Sparkles,
  Award,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ProjectDto, LearnerProjectProgress } from '../../api/projectApi';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDto | null;
  progress?: LearnerProjectProgress;
  onStartProject: (project: ProjectDto) => void;
  onToggleTask: (projectId: number | string, taskId: string) => void;
  onContinueProject: (project: ProjectDto) => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project,
  progress,
  onStartProject,
  onToggleTask,
  onContinueProject,
}) => {
  if (!isOpen || !project) return null;

  const status = progress?.status || 'Not Started';
  const safePercentage = Math.min(
    100,
    Math.max(0, Math.round(progress?.progressPercentage ?? 0))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Banner */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/70 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold shrink-0">
                <Code className="w-8 h-8 text-[#8DB600]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-200">
                  {project.category || project.industry || 'General'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  {project.difficulty}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  {project.duration}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mt-1">
                {project.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7 divide-y divide-gray-100 text-sm text-gray-700">
          {/* Progress Tracker Status Box */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <TrendingUp className="w-4 h-4 text-[#8DB600]" />
                <span>Learner Status: {status}</span>
              </div>
              <span className="text-xs font-extrabold text-gray-900">
                {safePercentage}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'Completed' ? 'bg-emerald-500' : 'bg-[#8DB600]'
                }`}
                style={{ width: `${safePercentage}%` }}
              />
            </div>
            {progress?.lastUpdated && (
              <p className="text-[11px] text-gray-400">
                Last activity: {progress.lastUpdated}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 pt-6">
            <h3 className="text-base font-bold text-gray-900">Project Overview</h3>
            <p className="text-gray-600 leading-relaxed">{project.description}</p>
          </div>

          {/* Tasks & Milestones (What You Will Build) */}
          <div className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Project Milestones &amp; Tasks
              </h3>
              {progress?.tasks && progress.tasks.length > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {progress.completedTasks}/{progress.totalTasks} completed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Check off tasks as you build and validate components.
            </p>

            <div className="space-y-2.5 pt-1">
              {(progress?.tasks || (project.whatYouWillBuild || []).map((t, i) => ({
                id: `preview-task-${i}`,
                title: t,
                completed: false,
              }))).map((task) => (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {
                      if (status === 'Not Started') {
                        onStartProject(project);
                      }
                      onToggleTask(project.id, task.id);
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-[#8DB600] focus:ring-[#8DB600] cursor-pointer"
                  />
                  <span
                    className={`text-xs sm:text-sm font-medium leading-relaxed ${
                      task.completed ? 'line-through text-emerald-800' : ''
                    }`}
                  >
                    {task.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="space-y-2.5 pt-6">
              <h3 className="text-base font-bold text-gray-900">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold border border-gray-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Outcomes */}
          {project.learningOutcomes && project.learningOutcomes.length > 0 && (
            <div className="space-y-2.5 pt-6">
              <h3 className="text-base font-bold text-gray-900">Learning Outcomes</h3>
              <ul className="space-y-2">
                {project.learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-gray-600 text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#8DB600] mt-0.5 shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {project.prerequisites && (
            <div className="space-y-2 pt-6">
              <h3 className="text-base font-bold text-gray-900">Prerequisites</h3>
              <p className="text-xs sm:text-sm text-gray-600 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl">
                {project.prerequisites}
              </p>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {status === 'Completed' ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Project Completed ✓</span>
              </div>
            ) : status === 'In Progress' ? (
              <button
                onClick={() => onContinueProject(project)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Continue Building</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onStartProject(project)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Project</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
