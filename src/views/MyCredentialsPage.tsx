"use client";
import React, { useState, useEffect } from 'react';
import {
  Award,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Share2,
  FileCheck,
  Search,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { getMyCredentials, UserCredentialDto } from '../api/credentialApi';
import { useAppSelector } from '../store/hooks';
import { UserProfile } from '../types';

interface MyCredentialsPageProps {
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onShowToast?: (message: string) => void;
}

export function MyCredentialsPage({
  onNavigate,
  currentUser: propUser,
  onOpenAuth,
  onShowToast
}: MyCredentialsPageProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const [credentials, setCredentials] = useState<UserCredentialDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (currentUser) {
      fetchCredentials();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCredentials();
      setCredentials(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (cred: UserCredentialDto) => {
    const text = `I'm progressing towards my ${cred.credentialName} on InGage LMS!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (onShowToast) onShowToast('Credential text copied to clipboard!');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREDENTIAL_EARNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Credential Earned</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Course Completed</span>
          </span>
        );
      case 'CREDENTIAL_PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Credential Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-lime-50 text-lime-800 border border-lime-200">
            <Clock className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </span>
        );
    }
  };

  const filteredCredentials = credentials.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.courseTitle.toLowerCase().includes(q) ||
        c.credentialName.toLowerCase().includes(q) ||
        (c.credentialId && c.credentialId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-20 px-4 text-center max-w-md mx-auto">
        <Award className="w-14 h-14 text-lime-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Credentials</h2>
        <p className="text-sm text-gray-600 mb-6">
          Please sign in to view your enrolled courses, certificates, and professional credentials.
        </p>
        <button
          onClick={() => onOpenAuth && onOpenAuth('login')}
          className="px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 pb-20 font-sans">
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 py-8 sm:py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => onNavigate('/credential-edge')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-lime-700 transition-colors cursor-pointer mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Credential Edge</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100/70 text-lime-800 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                <span>Verified Credentials Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                My Credentials
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Your completed courses and professional credentials
              </p>
            </div>

            <button
              onClick={() => onNavigate('/credential-edge')}
              className="px-5 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore More Courses</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-8 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search credentials or courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-lime-500 bg-gray-50/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'IN_PROGRESS', 'CREDENTIAL_EARNED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-lime-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Cards List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse h-28" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <p className="text-red-700 text-sm font-medium mb-3">{error}</p>
            <button
              onClick={fetchCredentials}
              className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto shadow-2xs">
            <Award className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">No Credentials Yet</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              You haven't enrolled in or completed any Google Certified Courses yet. Explore the catalog to start earning your credentials.
            </p>
            <button
              onClick={() => onNavigate('/credential-edge')}
              className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Explore Credential Edge
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredCredentials.map((cred) => {
              const isEarned = cred.status === 'CREDENTIAL_EARNED' || cred.status === 'COMPLETED';

              return (
                <div
                  key={cred.enrollmentId}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-lime-300 p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(cred.status)}
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-semibold">
                        {cred.category}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Provider: <strong>{cred.provider || 'Google'}</strong>
                      </span>
                    </div>

                    <h3
                      onClick={() => onNavigate(`/credential-edge/${cred.courseSlug}`)}
                      className="text-base sm:text-lg font-semibold text-gray-900 hover:text-lime-700 transition-colors cursor-pointer"
                    >
                      {cred.courseTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>{cred.credentialName}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="max-w-md pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="text-lime-700 font-bold">{cred.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-lime-500 h-2 rounded-full transition-all"
                          style={{ width: `${cred.progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {cred.completedModulesCount} of {cred.totalModulesCount || 6} modules completed
                      </div>
                    </div>

                    {cred.credentialId && (
                      <div className="text-xs text-gray-400 font-mono">
                        Credential ID: <span className="text-gray-700 font-medium">{cred.credentialId}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 md:min-w-44">
                    <button
                      onClick={() => onNavigate(`/credential-edge/${cred.courseSlug}`)}
                      className="px-4 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>{isEarned ? 'View Details' : 'Continue Learning'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleShare(cred)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Progress</span>
                    </button>

                    {cred.credentialUrl && (
                      <a
                        href={cred.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <span>Official Credential Info</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCredentialsPage;
