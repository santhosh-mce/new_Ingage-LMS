"use client";
import React, { useEffect, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyCertificatesThunk } from '../../store/slices/certificateSlice';
import {
  downloadCertificatePdf,
  downloadSampleCertificatePdf,
  claimCourseCertificate,
  CertificateDto,
} from '../../api/certificateApi';
import { IngageCertificate } from '../../components/certificate/IngageCertificate';
import { CertificateViewModal } from '../../components/certificate/CertificateViewModal';
import {
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  Calendar,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Eye,
  FileImage,
  Sparkles,
} from 'lucide-react';

interface StudentCertificatesSectionProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentCertificatesSection: React.FC<StudentCertificatesSectionProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const dispatch = useAppDispatch();
  const { myCertificates, loading } = useAppSelector((state) => state.certificate);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedCert, setSelectedCert] = useState<CertificateDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [downloadingPngId, setDownloadingPngId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoClaimAttempted, setAutoClaimAttempted] = useState(false);

  useEffect(() => {
    dispatch(fetchMyCertificatesThunk());
  }, [dispatch]);

  // Display certificates: strictly use the authenticated student's certificates from backend
  const displayCertificates: CertificateDto[] = useMemo(() => {
    return myCertificates;
  }, [myCertificates]);

  const handleOpenModal = (cert: CertificateDto) => {
    setSelectedCert(cert);
    setIsModalOpen(true);
  };

  const [downloadingSamplePdf, setDownloadingSamplePdf] = useState(false);

  const handleDownloadPdf = async (cert: CertificateDto) => {
    setDownloadingPdfId(cert.id);
    if (onShowToast) onShowToast(`Downloading official certificate for ${cert.courseTitle}...`, 'info');
    try {
      await downloadCertificatePdf(cert.id, cert.certificateNumber, cert.courseTitle);
      if (onShowToast) onShowToast('Official certificate PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('Certificate PDF download error:', err);
      if (onShowToast) onShowToast(err?.message || 'Failed to download certificate PDF from server.', 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleDownloadSampleCertificate = async () => {
    setDownloadingSamplePdf(true);
    if (onShowToast) onShowToast('Downloading sample certificate PDF from server...', 'info');
    try {
      await downloadSampleCertificatePdf();
      if (onShowToast) onShowToast('Sample Certificate PDF downloaded successfully from server!', 'success');
    } catch (err: any) {
      console.error('Sample PDF download error:', err);
      if (onShowToast) onShowToast(err?.message || 'Failed to download sample certificate PDF', 'error');
    } finally {
      setDownloadingSamplePdf(false);
    }
  };

  const handleDownloadPng = async (cert: CertificateDto) => {
    setDownloadingPngId(cert.id);
    try {
      // Find rendered canvas or create temporary rendering
      const certElement = document.getElementById(`cert-render-${cert.id}`);
      if (!certElement) {
        // If not directly visible, open modal for high-res download
        handleOpenModal(cert);
        setDownloadingPngId(null);
        return;
      }

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

      if (onShowToast) onShowToast('High-quality certificate PNG downloaded!', 'success');
    } catch (err) {
      console.error('Error generating PNG:', err);
      if (onShowToast) onShowToast('Failed to generate PNG. Try modal view.', 'error');
    } finally {
      setDownloadingPngId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    if (onShowToast) onShowToast('Certificate ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner - Official Verification Ledger */}
      <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-gray-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8DB600]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8DB600]/20 text-[#8DB600] text-xs font-bold border border-[#8DB600]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Verification Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Certificates & Credentials
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              Every course you complete generates an official, tamper-proof certificate of completion with a unique ID registered on Ingage LMS.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadSampleCertificate}
              disabled={downloadingSamplePdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Download a verified sample certificate PDF matching the exact official design"
            >
              {downloadingSamplePdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-gray-950" />
              )}
              <span>Download Sample Certificate</span>
            </button>

            <button
              onClick={() => onNavigate('/certificate/verify')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8DB600]" />
              <span>Public Verification Hub</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Earned Certificates
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {displayCertificates.length}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Verification Status
            </span>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Tamper-Proof</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Issuer
            </span>
            <div className="text-sm font-bold text-white mt-1">InGage Edutech</div>
          </div>
        </div>
      </div>

      {/* Certificates List / Earned Certificates */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8DB600]" />
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              Earned Certificates
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 text-xs font-bold">
              {displayCertificates.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('/courses')}
            className="text-xs font-bold text-[#8DB600] hover:text-lime-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explore more courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayCertificates.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-lime-50 text-[#8DB600] flex items-center justify-center mx-auto border border-lime-200">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-gray-900 tracking-tight">No Certificates Earned Yet</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Complete 100% of lessons and assessments in any enrolled course to automatically earn and download your official certificate.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/courses')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayCertificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-md hover:border-[#8DB600]/60 transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Certificate Thumbnail Preview Container */}
              <div
                className="relative w-full aspect-[1.55/1] bg-slate-100/70 border-b border-gray-200/70 overflow-hidden cursor-pointer flex items-center justify-center p-3 sm:p-4 group/thumb select-none"
                onClick={() => handleOpenModal(cert)}
                title="Click to view full certificate"
              >
                {/* Scaled-down Interactive Certificate Render */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-gray-200/60 bg-white">
                  <div
                    id={`cert-render-${cert.id}`}
                    className="w-[1000px] h-[707px] origin-top-left pointer-events-none"
                    style={{
                      transform: 'scale(var(--thumb-scale, 0.44))',
                      transformOrigin: 'top left',
                    }}
                    ref={(el) => {
                      if (el && el.parentElement) {
                        const updateScale = () => {
                          if (el && el.parentElement) {
                            const parentWidth = el.parentElement.clientWidth;
                            const scale = parentWidth / 1000;
                            el.style.setProperty('--thumb-scale', `${scale}`);
                          }
                        };
                        updateScale();
                        if (typeof ResizeObserver !== 'undefined' && !((el as any).__roAttached)) {
                          (el as any).__roAttached = true;
                          const ro = new ResizeObserver(updateScale);
                          ro.observe(el.parentElement);
                        }
                      }
                    }}
                  >
                    <IngageCertificate
                      id={`canvas-thumb-${cert.id}`}
                      studentName={cert.studentName}
                      courseTitle={cert.courseTitle}
                      certificateNumber={cert.certificateNumber}
                      formattedDate={cert.formattedDate || 'Sep 18, 2026'}
                      instructorName={cert.instructor || 'Alex Rivera'}
                    />
                  </div>
                </div>

                {/* Hover overlay with quick preview indicator */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover/thumb:bg-slate-950/25 transition-all flex items-center justify-center pointer-events-none">
                  <span className="opacity-0 group-hover/thumb:opacity-100 px-4 py-2 rounded-2xl bg-gray-900/90 text-white text-xs font-bold shadow-xl transition-all flex items-center gap-2 backdrop-blur-xs transform scale-95 group-hover/thumb:scale-100">
                    <Eye className="w-4 h-4 text-[#8DB600]" />
                    <span>View Official Certificate</span>
                  </span>
                </div>
              </div>

              {/* Certificate Card Details */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-full bg-lime-50 border border-lime-200 text-[#8DB600] text-[11px] font-bold">
                      {cert.courseCategory || 'Certified Mastery'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>100% Tamper-Proof</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-lime-900 transition-colors">
                      {cert.courseTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Issued: {cert.formattedDate || 'Sep 18, 2026'}</span>
                      </span>
                      {cert.courseDuration && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                          <span>Duration: {cert.courseDuration}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Certificate ID Box */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-150 flex items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Certificate ID
                      </span>
                      <span className="font-mono font-bold text-gray-900 text-xs">
                        {cert.certificateNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(cert.certificateNumber)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                      title="Copy Certificate ID"
                    >
                      {copiedId === cert.certificateNumber ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(cert)}
                    className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gray-950 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#8DB600]" />
                    <span>View Certificate</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPng(cert)}
                    disabled={downloadingPngId === cert.id}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Download High-Resolution PNG"
                  >
                    {downloadingPngId === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#8DB600]" />
                    ) : (
                      <FileImage className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>PNG</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(cert)}
                    disabled={downloadingPdfId === cert.id}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-gray-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Download Official PDF"
                  >
                    {downloadingPdfId === cert.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => onNavigate(`/certificate/verify/${cert.verificationCode}`)}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    title="Public Verification Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* View Certificate Full Modal */}
      <CertificateViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={selectedCert}
        onNavigate={onNavigate}
        onShowToast={onShowToast}
      />
    </div>
  );
};
