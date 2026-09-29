"use client";
import React from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Building,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { Opportunity } from '../../data/opportunitiesData';

interface TrackStatusModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function TrackStatusModal({ opportunity, onClose }: TrackStatusModalProps) {
  const timeline = [
    {
      title: 'Application Submitted',
      date: 'Jan 25, 2025 • 10:30 AM',
      description: `Your application along with verified Ingage milestones and project portfolio was transmitted to ${opportunity.company}.`,
      status: 'completed'
    },
    {
      title: 'Ingage Credential Verification',
      date: 'Jan 26, 2025 • 02:15 PM',
      description: 'Ingage LMS verified your SQL, Excel, and Python module certifications with an 85% role match score.',
      status: 'completed'
    },
    {
      title: 'Under Review by Hiring Team',
      date: 'Active since Jan 28, 2025',
      description: 'Lead Talent Recruiter (Shweta Sharma) is evaluating candidate shortlists for the Summer 2025 Intern batch.',
      status: 'current'
    },
    {
      title: 'Technical Screen & Coding Task',
      date: 'Expected within 3-5 business days',
      description: 'Candidates moving forward will receive an invitation for an automated 45-minute SQL data challenge.',
      status: 'upcoming'
    },
    {
      title: 'Hiring Manager Discussion',
      date: 'Pending Screening Outcome',
      description: 'Final 30-minute culture and project walk-through with the Analytics Director.',
      status: 'upcoming'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-blue-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Application Status: Under Review
              </span>
              <span className="text-xs text-gray-500 font-mono">ID: ING-84920</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <span className="font-semibold text-gray-800">{opportunity.company}</span>
              <span>•</span>
              <span>{opportunity.location}</span>
              <span>•</span>
              <span className="text-lime-600 font-bold">{opportunity.salary}</span>
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {/* Status Alert Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Application is currently Under Review</div>
              <div className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Applied on <strong>Jan 25, 2025</strong>. Employers typically respond within 5-7 business days. You will receive an email and notification here as soon as there is an update.
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-4">
              Recruitment Progress Timeline
            </h3>
            <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step Bullet */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : step.status === 'current'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${step.status === 'current' ? 'bg-white' : 'bg-gray-400'}`} />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="ml-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold ${
                          step.status === 'current'
                            ? 'text-blue-600'
                            : step.status === 'completed'
                            ? 'text-gray-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {step.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submitted Documents & Profile */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">
              Included Application Packet
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">Resume_DataAnalyst.pdf</div>
                    <div className="text-[10px] text-gray-400">Validated 2 pages • 1.2 MB</div>
                  </div>
                </div>
                <button className="text-lime-700 hover:text-lime-800 p-1.5 hover:bg-lime-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-gray-800">Ingage Verified Transcript</div>
                    <div className="text-[10px] text-gray-400">Score: 85% • 3 Modules</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Need help? Contact <span className="font-semibold text-gray-700">careers@datacorp.io</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
