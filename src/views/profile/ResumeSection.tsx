"use client";
import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Calendar,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  ShieldCheck,
  Pencil
} from 'lucide-react';
import { ResumeDto, uploadResume, deleteResume } from '../../api/profileApi';

interface ResumeSectionProps {
  resume: ResumeDto | null;
  onRefresh: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  resume,
  onRefresh,
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasResume = resume && resume.url && resume.filename;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be reselected if needed
    e.target.value = '';

    // Validate type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF format (.pdf) is supported.');
      if (onShowToast) onShowToast('Only PDF files are allowed.', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB limit. Please compress your PDF.');
      if (onShowToast) onShowToast('File size must be under 5 MB.', 'error');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const res = await uploadResume(file);
      if (onShowToast) onShowToast(res.message || 'Resume uploaded successfully!', 'success');
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to upload resume.';
      setErrorMessage(msg);
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your resume?')) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      await deleteResume();
      if (onShowToast) onShowToast('Resume removed.', 'info');
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to delete resume.';
      setErrorMessage(msg);
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#8DB600]" />
            Career Resume / CV
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Upload your latest PDF resume to share with recruitment partners and apply for jobs
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              id="upload-resume-btn"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs disabled:opacity-50"
              title="Edit / Replace Resume"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{hasResume ? 'Edit / Replace' : 'Upload'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {hasResume ? (
        <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-xs shrink-0">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 break-all">
                  {resume.filename}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  Active Resume
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                <span className="font-semibold text-gray-600">
                  PDF Document
                </span>
                <span>•</span>
                <span>
                  {resume.formattedFileSize || (resume.fileSize ? `${Math.round(resume.fileSize / 1024)} KB` : 'PDF')}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Uploaded on {formatDate(resume.uploadedAt)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified for partner applications</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            {resume.url && (
              <a
                href={resume.url}
                target="_blank"
                rel="noreferrer"
                download={resume.filename || 'resume.pdf'}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-[#8DB600]" />
                <span>Download</span>
              </a>
            )}

            <button
              disabled={deleting}
              onClick={handleDelete}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
              title="Delete Resume"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="text-center py-12 px-4 rounded-2xl bg-gray-50/70 border-2 border-dashed border-gray-200 hover:border-lime-400 hover:bg-lime-50/10 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-lime-50 text-[#8DB600] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No resume uploaded yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Upload your resume in PDF format (Max 5 MB). It will be available for quick applications on InGage career postings.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white group-hover:bg-lime-50 border border-gray-200 group-hover:border-lime-300 text-gray-700 font-semibold text-xs shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4 text-[#8DB600]" />
            <span>Select PDF File</span>
          </button>
        </div>
      )}
    </div>
  );
};
