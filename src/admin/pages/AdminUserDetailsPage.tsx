"use client";
import React, { useState, useEffect } from 'react';
import { getAdminUserDetails, getCertificateDownloadUrl } from '../../api/adminApi';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Award,
  Download,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';

export interface AdminUserDetailsPageProps {
  userId: string;
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminUserDetailsPage: React.FC<AdminUserDetailsPageProps> = ({
  userId,
  onNavigate,
  onShowToast,
}) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getAdminUserDetails(userId);
      setDetails(data);
    } catch (err) {
      console.error('Failed to load user details', err);
      if (onShowToast) onShowToast('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading user dossier...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-slate-400">User dossier could not be retrieved.</p>
        <button
          onClick={() => onNavigate('/admin/users')}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
        >
          Return to Users
        </button>
      </div>
    );
  }

  const { profile, learning, payments, certificates } = details;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button & header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/admin/users')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users List</span>
        </button>

        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-lime-500/10 text-lime-400 border border-lime-500/20">
          User Dossier
        </span>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-600 to-lime-400 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-lime-500/20">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-lime-400" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-lime-400" />
                    {profile.phone}
                  </span>
                )}
                <span className="text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 uppercase text-[10px]">
                  {profile.role}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  profile.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 text-xs text-slate-400 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto">
            <p>
              Registered:{' '}
              <span className="text-slate-200 font-medium">
                {profile.createdDate ? new Date(profile.createdDate).toLocaleDateString() : '—'}
              </span>
            </p>
            <p>
              Last Activity:{' '}
              <span className="text-slate-200 font-medium">
                {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : '—'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Learning Progress Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lime-400" />
              Learning Progress & Enrolled Courses
            </h2>
            <p className="text-xs text-slate-400">Curriculum participation and completion status</p>
          </div>

          {/* Progress summary badges */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Enrolled: <b className="text-white">{learning.coursesEnrolled}</b>
            </span>
            <span className="text-slate-400">
              Completed: <b className="text-emerald-400">{learning.coursesCompleted}</b>
            </span>
            <span className="text-slate-400">
              Avg Progress: <b className="text-lime-400">{learning.overallProgress}%</b>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learning.enrollments?.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-xs text-slate-400">
              User is not enrolled in any courses yet.
            </div>
          ) : (
            learning.enrollments?.map((e: any) => (
              <div key={e.enrollmentId} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{e.courseTitle}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    e.status === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {e.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Mastery</span>
                    <span className="font-bold text-lime-400">{e.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-lime-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${e.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</span>
                  {e.completedAt && <span>Completed: {new Date(e.completedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" />
          Transactions & Payment Records
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Original</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Paid Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No transactions found for this user.
                  </td>
                </tr>
              ) : (
                payments?.map((p: any) => (
                  <tr key={p.paymentId} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-400">{p.paymentNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.orderId || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.course}</td>
                    <td className="px-4 py-3 text-slate-400">₹{p.amount}</td>
                    <td className="px-4 py-3 text-rose-400">₹{p.discount}</td>
                    <td className="px-4 py-3 font-bold text-lime-400">₹{p.finalAmount}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issued Certificates */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Issued Certificates & Credentials
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Certificate Number</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Verification Code</th>
                <th className="px-4 py-3">Issued Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {certificates?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No certificates issued for this user yet.
                  </td>
                </tr>
              ) : (
                certificates?.map((c: any) => (
                  <tr key={c.certificateId} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-bold text-lime-400">{c.certificateNumber}</td>
                    <td className="px-4 py-3 font-semibold text-white">{c.course}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{c.verificationCode}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(c.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <a
                        href={getCertificateDownloadUrl(c.certificateId, false)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                      <a
                        href={`/certificate/verify/${c.verificationCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Verify</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
