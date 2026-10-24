"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { getMyCredentials, UserCredentialDto } from "@/api/credentialApi";
import { downloadCertificatePdf } from "@/api/certificateApi";
import { useAuth } from "@/context/AuthContext";

export default function CertificatesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [certificates, setCertificates] = useState<UserCredentialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCredentials();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load certificates", err);
      setError("Unable to load your certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownload = async (cert: UserCredentialDto) => {
    try {
      const certId = cert.credentialId || cert.enrollmentId;
      setDownloadingId(certId);
      const studentName =
        currentUser?.name ||
        (currentUser as any)?.full_name ||
        "Student";
      const certCode = cert.credentialId || `INGAGE-${cert.enrollmentId || cert.courseId}`;
      await downloadCertificatePdf(
        cert.courseTitle || cert.credentialName || "Course",
        studentName,
        certCode
      );
    } catch (err) {
      console.error("PDF download failed", err);
      alert("Failed to download PDF certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = certificates.filter((c) => {
    const title = c.courseTitle || c.credentialName || "";
    const certCode = c.credentialId || "";
    return (
      !searchQuery ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently Issued";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <StudentLayout activePath="/certificates">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident, cryptographically verifiable certificates earned through completed courses,
            bootcamps, and technical evaluations.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              Total Earned: {certificates.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course or certificate ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 h-64 p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded-xl w-full mt-8" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={fetchCertificates}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {searchQuery ? "No matching certificates" : "No certificates issued yet"}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? "Check your certificate ID or course title filter."
                : "Complete 100% of video lessons, project submissions, and quizzes in an enrolled course to receive your official verified certificate."}
            </p>
            <Link
              href="/my-courses"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20"
            >
              Go to My Courses
            </Link>
          </div>
        )}

        {/* Certificate Cards Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cert) => {
              const certId = cert.credentialId || cert.enrollmentId;
              const certCode = cert.credentialId || `INGAGE-${cert.enrollmentId || cert.courseId}`;
              const courseTitle = cert.courseTitle || cert.credentialName || "Professional Course";
              const isDownloading = downloadingId === certId;

              return (
                <div
                  key={cert.enrollmentId || cert.courseId}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-4">
                    {/* Top status */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified &amp; Issued</span>
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {certCode}
                      </span>
                    </div>

                    {/* Course Title */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition">
                        {courseTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Issued to {currentUser?.name || (currentUser as any)?.full_name || "Learner"}
                      </p>
                    </div>

                    {/* Meta details */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Issue Date</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatDate(cert.completedAt || cert.enrolledAt)}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Verification Code</span>
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {certCode}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Credential Status</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Valid &amp; Active</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/certificates/${cert.courseId || cert.enrollmentId}`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                      </Link>

                      <button
                        onClick={() => handleDownload(cert)}
                        disabled={isDownloading}
                        className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Download PDF Certificate"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {isDownloading ? "..." : "PDF"}
                        </span>
                      </button>
                    </div>

                    <Link
                      href={`/certificates/verify/${certCode}`}
                      className="w-full py-2 rounded-xl text-center text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline block"
                    >
                      Verify Authenticity Online →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
