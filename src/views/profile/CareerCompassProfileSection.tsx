"use client";
import React from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  BookOpen,
  FolderGit2,
  Award,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { CareerCompassReadinessDto } from '../../api/profileApi';

interface CareerCompassProfileSectionProps {
  compass: CareerCompassReadinessDto | null;
  onNavigate: (path: string, param?: string) => void;
  onNavigateTab?: (tab: string) => void;
  compactPreview?: boolean;
}

export const CareerCompassProfileSection: React.FC<CareerCompassProfileSectionProps> = ({
  compass,
  onNavigate,
  onNavigateTab,
  compactPreview = false,
}) => {
  const targetRole = compass?.targetJobRole || compass?.careerTitle;
  const careerSlug = compass?.careerSlug;
  const readiness = compass?.readinessPercentage ?? 0;
  const matchedSkills = compass?.matchedSkills || [];
  const missingSkills = compass?.missingSkills || [];
  const recommendedCourses = compass?.recommendedCourses || [];
  const recommendedProjects = compass?.recommendedProjects || [];
  const recommendedCredentials = compass?.recommendedCredentials || [];

  if (!targetRole) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs text-center flex flex-col items-center justify-center transition-all h-full min-h-[290px]">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-lime-50 border border-lime-200/60 text-[#8DB600] flex items-center justify-center mb-4 shadow-xs">
          <Compass className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-[22px] font-bold text-gray-900 tracking-tight mb-2">
          Set Your Target Career Role
        </h2>
        <p className="text-sm sm:text-[15px] text-gray-500 leading-relaxed max-w-sm mx-auto mb-6">
          Select a target job role in your Career Goals to activate Career Compass, calculate your readiness score, and get personalized recommendations.
        </p>
        <button
          id="choose-target-role-btn"
          onClick={() => onNavigateTab && onNavigateTab('career')}
          className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] active:scale-[0.99] text-white font-semibold text-sm sm:text-[15px] shadow-xs hover:shadow-md transition-all cursor-pointer w-full sm:w-auto"
        >
          <span>Choose Target Role</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Compact preview for dashboard overview column
  if (compactPreview) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between h-full min-h-[290px]">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-gradient-to-br from-lime-100/40 via-emerald-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-lime-100 text-lime-900 border border-lime-200">
              <Compass className="w-3.5 h-3.5 text-[#8DB600]" />
              <span>Career Compass</span>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {compass.careerLevel || 'Target Role'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight line-clamp-1 mb-1">
            {compass.careerTitle || targetRole}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            {compass.careerCategory || 'InGage Pathway'}
          </p>

          {/* Readiness Meter */}
          <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-100 mb-4">
            <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
              <span>Career Readiness</span>
              <span className="font-extrabold text-[#8DB600] text-sm">{readiness}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8DB600] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(readiness, 5)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
              <span>{matchedSkills.length} skills acquired</span>
              <span>{missingSkills.length} skills to learn</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 relative z-10">
          {careerSlug ? (
            <button
              onClick={() => onNavigate(`/roles/${careerSlug}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              <span>View Career Path</span>
              <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab && onNavigateTab('compass')}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Target Role & Readiness */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-gradient-to-br from-lime-100/40 via-emerald-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-lime-100 text-lime-900 border border-lime-200 mb-2">
              <Compass className="w-3.5 h-3.5 text-[#8DB600]" />
              Career Compass Pathway
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {compass.careerTitle || targetRole}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
              {compass.careerCategory && (
                <span className="font-semibold text-gray-700">{compass.careerCategory}</span>
              )}
              {compass.careerLevel && (
                <>
                  <span>•</span>
                  <span>{compass.careerLevel}</span>
                </>
              )}
            </div>
          </div>

          {/* Readiness Gauge & CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 w-full sm:w-auto">
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Career Readiness
                </div>
                <div className="text-2xl font-black text-[#8DB600]">
                  {readiness}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-lime-100 flex items-center justify-center text-xs font-extrabold text-[#8DB600]">
                {readiness}%
              </div>
            </div>

            {careerSlug && (
              <button
                id="view-career-path-btn"
                onClick={() => onNavigate(`/roles/${careerSlug}`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <span>View Career Path</span>
                <ArrowRight className="w-4 h-4 text-lime-400" />
              </button>
            )}
          </div>
        </div>

        {/* Readiness Progress Bar */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
            <span>Role Skills Match</span>
            <span>{matchedSkills.length} of {matchedSkills.length + missingSkills.length} competencies acquired</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#8DB600] to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skills Gap Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Skills Completed ({matchedSkills.length})
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Verified
            </span>
          </div>

          {matchedSkills.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4">
              None of your listed skills match this role yet. Add matching skills in the Skills section or enroll in courses below!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Skills Remaining to Acquire ({missingSkills.length})
            </h3>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Target
            </span>
          </div>

          {missingSkills.length === 0 ? (
            <p className="text-xs text-emerald-600 font-semibold py-4">
              Congratulations! You have completed all required competencies for this career role!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-xs font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {sk}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Courses & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Courses */}
        {recommendedCourses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8DB600]" />
                Recommended Courses for {targetRole}
              </h3>
            </div>
            <div className="space-y-3">
              {recommendedCourses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate(`/courses/${c.slug}`)}
                  className="p-3 rounded-xl bg-gray-50/70 hover:bg-lime-50/30 border border-gray-100 hover:border-lime-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#8DB600] shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 group-hover:text-[#6d8d00] truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {c.category} • {c.level}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#8DB600] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Projects */}
        {recommendedProjects.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-purple-600" />
                Recommended Industry Projects
              </h3>
            </div>
            <div className="space-y-3">
              {recommendedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('/projects')}
                  className="p-3 rounded-xl bg-gray-50/70 hover:bg-purple-50/30 border border-gray-100 hover:border-purple-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-purple-700 truncate">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {p.technologies}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Credential Edge Credentials */}
      {recommendedCredentials.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Recommended Credential Edge Recognised Certifications
            </h3>
            <button
              onClick={() => onNavigate('/credential-edge')}
              className="text-xs font-bold text-[#8DB600] hover:underline flex items-center gap-1"
            >
              Explore All <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedCredentials.map((cr) => (
              <div
                key={cr.id}
                onClick={() => onNavigate(`/credential-courses/${cr.slug}`)}
                className="p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/30 border border-gray-100 hover:border-amber-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-amber-800 truncate">
                      {cr.title}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {cr.provider} • {cr.credentialName || 'Professional Certificate'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
