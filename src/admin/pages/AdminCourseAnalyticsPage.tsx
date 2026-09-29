"use client";
import React, { useState, useEffect } from 'react';
import { getCourseAnalytics, getCourseStudents, getCertificateDownloadUrl } from '../../api/adminApi';
import {
  BarChart3,
  ArrowLeft,
  Users,
  Activity,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  CreditCard,
  Award,
  Calendar,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export interface AdminCourseAnalyticsPageProps {
  courseId: string | number;
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminCourseAnalyticsPage: React.FC<AdminCourseAnalyticsPageProps> = ({
  courseId,
  onNavigate,
  onShowToast,
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anal, studs] = await Promise.all([
        getCourseAnalytics(courseId),
        getCourseStudents(courseId),
      ]);
      setAnalytics(anal);
      setStudents(studs);
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Failed to load course analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId]);

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-lime-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading course analytics from PostgreSQL...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Enrolled', value: analytics?.totalEnrolled || 0, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Active Learners', value: analytics?.activeLearners || 0, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Completed Learners', value: analytics?.completedLearners || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Completion Rate', value: `${analytics?.completionRate || 0}%`, icon: TrendingUp, color: 'text-lime-400', bg: 'bg-lime-500/10' },
    { label: 'Average Progress', value: `${analytics?.averageProgress || 0}%`, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Revenue', value: `₹${Number(analytics?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-lime-400', bg: 'bg-lime-500/10' },
    { label: 'Total Payments', value: analytics?.totalPayments || 0, icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Certificates Issued', value: analytics?.certificatesIssued || 0, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/courses')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {analytics?.courseTitle || 'Course Analytics'}
            </h1>
            <p className="text-xs text-slate-400">
              Database metrics for enrollment, completion velocity, revenue, and certified learners.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-lime-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-lime-400" />
              Enrolled Learners Dossier
            </h2>
            <p className="text-xs text-slate-400">
              Live progression, lesson completion counters, and credential issue records.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-300">
            Total Students: <b className="text-lime-400">{students.length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Enrolled Date</th>
                <th className="px-4 py-3.5">Progress</th>
                <th className="px-4 py-3.5">Last Accessed</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Certificate</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No students currently enrolled in this course.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.enrollmentId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white">
                      {s.userName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {s.userEmail}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(s.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-lime-400 h-full rounded-full"
                            style={{ width: `${s.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-bold text-white">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {s.lastAccessed ? new Date(s.lastAccessed).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.completed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}
                      >
                        {s.completed ? 'COMPLETED' : 'IN PROGRESS'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {s.hasCertificate ? (
                        <span className="font-mono text-lime-400 text-[11px] font-bold">
                          {s.certificateNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {s.hasCertificate && s.verificationCode && (
                        <a
                          href={`/certificate/verify/${s.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Verify</span>
                        </a>
                      )}
                      <button
                        onClick={() => onNavigate(`/admin/users/${s.userId}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Dossier
                      </button>
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

export default AdminCourseAnalyticsPage;
