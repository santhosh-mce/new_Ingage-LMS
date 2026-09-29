"use client";
import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { getCertificateById, downloadCertificatePdf, downloadSampleCertificatePdf, CertificateDto } from '../api/certificateApi';
import { IngageCertificate } from '../components/certificate/IngageCertificate';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Loader2,
  Lock,
  Download,
  FileImage,
  ExternalLink,
} from 'lucide-react';

import { exportElementToPng } from '../utils/certificatePdfGenerator';

interface CertificateDetailPageProps {
  certificateId: string | number;
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CertificateDetailPage: React.FC<CertificateDetailPageProps> = ({
  certificateId,
  onNavigate,
  onShowToast,
}) => {
  const [cert, setCert] = useState<CertificateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCertificateById(certificateId)
      .then((data) => {
        setCert(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Certificate not found or access is restricted to the certificate owner.');
        setLoading(false);
      });
  }, [certificateId]);

  const handleDownloadPdf = async () => {
    if (!cert) return;
    setIsDownloadingPdf(true);
    if (onShowToast) onShowToast(`Downloading official certificate for ${cert.courseTitle}...`, 'info');
    try {
      if (cert.id && typeof cert.id === 'number') {
        await downloadCertificatePdf(cert.id, cert.certificateNumber, cert.courseTitle);
      } else {
        await downloadSampleCertificatePdf();
      }
      if (onShowToast) onShowToast('Official certificate PDF downloaded successfully!', 'success');
    } catch (err: any) {
      if (onShowToast) onShowToast(err?.message || 'Failed to download certificate PDF from server', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    const certElement = document.getElementById('page-certificate-canvas');
    if (!certElement || !cert) return;

    setIsDownloadingPng(true);
    try {
      const canvas = await html2canvas(certElement, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Ingage-Certificate-${cert.certificateNumber || 'verified'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      if (onShowToast) onShowToast('High-resolution certificate PNG downloaded!', 'success');
    } catch (err) {
      console.error('Error generating PNG:', err);
      if (onShowToast) onShowToast('Failed to generate PNG image', 'error');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleCopyId = () => {
    if (!cert) return;
    navigator.clipboard.writeText(cert.certificateNumber);
    setCopied(true);
    if (onShowToast) onShowToast('Certificate ID copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#8DB600] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Loading verified certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Certificate Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'Certificate not found or unauthorized access.'}</p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/profile/certificates')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Back to My Certificates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#8DB600] selection:text-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('/profile/certificates')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Certificates</span>
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => onNavigate(`/certificate/verify/${cert.verificationCode}`)}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-[#8DB600]" />
              <span>Verify Authenticity</span>
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8DB600]" />
              ) : (
                <FileImage className="w-4 h-4 text-[#8DB600]" />
              )}
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Certificate Card Container */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-3 sm:p-8 shadow-2xl backdrop-blur-md">
          <IngageCertificate
            id="page-certificate-canvas"
            studentName={cert.studentName}
            courseTitle={cert.courseTitle}
            certificateNumber={cert.certificateNumber}
            formattedDate={cert.formattedDate || 'Sep 18, 2026'}
            instructorName={cert.instructor || 'Alex Rivera'}
          />
        </div>

        {/* Verification Summary Info Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <span>Official Verification Ledger</span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Tamper-Proof</span>
                </span>
              </div>
              <div className="text-slate-400 mt-0.5">
                Certificate ID: <strong className="text-white font-mono">{cert.certificateNumber}</strong> &bull; Issuer: <strong className="text-white">InGage Edutech</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              title="Copy Certificate ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : cert.certificateNumber}</span>
            </button>
            <button
              onClick={() => onNavigate(`/certificate/verify/${cert.verificationCode}`)}
              className="text-xs font-bold text-[#8DB600] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Public Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailPage;
