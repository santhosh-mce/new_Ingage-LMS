"use client";
import React, { useState, useEffect } from 'react';
import { verifyPublicCertificate, getCertificateDownloadUrl } from '../api/adminApi';
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  User,
  BookOpen,
  Hash,
  ShieldCheck,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

export interface CertificateVerificationPageProps {
  code?: string;
  onNavigate: (path: string) => void;
}

export const CertificateVerificationPage: React.FC<CertificateVerificationPageProps> = ({
  code: propCode,
  onNavigate,
}) => {
  const [verificationCode, setVerificationCode] = useState<string>(() => {
    if (propCode) return propCode;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = path.match(/\/certificate\/verify\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : '';
  });

  const [inputCode, setInputCode] = useState(verificationCode);
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!verificationCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    verifyPublicCertificate(verificationCode)
      .then((data) => {
        setCertData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Certificate not found or verification code is invalid.');
        setCertData(null);
        setLoading(false);
      });
  }, [verificationCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setVerificationCode(inputCode.trim());
      try {
        window.history.pushState({}, '', `/certificate/verify/${inputCode.trim()}`);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 selection:bg-lime-400 selection:text-slate-950">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Ingage LMS</span>
          </button>

          <span className="flex items-center gap-1.5 text-xs text-lime-400 font-medium bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official Credential Verification
          </span>
        </div>

        {/* Verification Card Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto text-lime-400 shadow-lg shadow-lime-500/10">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Certificate Verification System
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Verify the authenticity and completion status of certificates issued by the Ingage Learning Platform.
          </p>

          {/* Quick verification input bar */}
          <form onSubmit={handleSearch} className="pt-2 max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2026-000001) or Code"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-lime-500/20 cursor-pointer"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto"></div>
            <div className="h-4 w-48 bg-slate-800 rounded mx-auto"></div>
            <div className="h-3 w-64 bg-slate-800 rounded mx-auto"></div>
          </div>
        ) : certData ? (
          <div className="bg-slate-900 border-2 border-lime-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                    Certificate Valid & Authentic
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Verified Credential
                  </h3>
                </div>
              </div>

              {/* Download PDF button */}
              <a
                href={getCertificateDownloadUrl(certData.verificationCode, true)}
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-lime-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-lime-400" />
                  Student Name
                </span>
                <p className="text-base font-bold text-white">
                  {certData.studentName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-lime-400" />
                  Course Completed
                </span>
                <p className="text-base font-bold text-white">
                  {certData.courseName}
                </p>
                <p className="text-xs text-slate-400">
                  {certData.courseCategory}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-lime-400" />
                  Issue Date
                </span>
                <p className="text-sm font-semibold text-slate-200">
                  {new Date(certData.issueDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-lime-400" />
                  Certificate Number
                </span>
                <p className="text-sm font-mono font-bold text-lime-400">
                  {certData.certificateNumber}
                </p>
              </div>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                <span className="text-slate-400">Cryptographic Verification Code:</span>{' '}
                <span className="font-mono text-slate-200 font-bold tracking-wider">{certData.verificationCode}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-lime-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Immutable PostgreSQL Record
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Certificate Verification Failed</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
