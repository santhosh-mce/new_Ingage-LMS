"use client";
import React from 'react';
import {
  Code,
  Clock,
  TrendingUp,
  CheckCircle2,
  Play,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Award
} from 'lucide-react';
import { ProjectDto, LearnerProjectProgress, ProjectStatus } from '../../api/projectApi';

interface LearnerProjectCardProps {
  project: ProjectDto;
  progress?: LearnerProjectProgress;
  onViewProject: (project: ProjectDto) => void;
  onContinueProject: (project: ProjectDto) => void;
  onStartProject: (project: ProjectDto) => void;
}

export const LearnerProjectCard: React.FC<LearnerProjectCardProps> = ({
  project,
  progress,
  onViewProject,
  onContinueProject,
  onStartProject,
}) => {
  const status: ProjectStatus = progress?.status || 'Not Started';

  // Calculate safe percentage (never NaN or undefined)
  const safePercentage = Math.min(
    100,
    Math.max(0, Math.round(progress?.progressPercentage ?? 0))
  );

  const getStatusBadge = () => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span>Not Started</span>
          </span>
        );
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'healthcare':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'gaming':
        return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'fintech':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'smart cities':
        return 'text-sky-600 bg-sky-50 border-sky-100';
      default:
        return 'text-lime-700 bg-lime-50 border-lime-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Section */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Image/Icon, Title & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold shrink-0">
                <Code className="w-6 h-6 text-[#8DB600]" />
              </div>
            )}
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border mb-1 ${getCategoryColor(
                  project.category || project.industry
                )}`}
              >
                {project.category || project.industry || 'General'}
              </span>
              <h3 className="font-bold text-base sm:text-lg text-gray-950 line-clamp-1 group-hover:text-lime-700 transition-colors">
                {project.title}
              </h3>
            </div>
          </div>

          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Technologies List */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Technology:
            </div>
            <div className="text-xs font-semibold text-gray-800 truncate">
              {project.techStack.join(' • ')}
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-500">Progress:</span>
            <span className="font-bold text-gray-900">
              {safePercentage}%
              {progress?.totalTasks ? ` (${progress.completedTasks}/${progress.totalTasks} tasks)` : ''}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === 'Completed' ? 'bg-emerald-500' : 'bg-[#8DB600]'
              }`}
              style={{ width: `${safePercentage}%` }}
            />
          </div>
        </div>

        {/* Metadata Footer: Duration / Last Updated */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Est. {project.duration || '25h'}</span>
          </div>
          {progress?.lastUpdated && (
            <div className="text-[11px] text-gray-400">
              Updated {progress.lastUpdated}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="px-5 py-3.5 sm:px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
        <button
          onClick={() => onViewProject(project)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-gray-950 hover:bg-gray-200/70 transition-colors cursor-pointer"
        >
          View Project
        </button>

        {status === 'Completed' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Complete</span>
          </div>
        ) : status === 'In Progress' ? (
          <button
            onClick={() => onContinueProject(project)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <span>Continue Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onStartProject(project)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Start Project</span>
          </button>
        )}
      </div>
    </div>
  );
};
