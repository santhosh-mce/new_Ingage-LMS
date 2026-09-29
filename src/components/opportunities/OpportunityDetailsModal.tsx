"use client";
import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  Laptop,
  CheckCircle2,
  Sparkles,
  Calendar,
  DollarSign,
  Bookmark,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { OpportunityItem, ApplicationItem } from '../../api/opportunityApi';

interface OpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: OpportunityItem | null;
  application?: ApplicationItem;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onApply: (opportunity: OpportunityItem) => void;
  isApplying?: boolean;
}

export const OpportunityDetailsModal: React.FC<OpportunityDetailsModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  application,
  isSaved,
  onToggleSave,
  onApply,
  isApplying = false,
}) => {
  if (!isOpen || !opportunity) return null;

  const isApplied = Boolean(application);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
            {opportunity.companyLogo ? (
              <img
                src={opportunity.companyLogo}
                alt={opportunity.company}
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-200">
                  {opportunity.type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200/80 text-gray-700">
                  {opportunity.workMode}
                </span>
                {opportunity.matchScore && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-50 text-lime-800 border border-lime-200">
                    <Sparkles className="w-3 h-3 text-[#8DB600]" />
                    <span>{opportunity.matchScore}% Match</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {opportunity.title}
              </h2>
              <p className="text-sm font-medium text-gray-600">
                {opportunity.company} • {opportunity.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(opportunity.id)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-lime-50 border-lime-200 text-[#8DB600]'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
              }`}
              title={isSaved ? 'Saved' : 'Save opportunity'}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 divide-y divide-gray-100 text-sm text-gray-700">
          {/* Key Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Compensation
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{opportunity.salary}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Experience
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{opportunity.experienceLevel}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Location Mode
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{opportunity.workMode}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Application Deadline
              </span>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{opportunity.deadline || 'Open'}</p>
            </div>
          </div>

          {/* Application Status Banner (if applied) */}
          {isApplied && application && (
            <div className="pt-6">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">Application Submitted</h4>
                    <p className="text-xs text-emerald-700">
                      You applied on {application.appliedAt} • Current Status:{' '}
                      <span className="font-bold underline">{application.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Company */}
          <div className="space-y-3 pt-6">
            <h3 className="text-base font-bold text-gray-900">About {opportunity.company}</h3>
            <p className="text-gray-600 leading-relaxed">{opportunity.aboutCompany}</p>
          </div>

          {/* Role Description */}
          <div className="space-y-3 pt-6">
            <h3 className="text-base font-bold text-gray-900">Opportunity Overview</h3>
            <p className="text-gray-600 leading-relaxed">{opportunity.description}</p>
          </div>

          {/* Key Responsibilities */}
          {opportunity.responsibilities && opportunity.responsibilities.length > 0 && (
            <div className="space-y-3 pt-6">
              <h3 className="text-base font-bold text-gray-900">Responsibilities</h3>
              <ul className="space-y-2.5">
                {opportunity.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8DB600] mt-2 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Qualifications */}
          {opportunity.qualifications && opportunity.qualifications.length > 0 && (
            <div className="space-y-3 pt-6">
              <h3 className="text-base font-bold text-gray-900">Requirements & Qualifications</h3>
              <ul className="space-y-2.5">
                {opportunity.qualifications.map((qual, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span>{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required Skills */}
          {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
            <div className="space-y-3 pt-6">
              <h3 className="text-base font-bold text-gray-900">Skills Needed</h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.requiredSkills.map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${
                      s.matched
                        ? 'bg-lime-50 text-lime-900 border-lime-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {s.matched && <CheckCircle2 className="w-3.5 h-3.5 text-[#8DB600]" />}
                    <span>{s.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits & Perks */}
          {opportunity.benefits && opportunity.benefits.length > 0 && (
            <div className="space-y-3 pt-6">
              <h3 className="text-base font-bold text-gray-900">Benefits & Perks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {opportunity.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5 text-xs font-medium text-gray-800"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#8DB600] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500 hidden sm:block">
            Verified Ingage Career Partner Opportunity
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>

            {isApplied ? (
              <button
                disabled
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-default"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted</span>
              </button>
            ) : (
              <button
                onClick={() => onApply(opportunity)}
                disabled={isApplying}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isApplying ? 'Submitting Application...' : 'Apply Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
