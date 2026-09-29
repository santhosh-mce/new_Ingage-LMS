"use client";
import React, { useState, useEffect } from 'react';
import {
  Award,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { UserCredentialDto, getMyCredentials } from '../../api/credentialApi';

interface CredentialEdgeProfileSectionProps {
  onNavigate: (path: string) => void;
}

export const CredentialEdgeProfileSection: React.FC<CredentialEdgeProfileSectionProps> = ({
  onNavigate,
}) => {
  const [credentials, setCredentials] = useState<UserCredentialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getMyCredentials()
      .then((data) => {
        if (mounted) {
          setCredentials(data || []);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch user credentials:', err);
        if (mounted) {
          setError('Could not load credential courses. Please try again.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREDENTIAL_EARNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Credential Earned
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
            Course Completed
          </span>
        );
      case 'CREDENTIAL_PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Credential Pending
          </span>
        );
      case 'IN_PROGRESS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-100 text-lime-800 border border-lime-200">
            <Clock className="w-3.5 h-3.5 text-[#8DB600]" />
            In Progress
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Credential Edge — My Professional Credentials
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Recognised career certifications and professional courses from Google and industry leaders
          </p>
        </div>

        <button
          onClick={() => onNavigate('/credential-edge')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs sm:text-sm transition-colors border border-lime-200 cursor-pointer"
        >
          <span>Explore Google Courses</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Compliance / Credential Distinction Notice */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 mb-6 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Credential Verification Notice: </strong>
          InGage provides coursework and course completion certificates. Official Google Professional Certificates are issued directly through Google's authorised certification programmes upon syllabus completion and verification.
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8DB600] mb-2" />
          <p className="text-xs">Loading your credentials...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
          {error}
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No credentials enrolled yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Strengthen your career profile with industry-recognised Google Professional Certificates in Data Analytics, Cybersecurity, Cloud, and more.
          </p>
          <button
            onClick={() => onNavigate('/credential-edge')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <span>Explore Credential Edge</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {credentials.map((cred) => {
            const isEarned = cred.status === 'CREDENTIAL_EARNED';
            const progress = cred.progressPercentage ?? 0;

            return (
              <div
                key={cred.enrollmentId}
                className="p-5 rounded-2xl bg-gray-50/70 hover:bg-white border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                        {cred.provider || 'Google'}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {cred.category}
                      </span>
                    </div>
                    {getStatusBadge(cred.status)}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-800 transition-colors">
                    {cred.courseTitle}
                  </h3>

                  <div className="text-xs font-medium text-gray-600 mt-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{cred.credentialName || 'Professional Certificate'}</span>
                  </div>

                  {/* Credential ID if available */}
                  {cred.credentialId && (
                    <div className="mt-2 text-[11px] font-mono bg-white px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 select-all">
                      ID: {cred.credentialId}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-4 mb-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                      <span>Course Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-[#8DB600] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 flex items-center justify-between">
                    <span>{cred.completedModulesCount} of {cred.totalModulesCount} modules completed</span>
                    {cred.completedAt && (
                      <span>Completed {new Date(cred.completedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 mt-4">
                  <div className="text-[11px] text-gray-500 font-medium">
                    {isEarned ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Credential
                      </span>
                    ) : (
                      <span>InGage Verified Training</span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate(`/credential-courses/${cred.courseSlug}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{isEarned ? 'View Credential' : 'Continue Course'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
