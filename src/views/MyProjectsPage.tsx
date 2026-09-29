"use client";
import React, { useEffect, useState, useMemo } from 'react';
import {
  Code,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  Play,
  ArrowRight,
  ChevronRight,
  FolderPlus
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProjectsThunk,
  loadUserProgress,
  startProject,
  toggleTaskCompletion,
  setSearchQuery,
  setStatusFilter,
  clearFilters,
} from '../store/slices/projectSlice';
import { ProjectDto, ProjectStatus } from '../api/projectApi';
import { LearnerProjectCard } from '../components/projects/LearnerProjectCard';
import { ProjectDetailsModal } from '../components/projects/ProjectDetailsModal';
import { UserProfile } from '../types';

interface MyProjectsPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUser?: UserProfile | null;
}

export function MyProjectsPage({
  onNavigate,
  onShowToast,
  currentUser: propUser,
}: MyProjectsPageProps) {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const {
    projects,
    learnerProgress,
    searchQuery,
    statusFilter,
    loading,
    error,
  } = useAppSelector((state) => state.project);

  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<ProjectDto | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    dispatch(fetchProjectsThunk());
    dispatch(loadUserProgress(currentUser?.id));
  }, [dispatch, currentUser?.id]);

  // Compute dynamic project summary statistics from actual data
  const summaryStats = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let notStarted = 0;

    projects.forEach((p) => {
      const prog = learnerProgress[String(p.id)];
      const status: ProjectStatus = prog?.status || 'Not Started';
      if (status === 'Completed') completed++;
      else if (status === 'In Progress') inProgress++;
      else notStarted++;
    });

    return {
      total: projects.length,
      inProgress,
      completed,
      notStarted,
    };
  }, [projects, learnerProgress]);

  // Combined Search and Status filter
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const prog = learnerProgress[String(project.id)];
      const status: ProjectStatus = prog?.status || 'Not Started';

      // 1. Status filter
      if (statusFilter !== 'All' && status !== statusFilter) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = project.title.toLowerCase().includes(query);
        const matchesDesc = project.description?.toLowerCase().includes(query);
        const matchesCategory = (project.category || project.industry)?.toLowerCase().includes(query);
        const matchesTech = project.techStack?.some((t) => t.toLowerCase().includes(query));
        const matchesSkills = project.skillsLearned?.some((s) => s.toLowerCase().includes(query));

        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTech && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [projects, learnerProgress, statusFilter, searchQuery]);

  // Handlers
  const handleStartProject = (project: ProjectDto) => {
    dispatch(startProject({ userId: currentUser?.id, project }));
    if (onShowToast) {
      onShowToast(`Started "${project.title}"! Project workspace initialized.`, 'success');
    }
  };

  const handleContinueProject = (project: ProjectDto) => {
    setSelectedProjectForDetails(project);
    if (onShowToast) {
      onShowToast(`Resuming "${project.title}".`, 'info');
    }
  };

  const handleToggleTask = (projectId: number | string, taskId: string) => {
    dispatch(toggleTaskCompletion({ userId: currentUser?.id, projectId, taskId }));
  };

  const statusTabs: { label: string; value: 'All' | ProjectStatus; count: number }[] = [
    { label: 'All', value: 'All', count: summaryStats.total },
    { label: 'In Progress', value: 'In Progress', count: summaryStats.inProgress },
    { label: 'Completed', value: 'Completed', count: summaryStats.completed },
    { label: 'Not Started', value: 'Not Started', count: summaryStats.notStarted },
  ];

  return (
    <div className="w-full bg-[#f8fafc] min-h-[calc(100vh-4.5rem)] pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                My Projects
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Build, manage and track your learning projects.
              </p>
            </div>

            <button
              id="browse-projects-top-btn"
              onClick={() => onNavigate('/projects')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Explore Projects</span>
            </button>
          </div>

          {/* 2. Real Backend Project Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Total Projects
              </span>
              <p className="text-2xl font-black text-gray-950 mt-1">{summaryStats.total}</p>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-center">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                In Progress
              </span>
              <p className="text-2xl font-black text-blue-900 mt-1">{summaryStats.inProgress}</p>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Completed
              </span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{summaryStats.completed}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Not Started
              </span>
              <p className="text-2xl font-black text-gray-900 mt-1">{summaryStats.notStarted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="search-projects-input"
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search projects by title, description, technology, or skills..."
                className="w-full pl-11 pr-16 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => dispatch(setSearchQuery(''))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {(searchQuery || statusFilter !== 'All') && (
              <button
                onClick={() => dispatch(clearFilters())}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => dispatch(setStatusFilter(tab.value))}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-gray-950 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    statusFilter === tab.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Content Area & Project Cards Grid */}
        {/* Loading State Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-2 bg-gray-200 rounded-full w-full pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-600" />
            <h3 className="font-bold text-gray-900">Unable to load your projects.</h3>
            <p className="text-xs text-rose-700">Please try again.</p>
            <button
              onClick={() => dispatch(fetchProjectsThunk())}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State: No projects in catalog or enrolled */}
        {!loading && !error && projects.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <FolderPlus className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No projects yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              You haven't started any projects yet.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/projects')}
                className="px-6 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Explore Projects
              </button>
            </div>
          </div>
        )}

        {/* No Search Results State */}
        {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Try a different search term or change the filter.
            </p>
            <div className="pt-2">
              <button
                onClick={() => dispatch(clearFilters())}
                className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = learnerProgress[String(project.id)];
              return (
                <LearnerProjectCard
                  key={project.id}
                  project={project}
                  progress={progress}
                  onViewProject={(p) => setSelectedProjectForDetails(p)}
                  onContinueProject={handleContinueProject}
                  onStartProject={handleStartProject}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Project Details Modal */}
      <ProjectDetailsModal
        isOpen={Boolean(selectedProjectForDetails)}
        onClose={() => setSelectedProjectForDetails(null)}
        project={selectedProjectForDetails}
        progress={
          selectedProjectForDetails
            ? learnerProgress[String(selectedProjectForDetails.id)]
            : undefined
        }
        onStartProject={handleStartProject}
        onToggleTask={handleToggleTask}
        onContinueProject={(p) => {
          setSelectedProjectForDetails(null);
          if (onShowToast) {
            onShowToast(`Workspace open for ${p.title}`, 'success');
          }
        }}
      />
    </div>
  );
}

export default MyProjectsPage;
