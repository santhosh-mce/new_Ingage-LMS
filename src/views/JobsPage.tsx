"use client";
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Briefcase,
  MapPin,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Code2,
  UserCheck,
  Users,
  MessageSquare,
  Lightbulb,
  X,
  CheckCircle2,
  Building,
  RotateCcw
} from 'lucide-react';
import { INITIAL_OPPORTUNITIES, Opportunity } from '../data/opportunitiesData';
import { UserProfile } from '../types';
import { JobDetailsModal } from '../components/opportunities/JobDetailsModal';
import { TrackStatusModal } from '../components/opportunities/TrackStatusModal';
import { LockedSkillModal } from '../components/opportunities/LockedSkillModal';
import { QuickAccessModal, QuickAccessType } from '../components/opportunities/QuickAccessModal';
import { useAppSelector } from '../store/hooks';

interface JobsPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (message: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
}

export function JobsPage({ onNavigate, onShowToast, currentUser: propUser, onOpenAuth }: JobsPageProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Filter options exactly matching image.png
  const [statusFilters, setStatusFilters] = useState({
    unlocked: false,
    applied: false,
    locked: false
  });

  const [jobTypeFilters, setJobTypeFilters] = useState({
    fullTime: false,
    internship: false,
    partTime: false
  });

  const [locationFilters, setLocationFilters] = useState({
    bangalore: false,
    mumbai: false,
    hyderabad: false,
    remote: false
  });

  const [minMatchScore, setMinMatchScore] = useState<number>(0);

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Opportunity | null>(null);
  const [selectedJobForTracking, setSelectedJobForTracking] = useState<Opportunity | null>(null);
  const [selectedJobForLocked, setSelectedJobForLocked] = useState<Opportunity | null>(null);
  const [quickAccessModalType, setQuickAccessModalType] = useState<QuickAccessType>(null);
  const [externalApplyModal, setExternalApplyModal] = useState<{
    opp: Opportunity;
    platform: 'LinkedIn' | 'Naukri';
  } | null>(null);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return opportunities.filter((job) => {
      // 1. Search text filter
      const matchesSearch =
        !searchQuery.trim() ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.requiredSkills.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Status filter
      const anyStatusActive = statusFilters.unlocked || statusFilters.applied || statusFilters.locked;
      if (anyStatusActive) {
        let statusMatch = false;
        if (statusFilters.unlocked && job.status === 'eligible') statusMatch = true;
        if (statusFilters.applied && job.status === 'applied') statusMatch = true;
        if (statusFilters.locked && job.status === 'locked') statusMatch = true;
        if (!statusMatch) return false;
      }

      // 3. Job Type filter
      const anyTypeActive = jobTypeFilters.fullTime || jobTypeFilters.internship || jobTypeFilters.partTime;
      if (anyTypeActive) {
        let typeMatch = false;
        if (jobTypeFilters.fullTime && job.type === 'Full-time') typeMatch = true;
        if (jobTypeFilters.internship && job.type === 'Internship') typeMatch = true;
        if (jobTypeFilters.partTime && (job.type === 'Contract' || job.type === 'Internship')) typeMatch = true;
        if (!typeMatch) return false;
      }

      // 4. Location filter
      const anyLocationActive =
        locationFilters.bangalore ||
        locationFilters.mumbai ||
        locationFilters.hyderabad ||
        locationFilters.remote;
      if (anyLocationActive) {
        const loc = job.location.toLowerCase();
        let locMatch = false;
        if (locationFilters.bangalore && loc.includes('bangalore')) locMatch = true;
        if (locationFilters.mumbai && loc.includes('mumbai')) locMatch = true;
        if (locationFilters.hyderabad && loc.includes('hyderabad')) locMatch = true;
        if (locationFilters.remote && loc.includes('remote')) locMatch = true;
        if (!locMatch) return false;
      }

      // 5. Minimum Match Score slider
      if (minMatchScore > 0 && job.matchScore < minMatchScore) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, statusFilters, jobTypeFilters, locationFilters, minMatchScore]);

  // Statistics calculation
  const totalCount = opportunities.length;
  const eligibleCount = opportunities.filter((j) => j.status === 'eligible').length;
  const appliedCount = opportunities.filter((j) => j.status === 'applied').length;

  const resetAllFilters = () => {
    setStatusFilters({ unlocked: false, applied: false, locked: false });
    setJobTypeFilters({ fullTime: false, internship: false, partTime: false });
    setLocationFilters({ bangalore: false, mumbai: false, hyderabad: false, remote: false });
    setMinMatchScore(0);
    setSearchQuery('');
  };

  const handleApplyExternal = (opp: Opportunity, platform: 'LinkedIn' | 'Naukri') => {
    setExternalApplyModal({ opp, platform });
  };

  const handleConfirmApplication = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((job) =>
        job.id === oppId
          ? {
              ...job,
              status: 'applied',
              appliedDate: 'Just now',
              applicationStatus: 'Application Submitted'
            }
          : job
      )
    );
    setExternalApplyModal(null);
    if (selectedJobForDetails?.id === oppId) {
      setSelectedJobForDetails(null);
    }
    if (onShowToast) {
      onShowToast('Application submitted successfully with Ingage verified profile!');
    }
  };

  return (
    <div className="w-full bg-[#fbfcfb] text-gray-900 pb-6">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-6">
        {/* Subheader: Back to Dashboard & Title with Stat Counters */}
        <div className="mb-6">
          <button
            id="back-to-dashboard-btn"
            onClick={() => onNavigate('/my-learning')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8DB600] hover:text-[#7aa000] mb-3 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Job Opportunities
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {eligibleCount} positions match your current skills
              </p>
            </div>

            {/* Stat Boxes */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3 shrink-0 w-full sm:w-auto">
              <div
                onClick={resetAllFilters}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-center w-full sm:min-w-[110px] shadow-2xs transition-all cursor-pointer"
              >
                <div className="text-[10px] sm:text-[11px] font-medium text-gray-500 truncate">Total Opportunities</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{totalCount}</div>
              </div>

              <div
                onClick={() =>
                  setStatusFilters((prev) => ({
                    ...prev,
                    unlocked: !prev.unlocked
                  }))
                }
                className={`bg-white border rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-center w-full sm:min-w-[85px] shadow-2xs transition-all cursor-pointer ${
                  statusFilters.unlocked ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="text-[10px] sm:text-[11px] font-medium text-gray-500 truncate">Eligible</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5">{eligibleCount}</div>
              </div>

              <div
                onClick={() =>
                  setStatusFilters((prev) => ({
                    ...prev,
                    applied: !prev.applied
                  }))
                }
                className={`bg-white border rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-center w-full sm:min-w-[85px] shadow-2xs transition-all cursor-pointer ${
                  statusFilters.applied ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-200/80 hover:border-blue-300'
                }`}
              >
                <div className="text-[10px] sm:text-[11px] font-medium text-gray-500 truncate">Applied</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mt-0.5">{appliedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Card: Employers Can Discover You! */}
        <div className="bg-[#f6f3ff] border border-purple-200/90 rounded-2xl p-5 sm:p-6 mb-7 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">
                    Employers Can Discover You!
                  </h2>
                  <span className="bg-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    NEW
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Some opportunities below have an{' '}
                  <span className="font-bold text-purple-700">"Employer Interested"</span> badge.
                  This means employers have discovered your profile based on your progress and
                  skills, and they're interested in connecting with you!
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => {
                  setStatusFilters({
                    unlocked: true,
                    applied: false,
                    locked: false
                  });
                  if (onShowToast) onShowToast('Showing Employer Interested opportunities');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                <span>2 employers interested</span>
              </button>
            </div>
          </div>

          <div className="mt-4 bg-white/95 border border-purple-100 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed shadow-2xs">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-900">How it works:</strong> Companies using Ingage can
              search for role-ready candidates and send connection requests. When you see the badge,
              it means an employer found you through our talent discovery platform and wants to learn
              more about you. Your profile stands out!
            </div>
          </div>
        </div>

        {/* QUICK ACCESS Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-7 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-4">
            QUICK ACCESS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* EMPLOYMENT & APPLICATIONS */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                EMPLOYMENT &amp; APPLICATIONS
              </div>
              <button
                onClick={() => {
                  setStatusFilters({ unlocked: false, applied: true, locked: false });
                  if (onShowToast) onShowToast('Filtered by My Applications');
                }}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
              >
                <Briefcase className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>My Applications</span>
              </button>
            </div>

            {/* EXPOSURE & SKILL BUILDING */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                EXPOSURE &amp; SKILL BUILDING
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setJobTypeFilters((prev) => ({ ...prev, internship: !prev.internship }));
                    if (onShowToast) onShowToast('Filtered by Internships');
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <Award className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Internships</span>
                </button>
                <button
                  onClick={() => setQuickAccessModalType('hackathons')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <Code2 className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span>Hackathons</span>
                </button>
              </div>
            </div>

            {/* STARTUP & ENTREPRENEURSHIP */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                STARTUP &amp; ENTREPRENEURSHIP
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setQuickAccessModalType('mentorship')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <UserCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                  <span>Mentorship</span>
                </button>
                <button
                  onClick={() => setQuickAccessModalType('funding')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                  <span>Funding</span>
                </button>
              </div>
            </div>

            {/* COMMUNITY & NETWORK */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                COMMUNITY &amp; NETWORK
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setQuickAccessModalType('alumni')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span>Alumni Network</span>
                </button>
                <button
                  onClick={() => setQuickAccessModalType('forum')}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
                >
                  <MessageSquare className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span>Discussion Forum</span>
                </button>
              </div>
            </div>

            {/* PLATFORM GUIDANCE */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                PLATFORM GUIDANCE
              </div>
              <button
                onClick={() => setQuickAccessModalType('tips')}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-lime-700 transition-colors text-left cursor-pointer group"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Tips &amp; Tricks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar (Matching image.png) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="job-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company, or location..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="job-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
            className="px-5 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Filter className="w-4 h-4 text-gray-700" />
            <span>Filters</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Filter Options Card (Exactly as shown in image.png) */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 mb-6 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Filter Options</h3>
              {(statusFilters.unlocked ||
                statusFilters.applied ||
                statusFilters.locked ||
                jobTypeFilters.fullTime ||
                jobTypeFilters.internship ||
                jobTypeFilters.partTime ||
                locationFilters.bangalore ||
                locationFilters.mumbai ||
                locationFilters.hyderabad ||
                locationFilters.remote ||
                minMatchScore > 0) && (
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Column 1: Status */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3.5">Status</div>
                <div className="space-y-3">
                  <label
                    onClick={() =>
                      setStatusFilters((prev) => ({ ...prev, unlocked: !prev.unlocked }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {statusFilters.unlocked && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Unlocked
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setStatusFilters((prev) => ({ ...prev, applied: !prev.applied }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {statusFilters.applied && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Applied
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setStatusFilters((prev) => ({ ...prev, locked: !prev.locked }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {statusFilters.locked && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Locked
                    </span>
                  </label>
                </div>
              </div>

              {/* Column 2: Job Type */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3.5">Job Type</div>
                <div className="space-y-3">
                  <label
                    onClick={() =>
                      setJobTypeFilters((prev) => ({ ...prev, fullTime: !prev.fullTime }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {jobTypeFilters.fullTime && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Full-time
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setJobTypeFilters((prev) => ({ ...prev, internship: !prev.internship }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {jobTypeFilters.internship && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Internship
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setJobTypeFilters((prev) => ({ ...prev, partTime: !prev.partTime }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {jobTypeFilters.partTime && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Part-time
                    </span>
                  </label>
                </div>
              </div>

              {/* Column 3: Location */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3.5">Location</div>
                <div className="space-y-3">
                  <label
                    onClick={() =>
                      setLocationFilters((prev) => ({ ...prev, bangalore: !prev.bangalore }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {locationFilters.bangalore && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Bangalore
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setLocationFilters((prev) => ({ ...prev, mumbai: !prev.mumbai }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {locationFilters.mumbai && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Mumbai
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setLocationFilters((prev) => ({ ...prev, hyderabad: !prev.hyderabad }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {locationFilters.hyderabad && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Hyderabad
                    </span>
                  </label>

                  <label
                    onClick={() =>
                      setLocationFilters((prev) => ({ ...prev, remote: !prev.remote }))
                    }
                    className="flex items-center gap-3 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center transition-colors shrink-0 bg-[#374151] hover:bg-[#1f2937]`}
                    >
                      {locationFilters.remote && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 font-normal group-hover:text-gray-900 transition-colors">
                      Remote
                    </span>
                  </label>
                </div>
              </div>

              {/* Column 4: Minimum Match Score */}
              <div>
                <div className="text-sm font-bold text-gray-800 mb-3.5">Minimum Match Score</div>
                <div className="pt-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#8DB600]"
                    style={{
                      background: `linear-gradient(to right, #8DB600 0%, #8DB600 ${minMatchScore}%, #374151 ${minMatchScore}%, #374151 100%)`
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium mt-3">
                    <span>0%</span>
                    <span className="text-[#8DB600] font-bold text-xs">{minMatchScore}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Count & Sort Bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-5 px-1">
          <div>
            Showing <span className="font-bold text-gray-900">{filteredJobs.length}</span> of{' '}
            {totalCount} opportunities
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Sorted by match score</span>
          </div>
        </div>

        {/* Opportunities Cards List */}
        <div className="space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-2xs">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No matching opportunities</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search criteria or resetting the status filters.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-lime-600 text-white text-xs font-bold hover:bg-lime-700 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredJobs.map((opp) => (
              <div
                key={opp.id}
                id={`opportunity-card-${opp.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200"
              >
                {/* Header Row: Title, Employer Interested Badge, Status / Match Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">{opp.title}</h3>

                    {/* Has Info icon next to title (for locked roles) */}
                    {opp.hasInfo && (
                      <button
                        onClick={() => setSelectedJobForLocked(opp)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
                        title="View prerequisite requirements"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}

                    {/* Employer Interested Badge */}
                    {opp.employerInterested && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-purple-700 bg-purple-100/90 border border-purple-200">
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                        <span>Employer Interested</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right Badges */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Applied Badge */}
                    {opp.status === 'applied' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>Applied</span>
                      </span>
                    )}

                    {/* Eligible Badge */}
                    {opp.status === 'eligible' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Eligible</span>
                      </span>
                    )}

                    {/* Locked Badge */}
                    {opp.status === 'locked' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200">
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Locked</span>
                      </span>
                    )}

                    {/* Match Score Badge (shown for eligible or applied) */}
                    {opp.status !== 'locked' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{opp.matchScore}% Match</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Company Name */}
                <div className="text-sm font-semibold text-gray-600 mb-2">{opp.company}</div>

                {/* Location, Type, Salary line */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{opp.location}</span>
                  </span>
                  <span>•</span>
                  <span>{opp.type}</span>
                  <span>•</span>
                  <span className="font-bold text-[#8DB600]">{opp.salary}</span>
                </div>

                {/* Required Skills Section */}
                <div className="mb-5">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Required Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {opp.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          skill.matched
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {skill.matched ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span>{skill.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Box for Applied Opportunities (Card 1) */}
                {opp.status === 'applied' && (
                  <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 mb-5 shadow-2xs">
                    <div className="text-xs text-gray-600 font-medium mb-1.5">
                      Application Status
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700 inline-block shadow-2xs">
                      {opp.applicationStatus || 'Under Review'}
                    </div>
                    {opp.appliedDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Applied on {opp.appliedDate}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="pt-2">
                  {/* Case 1: Applied (View Details + Track Status) */}
                  {opp.status === 'applied' && (
                    <div className="flex items-center gap-3 flex-col sm:flex-row">
                      <button
                        onClick={() => setSelectedJobForDetails(opp)}
                        className="w-full sm:flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setSelectedJobForTracking(opp)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Track Status</span>
                      </button>
                    </div>
                  )}

                  {/* Case 2: Eligible (Apply on LinkedIn + Apply on Naukri + Details) */}
                  {opp.status === 'eligible' && (
                    <div className="flex items-center gap-3 flex-col sm:flex-row">
                      <button
                        onClick={() => handleApplyExternal(opp, 'LinkedIn')}
                        className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Apply on LinkedIn</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApplyExternal(opp, 'Naukri')}
                        className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#FF652F] hover:bg-[#e05020] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Apply on Naukri</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedJobForDetails(opp)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-center"
                      >
                        Details
                      </button>
                    </div>
                  )}

                  {/* Case 3: Locked (Complete Required Skills) */}
                  {opp.status === 'locked' && (
                    <button
                      onClick={() => setSelectedJobForLocked(opp)}
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-150 transition-colors cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span>Complete Required Skills</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      <JobDetailsModal
        opportunity={selectedJobForDetails}
        onClose={() => setSelectedJobForDetails(null)}
        onApplyLinkedIn={(opp) => {
          setSelectedJobForDetails(null);
          handleApplyExternal(opp, 'LinkedIn');
        }}
        onApplyNaukri={(opp) => {
          setSelectedJobForDetails(null);
          handleApplyExternal(opp, 'Naukri');
        }}
        onNavigate={onNavigate}
      />

      {/* Track Status Modal */}
      {selectedJobForTracking && (
        <TrackStatusModal
          opportunity={selectedJobForTracking}
          onClose={() => setSelectedJobForTracking(null)}
        />
      )}

      {/* Locked Skill Modal */}
      <LockedSkillModal
        opportunity={selectedJobForLocked}
        onClose={() => setSelectedJobForLocked(null)}
        onNavigate={onNavigate}
      />

      {/* Quick Access Modals */}
      <QuickAccessModal
        type={quickAccessModalType}
        onClose={() => setQuickAccessModalType(null)}
        onNavigate={onNavigate}
      />

      {/* Apply External Confirmation Modal */}
      {externalApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                    externalApplyModal.platform === 'LinkedIn' ? 'bg-[#0A66C2]' : 'bg-[#FF652F]'
                  }`}
                >
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    Apply via {externalApplyModal.platform}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {externalApplyModal.opp.title} • {externalApplyModal.opp.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExternalApplyModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 mb-6">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="font-bold text-gray-900 text-xs mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ingage Verified Fast-Track Included
                </div>
                <p className="text-[11px] text-gray-500">
                  Your validated skill badge, quiz percentile (85%), and verified GitHub capstone project will be automatically attached to your recruiter profile.
                </p>
              </div>

              <div className="text-gray-500">
                Would you like to submit your verified application directly and record it on your Ingage Dashboard?
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setExternalApplyModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmApplication(externalApplyModal.opp.id)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                  externalApplyModal.platform === 'LinkedIn'
                    ? 'bg-[#0A66C2] hover:bg-[#084e96]'
                    : 'bg-[#FF652F] hover:bg-[#e05020]'
                }`}
              >
                <span>Submit &amp; Mark as Applied</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobsPage;
