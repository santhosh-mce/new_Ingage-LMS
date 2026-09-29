"use client";
import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { IngageCertificate } from './IngageCertificate';
import { CertificateDto, downloadCertificatePdf, downloadSampleCertificatePdf } from '../../api/certificateApi';
import {
  X,
  Download,
  Printer,
  ExternalLink,
  ShieldCheck,
  Loader2,
  FileImage,
  CheckCircle2,
} from 'lucide-react';

import { exportElementToPng } from '../../utils/certificatePdfGenerator';

export interface CertificateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateDto | null;
  onNavigate?: (path: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onNavigate,
  onShowToast,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    if (onShowToast) onShowToast('Downloading official certificate PDF from server...', 'info');
    try {
      if (certificate.id) {
        await downloadCertificatePdf(certificate.id, certificate.certificateNumber, certificate.courseTitle);
      } else {
        await downloadSampleCertificatePdf();
      }
      if (onShowToast) onShowToast('Official certificate PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF Download Error:', err);
      const errMsg = err?.message || 'Failed to download certificate PDF from server.';
      if (onShowToast) onShowToast(errMsg, 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    const certElement = document.getElementById('modal-certificate-canvas');
    if (!certElement) return;

    setDownloadingPng(true);
    try {
      const filename = `Ingage-Certificate-${certificate.certificateNumber || 'verified'}.png`;
      await exportElementToPng(certElement, filename);
      if (onShowToast) onShowToast('High-quality certificate PNG downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Error generating PNG:', err);
      const errMsg = err?.message || 'Failed to generate certificate PNG image';
      if (onShowToast) onShowToast(errMsg, 'error');
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Official Certificate of Completion
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% Tamper-Proof</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {certificate.certificateNumber} &bull; Issued by InGage Edutech
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable Certificate Preview */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex-1 flex items-center justify-center">
          <div className="w-full max-w-[960px] my-auto">
            <IngageCertificate
              id="modal-certificate-canvas"
              studentName={certificate.studentName}
              courseTitle={certificate.courseTitle}
              certificateNumber={certificate.certificateNumber}
              formattedDate={certificate.formattedDate || 'Sep 18, 2026'}
              instructorName={certificate.instructor || 'Alex Rivera'}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span>Issuer:</span>
            <span className="font-semibold text-slate-200">InGage Edutech</span>
            <span>&bull;</span>
            <span>Lead Instructor:</span>
            <span className="font-semibold text-slate-200">{certificate.instructor || 'Alex Rivera'}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {onNavigate && certificate.verificationCode && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate(`/certificate/verify/${certificate.verificationCode}`);
                }}
                className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                title="Public Verification Link"
              >
                <ExternalLink className="w-4 h-4 text-[#8DB600]" />
                <span className="hidden sm:inline">Public Verify</span>
              </button>
            )}

            <button
              onClick={handleDownloadPng}
              disabled={downloadingPng}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#8DB600]" />
              ) : (
                <FileImage className="w-4 h-4 text-[#8DB600]" />
              )}
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
