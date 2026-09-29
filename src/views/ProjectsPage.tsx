"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Sparkles,
  Sprout,
  Clock,
  Bookmark,
  Code,
  Heart,
  Gamepad2,
  Building2,
  DollarSign,
  GraduationCap,
  Factory,
  X,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  Grid,
  Check
} from 'lucide-react';
import { ProjectTrack, UserProfile } from '../types';
import { getPublicProjects } from '../api/exploreApi';
import { useAppSelector } from '../store/hooks';

interface ProjectsPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
}

interface IndustryItem {
  id: string;
  name: string;
  label: string;
  count: number;
  icon: React.ElementType;
  iconBg: string;
}

const INDUSTRIES: IndustryItem[] = [
  {
    id: 'All',
    name: 'All',
    label: 'All Projects',
    count: 12,
    icon: Code,
    iconBg: 'bg-lime-500'
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    label: 'Healthcare',
    count: 2,
    icon: Heart,
    iconBg: 'bg-rose-500'
  },
  {
    id: 'Gaming',
    name: 'Gaming',
    label: 'Gaming',
    count: 2,
    icon: Gamepad2,
    iconBg: 'bg-purple-600'
  },
  {
    id: 'Smart Cities',
    name: 'Smart Cities',
    label: 'Smart Cities',
    count: 2,
    icon: Building2,
    iconBg: 'bg-sky-500'
  },
  {
    id: 'FinTech',
    name: 'FinTech',
    label: 'FinTech',
    count: 2,
    icon: DollarSign,
    iconBg: 'bg-emerald-600'
  },
  {
    id: 'EdTech',
    name: 'EdTech',
    label: 'EdTech',
    count: 2,
    icon: GraduationCap,
    iconBg: 'bg-amber-500'
  },
  {
    id: 'Manufacturing',
    name: 'Manufacturing',
    label: 'Manufacturing',
    count: 2,
    icon: Factory,
    iconBg: 'bg-slate-800'
  }
];

export function ProjectsPage({ onNavigate, onShowToast, currentUser: propUser, onOpenAuth }: ProjectsPageProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [activeProject, setActiveProject] = useState<ProjectTrack | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [enrolledProjects, setEnrolledProjects] = useState<string[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getPublicProjects()
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectsList(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projectsList.filter((p) => {
    if (selectedIndustry === 'All') return true;
    return (p.industry || p.category) === selectedIndustry;
  });

  const getIndustryVisuals = (industry: string) => {
    switch (industry) {
      case 'Healthcare':
        return { icon: Heart, bg: 'bg-[#ff3366]' };
      case 'Gaming':
        return { icon: Gamepad2, bg: 'bg-[#8b5cf6]' };
      case 'Smart Cities':
        return { icon: Building2, bg: 'bg-[#0ea5e9]' };
      case 'FinTech':
        return { icon: DollarSign, bg: 'bg-[#10b981]' };
      case 'EdTech':
        return { icon: GraduationCap, bg: 'bg-[#f59e0b]' };
      case 'Manufacturing':
        return { icon: Factory, bg: 'bg-[#1e293b]' };
      default:
        return { icon: Code, bg: 'bg-lime-600' };
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-[#eaf8e6] text-[#2e7d32] border border-[#d2f0cb]';
      case 'Intermediate':
        return 'bg-[#fef9c3] text-[#ca8a04] border border-[#fef08a]';
      case 'Advanced':
        return 'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartProject = (proj: ProjectTrack) => {
    if (!currentUser) {
      if (onShowToast) {
        onShowToast(`Please sign in or create an account to start ${proj.title}.`);
      }
      if (onOpenAuth) {
        onOpenAuth('signup', '/projects');
      }
      return;
    }

    if (!enrolledProjects.includes(proj.id)) {
      setEnrolledProjects((prev) => [...prev, proj.id]);
    }
    if (onShowToast) {
      onShowToast(`Enrolled in ${proj.title}! Interactive workspace initialized.`);
    }
    setActiveProject(null);
  };

  return (
    <div className="w-full bg-white pb-6 relative">
      {/* Container */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-6 sm:pt-8">
        {/* Back Link */}
        <button
          id="back-to-home-link"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime-600 hover:text-lime-700 transition-colors mb-5 sm:mb-6 cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Header Title Section */}
        <div className="flex items-start gap-3.5 mb-2">
          <div className="text-lime-600 mt-1">
            <Sprout className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
              Discover Projects by Industry
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
              Explore real-world projects across different industries. Perfect for students who want to build practical skills without focusing on specific careers.
            </p>
          </div>
        </div>

        {/* Callout Notice */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#FAF5FF] border border-purple-100 flex items-start gap-3.5">
          <div className="text-purple-600 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-purple-900">Project-First Learning</div>
            <p className="mt-1 text-xs sm:text-sm text-purple-900/85 leading-relaxed">
              All projects use the same rigorous learning system as job-role tracks: sequential gated learning, mentor reviews, and verified certifications. No shortcuts.
            </p>
          </div>
        </div>

        {/* Select an Industry Section */}
        <div className="mt-10 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Select an Industry
          </h2>

          {/* Industry Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {INDUSTRIES.map((ind) => {
              const IconComponent = ind.icon;
              const isSelected = selectedIndustry === ind.id;

              return (
                <button
                  key={ind.id}
                  id={`industry-filter-${ind.id.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedIndustry(ind.id)}
                  className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer text-center group ${
                    isSelected
                      ? 'border-2 border-[#84cc16] bg-lime-50/40 shadow-xs'
                      : 'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${ind.iconBg} text-white flex items-center justify-center mb-3 shadow-xs transition-transform duration-200 group-hover:scale-105`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-sm font-bold leading-tight ${
                      isSelected ? 'text-[#65a30d] font-extrabold' : 'text-gray-900'
                    }`}
                  >
                    {ind.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 font-medium">
                    {ind.count} projects
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Heading for Selected Category */}
        <div className="mt-12 sm:mt-14 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {selectedIndustry === 'All' ? 'All Projects' : `${selectedIndustry} Projects`}
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} available
          </p>
        </div>

        {/* Projects Cards Grid with smooth hover transitions matching Image 1 */}
        {loading ? (
          <div className="py-20 text-center text-gray-500 font-medium">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 text-center text-gray-500 font-medium">No projects found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
            const { icon: IndustryIcon, bg: industryBg } = getIndustryVisuals(project.industry);
            const difficultyBadgeClass = getDifficultyBadge(project.difficulty);
            const isEnrolled = enrolledProjects.includes(project.id);
            const isHovered = hoveredProjectId === project.id;

            return (
              <motion.div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => setActiveProject(project)}
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={`bg-white rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer relative ${
                  isHovered
                    ? 'border-2 border-[#84cc16] shadow-md ring-2 ring-[#84cc16]/10'
                    : 'border border-gray-200/90 shadow-2xs hover:border-[#84cc16]'
                }`}
              >
                <div>
                  {/* Top Row: Icon and Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${industryBg} text-white flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}
                    >
                      <IndustryIcon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${difficultyBadgeClass}`}>
                      {project.difficulty}
                    </span>
                  </div>

                  {/* Industry Label */}
                  <div className="text-xs font-semibold text-[#84cc16] mt-4 mb-1 tracking-wide">
                    {project.industry}
                  </div>

                  {/* Project Title (highlighted on hover like Image 1) */}
                  <h3
                    className={`text-lg sm:text-xl font-bold leading-snug transition-colors duration-200 ${
                      isHovered ? 'text-[#7cb342]' : 'text-gray-900'
                    }`}
                  >
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Metadata (Duration & Skills) */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{project.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                      <span>{project.skillsCount} skills</span>
                    </div>
                  </div>
                </div>

                {/* Tech Stack Tags */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                  {project.techStack.slice(0, 3).map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                      +{project.techStack.length - 3} more
                    </span>
                  )}

                  {isEnrolled && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>

      {/* Floating Action Button in bottom-right (matching Image 1) */}
      <button
        id="floating-grid-btn"
        onClick={() => setSelectedIndustry('All')}
        title="View All Projects"
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-[#7cb342] hover:bg-[#689f38] text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
      >
        <Grid className="w-5 h-5" />
      </button>

      {/* Full Modal matching Image 2, 3, 4, 5 */}
      <AnimatePresence>
        {activeProject && (
          <div
            id="project-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setActiveProject(null)}
          >
            <motion.div
              id="project-modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden relative my-6 flex flex-col max-h-[92vh]"
            >
              {/* Green Header Section (Images 2, 3, 4, 5) */}
              <div className="bg-[#7cb342] p-6 sm:p-8 text-white relative shrink-0">
                {/* Close Button */}
                <button
                  id="close-project-modal-btn"
                  onClick={() => setActiveProject(null)}
                  className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Top Info: Icon + Badges + Title */}
                <div className="flex items-start gap-4 sm:gap-5 pr-10">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                    {React.createElement(getIndustryVisuals(activeProject.industry).icon, {
                      className: 'w-8 h-8 sm:w-9 sm:h-9'
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {activeProject.industry}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <span className="w-2 h-2 rounded-full bg-[#34d399] inline-block" />
                        <span>{activeProject.difficulty}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tracking-tight leading-tight">
                      {activeProject.title}
                    </h2>

                    {/* Subtitle / Description */}
                    <p className="text-sm sm:text-base text-white/95 mt-1.5 font-normal leading-relaxed">
                      {activeProject.description}
                    </p>
                  </div>
                </div>

                {/* Frosted Stats Row (Duration, Skills, Level) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mt-6">
                  {/* Duration */}
                  <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-3 sm:p-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-white/85 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {activeProject.duration}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-3 sm:p-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-white/85 font-medium">
                      <Code className="w-3.5 h-3.5" />
                      <span>Skills</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {activeProject.skillsCount}
                    </div>
                  </div>

                  {/* Level */}
                  <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-3 sm:p-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-white/85 font-medium">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Level</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1">
                      {activeProject.difficulty}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Modal Content (Images 2, 3, 4) */}
              <div className="overflow-y-auto p-6 sm:p-8 space-y-7 flex-1">
                {/* 1. What You Will Build */}
                <div>
                  <div className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 mb-3.5">
                    <Sprout className="w-6 h-6 text-[#7cb342]" />
                    <h3>What You Will Build</h3>
                  </div>
                  <div className="bg-[#f7fcf6] border border-[#e2f3df] rounded-2xl p-5 sm:p-6 space-y-3">
                    {(activeProject.whatYouWillBuild || [
                      'Interactive responsive application interface with modern standards',
                      'Real-time state and local storage synchronization',
                      'Data visualization dashboard with trend charts',
                      'Automated notification and alert triggers'
                    ]).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#7cb342] shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base font-medium text-gray-800 leading-snug">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Learning Outcomes */}
                <div>
                  <div className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 mb-3.5">
                    <TrendingUp className="w-6 h-6 text-[#7cb342]" />
                    <h3>Learning Outcomes</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeProject.learningOutcomes || [
                      'Understand web development fundamentals',
                      'Work with data storage and retrieval',
                      'Create interactive user interfaces',
                      'Implement data visualization techniques'
                    ]).map((outcome, idx) => (
                      <div
                        key={idx}
                        className="bg-[#f9fafb] border border-gray-100 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 shadow-2xs"
                      >
                        <span className="w-6 h-6 rounded-full bg-[#7cb342] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800 leading-snug">
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Skills You Will Learn */}
                <div>
                  <div className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 mb-3.5">
                    <Code className="w-6 h-6 text-[#7cb342]" />
                    <h3>Skills You Will Learn</h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {(activeProject.skillsLearned || activeProject.techStack).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 rounded-xl bg-white border border-[#c5e1a5] text-gray-800 font-semibold text-sm shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Prerequisites */}
                <div>
                  <div className="flex items-center gap-2.5 text-xl font-extrabold text-gray-900 mb-3.5">
                    <Users className="w-6 h-6 text-[#7cb342]" />
                    <h3>Prerequisites</h3>
                  </div>
                  <div className="bg-[#f1f8ee] border border-[#cde7c7] rounded-xl p-4 text-[#2e7d32] flex items-center gap-2.5 font-medium text-sm sm:text-base">
                    <Sparkles className="w-5 h-5 shrink-0 text-[#2e7d32]" />
                    <span>
                      {activeProject.prerequisites ||
                        'No prerequisites required! This project is perfect for beginners.'}
                    </span>
                  </div>
                </div>

                {/* 5. Same Rigorous Learning System (Images 4, 5) */}
                <div className="bg-[#f0f7ff] border border-[#d2e5fc] rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-blue-900">
                    <Award className="w-5 h-5 text-blue-600 shrink-0" />
                    <h4>Same Rigorous Learning System</h4>
                  </div>
                  <p className="text-sm text-blue-950/80 leading-relaxed">
                    This project uses the same validated learning system as our job-role tracks:
                  </p>
                  <ul className="space-y-2 text-sm text-blue-900/90 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Sequential gated learning (Video → Quiz → Practice → Next)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Mentor review required for project submissions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>No shortcuts or auto-completion</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Verified certificates upon completion</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Sticky Action Bar (Image 5) */}
              <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button
                  id="start-this-project-btn"
                  onClick={() => handleStartProject(activeProject)}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#7cb342] hover:bg-[#689f38] text-white font-bold text-base shadow-md shadow-lime-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>
                    {enrolledProjects.includes(activeProject.id)
                      ? 'Continue This Project'
                      : 'Start This Project'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="browse-more-projects-btn"
                  onClick={() => setActiveProject(null)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-base transition-colors flex items-center justify-center cursor-pointer active:scale-98"
                >
                  Browse More Projects
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProjectsPage;
