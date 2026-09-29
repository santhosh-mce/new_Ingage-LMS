"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { getBadgeDetails, SkillBadgeDto } from '../../api/credentialApi';
import { UserProfile } from '../../types';

interface SkillBadgePageProps {
  courseSlug: string;
  badgeId: string;
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string) => void;
}

export function SkillBadgePage({
  courseSlug,
  badgeId,
  onNavigate,
  currentUser,
  onShowToast
}: SkillBadgePageProps) {
  const [badge, setBadge] = useState<SkillBadgeDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchBadge();
  }, [courseSlug, badgeId]);

  const fetchBadge = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBadgeDetails(courseSlug, badgeId);
      setBadge(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Skill badge not found or not yet earned.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (onShowToast) onShowToast('Credential link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${badge?.badgeName || 'InGage Skill Badge'} - InGage LMS`,
        text: `I just earned the ${badge?.badgeName} Skill Badge in Google Generative AI on InGage LMS!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-20 px-4 max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-80 bg-gray-200 rounded-3xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-24 px-4 max-w-md mx-auto text-center">
        <Award className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Skill Badge Not Found</h2>
        <p className="text-xs text-gray-500 mb-6">{error || 'This badge has not been issued to your account yet.'}</p>
        <button
          onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
          className="px-5 py-2.5 bg-lime-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-lime-700 transition-colors"
        >
          Back to Course Curriculum
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 pb-24 font-sans">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-lime-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {badge.courseTitle || 'Google Generative AI'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* Professional Credential Badge Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden text-center relative p-8 sm:p-10">
          {/* Decorative Corner Seals */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-lime-200/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-radial from-emerald-200/40 to-transparent pointer-events-none" />

          {/* Header tag */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-lime-100 text-lime-800 text-[11px] font-black uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-lime-700" />
            <span>InGage Verified Skill Badge</span>
          </div>

          {/* Badge Emblem */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-lime-600 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg border-4 border-lime-100">
              <Award className="w-14 h-14" />
            </div>
            <div className="absolute -bottom-2 -right-1 bg-amber-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border-2 border-white shadow-xs">
              W0{badge.weekNumber}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
            {badge.badgeName}
          </h1>

          <p className="text-xs text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            {badge.badgeDescription ||
              'Demonstrated foundational proficiency and practical competence in Generative AI architectures, prompt patterns, and safety mechanisms.'}
          </p>

          {/* Official Badge Metadata Details */}
          <div className="bg-[#fafaf9] rounded-2xl border border-gray-200/90 p-5 text-left text-xs space-y-3.5 mb-8">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Awarded to:</span>
              <span className="font-bold text-gray-900 text-sm">
                {badge.studentName || currentUser?.name || 'Verified Learner'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Course:</span>
              <span className="font-semibold text-gray-800">{badge.courseTitle}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Module:</span>
              <span className="font-medium text-gray-800">{badge.moduleTitle}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Curriculum Week:</span>
              <span className="font-bold text-lime-800">Week {badge.weekNumber}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Completed Date:</span>
              <span className="font-medium text-gray-800">{badge.earnedAt}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Badge ID:</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {badge.badgeId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Verification Code:</span>
              <span className="font-mono text-gray-600">{badge.verificationCode}</span>
            </div>
          </div>

          {/* Verification footer seal */}
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-800 font-semibold mb-8">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified InGage Credential Record</span>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate(`/credential-edge/${courseSlug}`)}
              className="py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Course</span>
            </button>

            <button
              onClick={() => {
                // If there is another week, navigate to it; else course overview
                if (badge.weekNumber < 8) {
                  onNavigate(`/credential-edge/${courseSlug}`);
                } else {
                  onNavigate(`/credential-edge/${courseSlug}`);
                }
              }}
              className="py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Continue Learning</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
