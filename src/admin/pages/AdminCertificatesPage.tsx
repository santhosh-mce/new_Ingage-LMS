"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
  Eye,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  UserCheck,
  X,
  FileCheck,
  Loader2,
  Trash2,
  RotateCcw,
  PlusCircle,
  Calendar,
} from "lucide-react";
import {
  getAdminCertificates,
  adminGenerateCertificate,
  adminRevokeCertificate,
  adminRestoreCertificate,
  getAdminUsers,
  getAdminCourses,
} from "../../api/adminApi";
import { CertificateViewModal } from "../../components/certificate/CertificateViewModal";
import { downloadCertificatePdfFromData } from "../../utils/certificatePdfGenerator";

export const AdminCertificatesPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const [records, setRecords] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  // Certificate Modal State
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Manual Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueUserId, setIssueUserId] = useState("");
  const [issueCourseId, setIssueCourseId] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);

  // Revoke Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [certsData, uData, cData] = await Promise.all([
        getAdminCertificates().catch(() => []),
        getAdminUsers().catch(() => []),
        getAdminCourses().catch(() => []),
      ]);
      setRecords(certsData);
      setUsersList(Array.isArray(uData) ? uData : uData?.users || []);
      setCoursesList(Array.isArray(cData) ? cData : cData?.courses || []);
    } catch (err) {
      console.error("Admin certificates fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = r.userName?.toLowerCase().includes(q);
        const matchEmail = r.userEmail?.toLowerCase().includes(q);
        const matchCourse = r.courseTitle?.toLowerCase().includes(q);
        const matchNumber = r.certificateNumber?.toLowerCase().includes(q);
        const matchCode = r.verificationCode?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCourse && !matchNumber && !matchCode) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) {
        return false;
      }

      // 3. Eligibility Filter
      if (eligibilityFilter === "ELIGIBLE" && !r.isEligible) return false;
      if (eligibilityFilter === "NOT_ELIGIBLE" && r.isEligible) return false;

      // 4. Course Filter
      if (courseFilter !== "ALL" && String(r.courseId) !== String(courseFilter)) {
        return false;
      }

      return true;
    });
  }, [records, search, statusFilter, eligibilityFilter, courseFilter]);

  // Statistics
  const totalIssued = records.filter((r) => r.status === "ISSUED").length;
  const totalPending = records.filter((r) => r.status === "PENDING").length;
  const totalRevoked = records.filter((r) => r.status === "REVOKED").length;
  const totalEligible = records.filter((r) => r.isEligible).length;

  // Actions
  const handleRevoke = async (certId: string) => {
    if (!confirm("Are you sure you want to REVOKE this certificate? The student will no longer be able to claim or view it.")) {
      return;
    }
    setActionLoadingId(certId);
    try {
      await adminRevokeCertificate(certId);
      showToast("Certificate revoked successfully.");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to revoke certificate");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (certId: string) => {
    setActionLoadingId(certId);
    try {
      await adminRestoreCertificate(certId);
      showToast("Certificate restored successfully.");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to restore certificate");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualGenerate = async (userId: string, courseId: string) => {
    setActionLoadingId(`gen-${userId}-${courseId}`);
    try {
      await adminGenerateCertificate(userId, courseId);
      showToast("Certificate generated and issued successfully!");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to generate certificate");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleModalIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUserId || !issueCourseId) {
      alert("Please select both a student and a course.");
      return;
    }
    setIsIssuing(true);
    try {
      await adminGenerateCertificate(issueUserId, issueCourseId);
      showToast("Certificate successfully issued to student!");
      setIsIssueModalOpen(false);
      setIssueUserId("");
      setIssueCourseId("");
      await fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || "Failed to issue certificate");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleDownloadPdf = async (record: any) => {
    const studentName = record.userName || "Student";
    const courseTitle = record.courseTitle || "Course";
    const certNum = record.certificateNumber || "ING-2026-000123";
    const formattedDate = record.issueDate
      ? new Date(record.issueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "04 October 2026";

    showToast("Generating official high-resolution certificate PDF...");
    try {
      await downloadCertificatePdfFromData({
        studentName,
        courseTitle,
        projectName: record.projectName || "Smart Home IoT Monitoring System",
        institutionName: "Sathyabama Institute of Science and Technology",
        certificateNumber: certNum,
        formattedDate,
        instructorName: "Sri Harsha",
        filename: `Certificate-${certNum}.pdf`,
      });
      showToast("PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to download PDF.");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              Admin &bull; Reports &bull; Certification
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-purple-600" />
            <span>Certification &amp; Project Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit student progress milestones, verify capstone completion, and manage issued or revoked credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Issue Certificate</span>
          </button>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STATS TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Issued</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{totalIssued}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active valid certificates</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Eligible Students</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{totalEligible}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Satisfied 100% criteria</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Pending Claim</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalPending}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Enrolled / in-progress</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Revoked</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalRevoked}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Withdrawn credentials</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, course, or certificate ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">Status: Issued</option>
            <option value="PENDING">Status: Pending</option>
            <option value="REVOKED">Status: Revoked</option>
          </select>

          {/* Eligibility Filter */}
          <select
            value={eligibilityFilter}
            onChange={(e) => setEligibilityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="ALL">All Eligibility</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="NOT_ELIGIBLE">Not Eligible</option>
          </select>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600 cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All Courses</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Student Name</th>
                <th className="px-4 py-3.5 bg-slate-50">Course</th>
                <th className="px-4 py-3.5 bg-slate-50">Completion %</th>
                <th className="px-4 py-3.5 bg-slate-50">Project Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Eligibility</th>
                <th className="px-4 py-3.5 bg-slate-50">Certificate Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Certificate ID</th>
                <th className="px-4 py-3.5 bg-slate-50">Issued Date</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading certification and project records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    No certificate records match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isIssued = r.status === "ISSUED";
                  const isRevoked = r.status === "REVOKED";
                  const isPending = r.status === "PENDING";
                  const isRecordLoading =
                    actionLoadingId === r.id ||
                    actionLoadingId === `gen-${r.userId}-${r.courseId}`;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Student Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {r.userName?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{r.userName}</div>
                            <div className="text-[11px] text-slate-400">{r.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Course */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-[200px] truncate">
                        {r.courseTitle}
                      </td>

                      {/* 3. Completion % */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">
                            {r.completionPercentage}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${r.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 4. Project Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            r.projectStatus === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.projectStatus === "Completed" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span>{r.projectStatus}</span>
                        </span>
                      </td>

                      {/* 5. Eligibility */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            r.isEligible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.isEligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>

                      {/* 6. Certificate Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${
                            isIssued
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isRevoked
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* 7. Certificate ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs">
                        {r.certificateNumber !== "—" ? (
                          <span className="text-[#0B2545]">{r.certificateNumber}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* 8. Issued Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {r.issueDate ? new Date(r.issueDate).toLocaleDateString("en-GB") : "—"}
                      </td>

                      {/* 9. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {isIssued && (
                          <>
                            {/* View Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCert({
                                  id: r.id,
                                  certificateNumber: r.certificateNumber,
                                  studentName: r.userName,
                                  courseTitle: r.courseTitle,
                                  projectName: r.projectName,
                                  institution: "Sathyabama Institute of Science and Technology",
                                  verificationCode: r.verificationCode,
                                  issuedAt: r.issueDate,
                                  formattedDate: new Date(r.issueDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }),
                                  instructor: "Sri Harsha",
                                  status: r.status,
                                });
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                              title="View official certificate"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition cursor-pointer"
                              title="Download high-resolution PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            {/* Revoke Certificate */}
                            <button
                              type="button"
                              disabled={isRecordLoading}
                              onClick={() => handleRevoke(r.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer disabled:opacity-50"
                              title="Revoke certificate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          </>
                        )}

                        {isRevoked && (
                          <button
                            type="button"
                            disabled={isRecordLoading}
                            onClick={() => handleRestore(r.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}

                        {isPending && (
                          <button
                            type="button"
                            disabled={isRecordLoading}
                            onClick={() => handleManualGenerate(r.userId, r.courseId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {isRecordLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Award className="w-3.5 h-3.5" />
                            )}
                            <span>Issue Certificate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="font-semibold text-slate-800">{filteredRecords.length}</strong> of{" "}
            {records.length} records
          </span>
          <span className="text-[11px] text-slate-400">
            Compliant with InGage Academic Board Accreditation Standards
          </span>
        </div>
      </div>

      {/* MODAL 1: VIEW OFFICIAL CERTIFICATE PREVIEW */}
      <CertificateViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={selectedCert}
        onNavigate={onNavigate}
        onShowToast={showToast}
      />

      {/* MODAL 2: MANUAL ISSUE CERTIFICATE */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Manual Certificate Issue</h3>
                  <p className="text-xs text-slate-500">Authorize and generate an official InGage credential</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Student *
                </label>
                <select
                  value={issueUserId}
                  onChange={(e) => setIssueUserId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none transition cursor-pointer"
                >
                  <option value="">-- Choose Student --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Course *
                </label>
                <select
                  value={issueCourseId}
                  onChange={(e) => setIssueCourseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none transition cursor-pointer"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Administrative Grant Override:</span>
                </p>
                <p className="text-purple-800 leading-relaxed text-[11px]">
                  Issuing this certificate will generate a unique `ING-YYYY-XXXXXX` ID, assign verified status, and allow the student to immediately download and view the credential.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isIssuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  <span>Confirm &amp; Issue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificatesPage;
