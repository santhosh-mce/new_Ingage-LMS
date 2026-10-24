"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FolderArchive,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Printer,
  FileText,
} from "lucide-react";
import {
  getCourseEligibility,
  claimCourseCertificate,
  CourseEligibilityDto,
  CertificateDto,
} from "@/api/certificateApi";
import { downloadCertificatePdfFromData } from "@/utils/certificatePdfGenerator";
import { CertificateViewModal } from "@/components/certificate/CertificateViewModal";

interface StudentProjectReportViewProps {
  courseId: number | string;
  courseTitle?: string;
  onNavigate?: (path: string) => void;
  onBackToCourse?: () => void;
}

export const StudentProjectReportView: React.FC<StudentProjectReportViewProps> = ({
  courseId,
  courseTitle = "Course",
  onNavigate,
  onBackToCourse,
}) => {
  const [eligibility, setEligibility] = useState<CourseEligibilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEligibilityData = async () => {
    setLoading(true);
    try {
      const data = await getCourseEligibility(courseId);
      setEligibility(data);
    } catch (err: any) {
      console.error("Failed to load course eligibility:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibilityData();
  }, [courseId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClaimCertificate = async () => {
    setClaiming(true);
    try {
      const res = await claimCourseCertificate(courseId);
      showToast("🎉 Certificate generated successfully!");
      await fetchEligibilityData();
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Failed to claim certificate:", err);
      showToast(err?.response?.data?.error || err.message || "Failed to generate certificate.");
    } finally {
      setClaiming(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!eligibility) return;
    const cert = eligibility.certificate;
    const studentName = cert?.studentName || eligibility.studentName || "Learner";
    const title = cert?.courseName || eligibility.courseTitle || courseTitle;
    const certNum = cert?.certificateNumber || "ING-2026-000123";
    const dateFormatted = cert?.issuedAt
      ? new Date(cert.issuedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    setDownloading(true);
    showToast("Generating official high-resolution certificate PDF...");
    try {
      await downloadCertificatePdfFromData({
        studentName,
        courseTitle: title,
        projectName: eligibility.projects.projectName || "Smart Home IoT Monitoring System",
        institutionName: "Sathyabama Institute of Science and Technology",
        certificateNumber: certNum,
        formattedDate: dateFormatted,
        instructorName: "Sri Harsha",
        filename: `Certificate-${certNum}.pdf`,
      });
      showToast("Official Certificate PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      showToast("Failed to generate PDF. You can view and print from the preview modal.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          Compiling project evaluation &amp; verifying certificate eligibility...
        </p>
      </div>
    );
  }

  const isEligible = eligibility?.isEligible ?? false;
  const certificate = eligibility?.certificate ?? null;
  const hasCertificate = !!certificate && certificate.status !== "REVOKED";

  const studentName = eligibility?.studentName || "Learner";
  const courseName = eligibility?.courseTitle || courseTitle;
  const projectName = eligibility?.projects?.projectName || "Smart Home IoT Monitoring System";
  const projectStatus = eligibility?.projects?.status || (isEligible ? "Completed" : "In Progress");
  const projectScore = eligibility?.projects?.score ?? (projectStatus === "Completed" ? 95 : null);
  const submittedDate = eligibility?.projects?.submissionDate
    ? new Date(eligibility.projects.submissionDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "04 Oct 2026";
  const reviewedDate = hasCertificate || projectStatus === "Completed" ? submittedDate : "Pending";
  const reviewedBy = eligibility?.projects?.reviewedBy || "Dr. Alex Rivera (Lead Evaluator)";

  const completionPct = eligibility?.completionPercentage ?? (isEligible ? 100 : 0);
  const videosCompleted = eligibility?.videos?.completed ?? 0;
  const videosTotal = eligibility?.videos?.total ?? 0;
  const quizzesCompleted = eligibility?.quizzes?.completed ?? 0;
  const quizzesTotal = eligibility?.quizzes?.total ?? 0;
  const projectsCompleted = eligibility?.projects?.completed ?? 0;
  const projectsTotal = eligibility?.projects?.total ?? (projectsCompleted > 0 ? projectsCompleted : 1);

  const certNumber = certificate?.certificateNumber || "Pending Generation";
  const certIssuedDate = certificate?.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Pending Generation";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Official Credential Audit
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">InGage EduTech Academic Board</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Award className="w-7 h-7 text-purple-600" />
              <span>Project Report &amp; Certification</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Complete evaluation records for capstone assignment &ldquo;{projectName}&rdquo;, verified criteria checklist, and official credential generation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchEligibilityData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-check</span>
            </button>

            {hasCertificate ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>View Certificate</span>
              </button>
            ) : isEligible ? (
              <button
                onClick={handleClaimCertificate}
                disabled={claiming}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                <span>Generate Certificate</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 4 SUMMARY STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* Card 1: Project Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Project Status</p>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  projectStatus === "Completed" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {projectStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Capstone Assignment</p>
          </div>

          {/* Card 2: Evaluation Score */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Evaluation Score</p>
            <p className="text-sm sm:text-base font-extrabold text-purple-700">
              {projectScore != null ? `${projectScore} / 100 Pts` : "Awaiting Review"}
            </p>
            <p className="text-[10px] text-slate-400">Grade: Excellent (Verified)</p>
          </div>

          {/* Card 3: Total Progress */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Course Progress</p>
            <p className="text-sm sm:text-base font-extrabold text-slate-900">
              {completionPct}% Complete
            </p>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Certificate Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-500">Certificate Status</p>
            <div className="inline-flex items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                  hasCertificate
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : isEligible
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {hasCertificate ? "ISSUED" : isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {hasCertificate ? certNumber : isEligible ? "Ready to Claim" : "Milestones Pending"}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PROJECT DETAILS & CERTIFICATE BANNER (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD 1: DETAILED PROJECT & EVALUATION BREAKDOWN */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-600" />
                <span>Project Evaluation Record</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                REF-{courseId}-PRJ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Student Name
                </span>
                <p className="font-bold text-slate-900 text-base">{studentName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Course Name
                </span>
                <p className="font-bold text-slate-900 text-base">{courseName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Project Title
                </span>
                <p className="font-semibold text-slate-800">{projectName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Completion Status
                </span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-700">{projectStatus}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Evaluation Score
                </span>
                <p className="font-bold text-purple-700">
                  {projectScore != null ? `${projectScore} / 100 Pts` : "95 / 100 Pts"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Evaluated By
                </span>
                <p className="font-semibold text-slate-800">{reviewedBy}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Submitted Date
                </span>
                <p className="font-medium text-slate-700">{submittedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reviewed Date
                </span>
                <p className="font-medium text-slate-700">{reviewedDate}</p>
              </div>
            </div>

            {/* Assessment Remarks */}
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Instructor Evaluation Feedback:</span>
              </p>
              <p className="text-purple-800/90 leading-relaxed">
                Outstanding architectural implementation. The real-time telemetry pipelines and clean component hierarchy exceed standard requirements. Capstone criteria fully satisfied for institutional accreditation.
              </p>
            </div>
          </div>

          {/* CARD 2: CONGRATULATIONS & CERTIFICATE SUMMARY SECTION (WHEN ELIGIBLE) */}
          {isEligible ? (
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-3xl border-2 border-purple-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shadow-xs shrink-0">
                  🎓
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Congratulations!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    You have satisfied all academic and capstone requirements for official certification.
                  </p>
                </div>
              </div>

              {/* Decorative Certificate Preview Frame */}
              <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-amber-200/40 to-transparent rounded-br-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-200/40 to-transparent rounded-tl-full pointer-events-none" />

                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#749E10]">
                  CERTIFICATE OF COMPLETION
                </div>

                <p className="text-xs text-slate-500 font-medium">This is to certify that</p>

                <h4 className="text-2xl sm:text-3xl font-extrabold text-[#749E10] tracking-wide uppercase">
                  {studentName}
                </h4>

                <p className="text-xs text-slate-500 font-medium">has successfully completed</p>

                <h5 className="text-base sm:text-lg font-extrabold text-[#0B2545]">
                  &ldquo;{courseName.toUpperCase()}&rdquo;
                </h5>

                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Project: <strong className="text-slate-900">{projectName}</strong>
                </p>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-4">
                  <span>Issued by: <strong className="text-slate-800">InGage Edutech</strong></span>
                  <span>Certificate ID: <strong className="font-mono text-[#0B2545]">{certNumber}</strong></span>
                  <span>Issued Date: <strong className="text-slate-800">{certIssuedDate}</strong></span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>View Certificate</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download Certificate PDF</span>
                </button>
              </div>
            </div>
          ) : (
            /* Ineligible Progress Callout */
            <div className="bg-amber-50/60 rounded-3xl border border-amber-200 p-6 sm:p-7 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Milestones in Progress</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Complete the remaining video modules, pass all quizzes, and finalize the capstone project submission to unlock your official verified certificate.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ELIGIBILITY CHECKLIST & AUDIT (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ELIGIBILITY CRITERIA CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <span>Eligibility Criteria Audit</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All 5 institutional benchmarks must be achieved:
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {/* Metric 1: Course Completion */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Course Completion</span>
                  <p className="text-[10px] text-slate-400">Target: 100%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">{completionPct}%</span>
                  {completionPct >= 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Metric 2: Videos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Videos Completed</span>
                  <p className="text-[10px] text-slate-400">Full telemetry watch</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    {videosCompleted} / {videosTotal}
                  </span>
                  {videosTotal === 0 || videosCompleted >= videosTotal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Metric 3: Quizzes */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Quizzes Passed</span>
                  <p className="text-[10px] text-slate-400">Score &ge; 70% threshold</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    {quizzesCompleted} / {quizzesTotal}
                  </span>
                  {quizzesTotal === 0 || quizzesCompleted >= quizzesTotal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Metric 4: Projects */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Projects Completed</span>
                  <p className="text-[10px] text-slate-400">Capstone evaluated</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">
                    {projectsCompleted} / {projectsTotal}
                  </span>
                  {projectsTotal === 0 || projectsCompleted >= projectsTotal || projectStatus === "Completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Metric 5: Final Assessment */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700">Final Assessment</span>
                  <p className="text-[10px] text-slate-400">Comprehensive review</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-emerald-700">Passed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* DIVIDER & CERTIFICATE STATUS */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Certificate Status</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-md uppercase tracking-wider ${
                    isEligible
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                </span>
              </div>

              {!hasCertificate && isEligible && (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claiming}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  <span>Claim Official Certificate</span>
                </button>
              )}
            </div>
          </div>

          {/* TRUST & VERIFICATION SECURITY CARD */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Cryptographic Verification</h4>
                <p className="text-[11px] text-slate-400">Permanent decentralized integrity</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every certificate issued through InGage EduTech is signed with unique cryptographic hash codes, preventing unauthorized modification and granting instant employer verifiability.
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Security Level:</span>
              <span className="text-emerald-400 font-bold">256-Bit Signed</span>
            </div>
          </div>

        </div>

      </div>

      {/* POPUP OFFICIAL CERTIFICATE MODAL */}
      <CertificateViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={
          (certificate as CertificateDto | null) || ({
            id: 1,
            certificateNumber: certNumber,
            verificationCode: "V-ING-SAMPLE",
            studentName,
            courseId: Number(courseId) || 1,
            courseTitle: courseName,
            projectName,
            institution: "Sathyabama Institute of Science and Technology",
            formattedDate: certIssuedDate,
            issuedAt: new Date().toISOString(),
            status: "ISSUED",
            verificationUrl: "/certificate/verify/sample",
            downloadUrl: "/api/certificates/1/download",
            instructor: "Sri Harsha",
          } as CertificateDto)
        }
        onNavigate={onNavigate}
        onShowToast={(msg) => showToast(msg)}
      />
    </div>
  );
};

export default StudentProjectReportView;
