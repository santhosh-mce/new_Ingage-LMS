"use client";
import React from 'react';
import {
  MapPin,
  Briefcase,
  Bookmark,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { OpportunityItem, ApplicationItem } from '../../api/opportunityApi';

interface OpportunityCardProps {
  opportunity: OpportunityItem;
  application?: ApplicationItem;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onViewDetails: (opportunity: OpportunityItem) => void;
  onApply: (opportunity: OpportunityItem) => void;
  isApplying?: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  application,
  isSaved,
  onToggleSave,
  onViewDetails,
  onApply,
  isApplying = false,
}) => {
  const isApplied = Boolean(application);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Job':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Internship':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Freelance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Apprenticeship':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    if (!application) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>{application.status}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      {/* Top Section */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header: Logo, Company & Save button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {opportunity.companyLogo ? (
              <img
                src={opportunity.companyLogo}
                alt={opportunity.company}
                className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-2xs shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-1 group-hover:text-lime-700 transition-colors">
                {opportunity.title}
              </h3>
              <p className="text-xs sm:text-sm font-normal text-gray-500 line-clamp-1">
                {opportunity.company}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleSave(opportunity.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isSaved
                ? 'bg-lime-50 border-lime-200 text-[#8DB600]'
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges Bar: Type, Work Mode, Status */}
        <div className="flex items-center flex-wrap gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeBadgeColor(
              opportunity.type
            )}`}
          >
            {opportunity.type}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Laptop className="w-3 h-3 text-gray-400" />
            <span>{opportunity.workMode}</span>
          </span>
          {getStatusBadge()}
          {opportunity.matchScore && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-50 text-lime-800 border border-lime-200 ml-auto">
              <Sparkles className="w-3 h-3 text-[#8DB600]" />
              <span>{opportunity.matchScore}% Match</span>
            </span>
          )}
        </div>

        {/* Location & Compensation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-[13px] text-gray-600 pt-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800 truncate">{opportunity.salary}</span>
          </div>
        </div>

        {/* Snippet Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {opportunity.description}
        </p>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {opportunity.requiredSkills.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                skill.matched
                  ? 'bg-lime-50 text-lime-800 border-lime-200 font-semibold'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {skill.name}
            </span>
          ))}
          {opportunity.requiredSkills.length > 3 && (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
              +{opportunity.requiredSkills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="px-5 py-3.5 sm:px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{opportunity.postedDate || 'Active'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(opportunity)}
            className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            Details
          </button>

          {isApplied ? (
            <button
              onClick={() => onViewDetails(opportunity)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Applied</span>
            </button>
          ) : (
            <button
              onClick={() => onApply(opportunity)}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isApplying ? 'Applying...' : 'Apply Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
