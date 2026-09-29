"use client";
import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Briefcase,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchOpportunitiesThunk,
  fetchOpportunityStatsThunk,
  fetchMyApplicationsThunk,
  fetchSavedOpportunitiesThunk,
  applyToOpportunityThunk,
  toggleSaveOpportunityThunk,
  setActiveTab,
  setSelectedType,
  setWorkModeFilter,
  setSearchQuery,
  clearFilters,
} from '../store/slices/opportunitySlice';
import { OpportunityItem, OpportunityType, WorkMode } from '../api/opportunityApi';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { OpportunityDetailsModal } from '../components/opportunities/OpportunityDetailsModal';
import { UserProfile } from '../types';

interface OpportunitiesPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  onNavigate,
  onShowToast,
  currentUser: propUser,
  onOpenAuth,
}) => {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const {
    opportunities,
    applications,
    savedIds,
    availableCount,
    appliedCount,
    savedCount,
    partnersCount,
    activeTab,
    selectedType,
    workModeFilter,
    searchQuery,
    loading,
    error,
    applyingId,
  } = useAppSelector((state) => state.opportunity);

  const [selectedOppForDetails, setSelectedOppForDetails] = useState<OpportunityItem | null>(null);

  // Load opportunities & stats on mount
  useEffect(() => {
    dispatch(fetchOpportunitiesThunk());
    dispatch(fetchOpportunityStatsThunk());
  }, [dispatch]);

  // Load user-specific applications & saved bookmarks when authenticated
  useEffect(() => {
    if (currentUser) {
      dispatch(fetchMyApplicationsThunk());
      dispatch(fetchSavedOpportunitiesThunk());
      dispatch(fetchOpportunityStatsThunk());
    }
  }, [dispatch, currentUser]);

  // Compute filtered opportunities based on search, type, work mode, and current tab
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      // 1. Tab check
      if (activeTab === 'saved' && !savedIds.includes(String(item.id))) {
        return false;
      }
      if (activeTab === 'my-applications') {
        const isApplied = applications.some((app) => String(app.opportunityId) === String(item.id));
        if (!isApplied) return false;
      }

      // 2. Type filter
      if (selectedType !== 'all' && item.type?.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // 3. Work mode filter
      if (workModeFilter !== 'all' && item.workMode?.toLowerCase() !== workModeFilter.toLowerCase()) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCompany = item.company?.toLowerCase().includes(query);
        const matchesLocation = item.location?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        const matchesSkill = item.requiredSkills?.some((s) => s.name?.toLowerCase().includes(query));

        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesCategory && !matchesSkill) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, activeTab, savedIds, applications, selectedType, workModeFilter, searchQuery]);

  // Handle Apply flow
  const handleApply = async (opp: OpportunityItem) => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth('login', '/opportunities');
      } else {
        onNavigate('/login');
      }
      return;
    }

    // Check if already applied
    const alreadyApplied = applications.some((a) => String(a.opportunityId) === String(opp.id));
    if (alreadyApplied) {
      if (onShowToast) {
        onShowToast('You have already applied for this opportunity.', 'info');
      }
      return;
    }

    try {
      await dispatch(applyToOpportunityThunk({ opportunityId: opp.id })).unwrap();
      if (onShowToast) {
        onShowToast(`Successfully applied to ${opp.title} at ${opp.company}!`, 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err || 'Failed to submit application. Please try again.', 'error');
      }
    }
  };

  const handleToggleSave = async (id: string) => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth('login', '/opportunities');
      } else {
        onNavigate('/login');
      }
      return;
    }

    try {
      const res = await dispatch(toggleSaveOpportunityThunk(id)).unwrap();
      if (onShowToast) {
        onShowToast(
          res.saved ? 'Saved to your bookmarks.' : 'Removed from saved opportunities.',
          'info'
        );
      }
    } catch {
      if (onShowToast) {
        onShowToast('Failed to update bookmark.', 'error');
      }
    }
  };

  const opportunityTypes: { label: string; value: 'all' | OpportunityType }[] = [
    { label: 'All Opportunities', value: 'all' },
    { label: 'Jobs', value: 'Job' },
    { label: 'Internships', value: 'Internship' },
    { label: 'Freelance', value: 'Freelance' },
    { label: 'Apprenticeships', value: 'Apprenticeship' },
  ];

  const displayAvailableCount = availableCount || opportunities.length;
  const displayAppliedCount = currentUser ? (appliedCount || applications.length) : 0;
  const displaySavedCount = currentUser ? (savedCount || savedIds.length) : 0;
  const displayPartnersCount = partnersCount > 0 ? `${partnersCount}+` : `${new Set(opportunities.map(o => o.company)).size}+`;

  return (
    <div className="w-full bg-[#f8fafc] min-h-[calc(100vh-4.5rem)] pb-20">
      {/* 1. Header Banner */}
      <div className="bg-white border-b border-gray-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-900 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#8DB600]" />
                <span>Career Hub &amp; Job Board</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-950 tracking-tight">
                Opportunities
              </h1>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl">
                Discover jobs, internships and career opportunities to grow your career.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Available</span>
                <p className="text-xl font-bold text-gray-900">{displayAvailableCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Applied</span>
                <p className="text-xl font-bold text-lime-700">{displayAppliedCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Saved</span>
                <p className="text-xl font-bold text-gray-900">{displaySavedCount}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs font-medium text-gray-400 uppercase">Partners</span>
                <p className="text-xl font-bold text-gray-900">{displayPartnersCount}</p>
              </div>
            </div>
          </div>

          {/* Tab Selection Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-100 pt-2">
            <button
              onClick={() => dispatch(setActiveTab('all'))}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#8DB600] text-gray-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Explore All ({opportunities.length})
            </button>

            <button
              onClick={() => dispatch(setActiveTab('my-applications'))}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'my-applications'
                  ? 'border-[#8DB600] text-gray-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>My Applications</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-lime-100 text-lime-900 font-semibold">
                {displayAppliedCount}
              </span>
            </button>

            <button
              onClick={() => dispatch(setActiveTab('saved'))}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'saved'
                  ? 'border-[#8DB600] text-gray-950 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Saved Opportunities</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-semibold">
                {displaySavedCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                placeholder="Search by role, company, skills (e.g. React, SQL, Python), or location..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => dispatch(setSearchQuery(''))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Work Mode Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={workModeFilter}
                onChange={(e) => dispatch(setWorkModeFilter(e.target.value as any))}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8DB600] cursor-pointer"
              >
                <option value="all">All Work Modes</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>

              {(searchQuery || selectedType !== 'all' || workModeFilter !== 'all') && (
                <button
                  onClick={() => dispatch(clearFilters())}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {opportunityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => dispatch(setSelectedType(type.value))}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === type.value
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main Content Display */}
        {/* Loading Skeletons */}
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
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-600" />
            <h3 className="font-bold text-gray-900">Failed to Load Opportunities</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={() => {
                dispatch(fetchOpportunitiesThunk());
                dispatch(fetchOpportunityStatsThunk());
              }}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOpportunities.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No opportunities match your criteria</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              {activeTab === 'my-applications'
                ? 'You have not submitted any applications yet. Browse explore opportunities to apply.'
                : activeTab === 'saved'
                ? 'You have not saved any opportunities yet. Click the bookmark icon on any role to keep track of it.'
                : 'Try adjusting your search query, switching type filters, or clearing work mode constraints.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              {activeTab !== 'all' ? (
                <button
                  onClick={() => dispatch(setActiveTab('all'))}
                  className="px-5 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Explore All Opportunities
                </button>
              ) : (
                <button
                  onClick={() => dispatch(clearFilters())}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && filteredOpportunities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
              const application = applications.find((a) => String(a.opportunityId) === String(opp.id));
              const isSaved = savedIds.includes(String(opp.id));
              const isApplying = applyingId === String(opp.id);

              return (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  application={application}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                  onViewDetails={(item) => setSelectedOppForDetails(item)}
                  onApply={handleApply}
                  isApplying={isApplying}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Details Modal */}
      <OpportunityDetailsModal
        isOpen={Boolean(selectedOppForDetails)}
        onClose={() => setSelectedOppForDetails(null)}
        opportunity={selectedOppForDetails}
        application={
          selectedOppForDetails
            ? applications.find((a) => String(a.opportunityId) === String(selectedOppForDetails.id))
            : undefined
        }
        isSaved={selectedOppForDetails ? savedIds.includes(String(selectedOppForDetails.id)) : false}
        onToggleSave={handleToggleSave}
        onApply={handleApply}
        isApplying={selectedOppForDetails ? applyingId === String(selectedOppForDetails.id) : false}
      />
    </div>
  );
};

export default OpportunitiesPage;
