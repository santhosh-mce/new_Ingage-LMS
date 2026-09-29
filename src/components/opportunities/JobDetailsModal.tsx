"use client";
import React from 'react';
import {
  X,
  Building,
  MapPin,
  Briefcase,
  TrendingUp,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Opportunity } from '../../data/opportunitiesData';

interface JobDetailsModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onApplyLinkedIn: (opp: Opportunity) => void;
  onApplyNaukri: (opp: Opportunity) => void;
  onNavigate: (path: string) => void;
}

export function JobDetailsModal({
  opportunity,
  onClose,
  onApplyLinkedIn,
  onApplyNaukri,
  onNavigate
}: JobDetailsModalProps) {
  if (!opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {opportunity.type}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-bold text-lime-700 bg-lime-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {opportunity.matchScore}% Match
              </span>
              {opportunity.employerInterested && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Employer Interested
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
              <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-gray-400" />
                {opportunity.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {opportunity.location}
              </span>
              <span>•</span>
              <span className="font-bold text-lime-600 flex items-center gap-1">
                {opportunity.salary}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-gray-700">
          {/* About Role */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">
              Role Overview
            </h3>
            <p className="leading-relaxed text-gray-700">{opportunity.description}</p>
          </div>

          {/* About Company */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              About {opportunity.company}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">{opportunity.aboutCompany}</p>
          </div>

          {/* Required Skills & Ingage Match */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2.5">
              Required Skills &amp; Profile Match
            </h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.requiredSkills.map((s, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    s.matched
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {s.matched ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  {s.name}
                  <span className="text-[10px] font-normal text-gray-500">
                    {s.matched ? '(Verified)' : '(Need Practice)'}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          {opportunity.responsibilities?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">
                Key Responsibilities
              </h3>
              <ul className="space-y-2">
                {opportunity.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600 shrink-0 mt-2" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits & Perks */}
          {opportunity.benefits?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">
                Perks &amp; Benefits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {opportunity.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/50 border border-lime-100 text-xs text-lime-900 font-medium"
                  >
                    <Award className="w-4 h-4 text-lime-600 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              onClick={() => onApplyLinkedIn(opportunity)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>Apply on LinkedIn</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => onApplyNaukri(opportunity)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#FF652F] hover:bg-[#e05220] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>Apply on Naukri</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
