"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { getAdminProgress } from '../../api/adminApi';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Award,
  User,
} from 'lucide-react';

export const AdminCourseProgressPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const [progressList, setProgressList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const data = await getAdminProgress(search, undefined, statusFilter);
      setProgressList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load progress records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [search, statusFilter]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };
  // Client-side Instant Filtered Progress List
  const filteredProgress = useMemo(() => {
    return progressList.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesUser = (p.userName || '').toLowerCase().includes(q);
        const matchesEmail = (p.userEmail || '').toLowerCase().includes(q);
        const matchesCourse = (p.courseTitle || '').toLowerCase().includes(q);
        const matchesCert = (p.certificateNumber || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesEmail && !matchesCourse && !matchesCert) return false;
      }
      const progressVal = Number(p.progress ?? p.progressPercentage ?? 0);
      const isCompleted = p.status === 'COMPLETED' || progressVal >= 100 || !!p.completionDate;
      if (statusFilter === 'IN_PROGRESS' || statusFilter === 'IN PROGRESS') {
        if (isCompleted) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (!isCompleted) return false;
      }
      return true;
    });
  }, [progressList, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-green-600" />
            Course Progress & Enrollments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time curriculum progression, lesson completion counters, and automated certificate issuances.
          </p>
        </div>

        <button
          onClick={fetchProgress}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-sm font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, email, or course..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-500 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                {/* Sticky Student Column */}
                <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3.5 shadow-[1px_0_0_0_#e2e8f0] min-w-[180px]">
                  Student
                </th>
                <th className="px-4 py-3.5 min-w-[200px]">Course</th>
                <th className="px-4 py-3.5 min-w-[130px]">Progress</th>
                <th className="px-4 py-3.5 text-center min-w-[100px]">Lessons</th>
                <th className="px-4 py-3.5 text-center min-w-[100px]">Status</th>
                <th className="px-4 py-3.5 min-w-[110px]">Enrolled Date</th>
                <th className="px-4 py-3.5 min-w-[110px]">Completion Date</th>
                <th className="px-4 py-3.5 min-w-[120px]">Certificate</th>
                <th className="px-4 py-3.5 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && filteredProgress.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying learner progress from database...
                  </td>
                </tr>
              ) : progressList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    No student progress records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProgress.map((p) => {
                  const progressVal = Number(p.progress ?? p.progressPercentage ?? 0);
                  const isCompleted = p.status === 'COMPLETED' || progressVal >= 100 || !!p.completionDate;

                  return (
                    <tr
                      key={p.enrollmentId || p.id}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Sticky Student Column */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3.5 font-bold text-slate-900 shadow-[1px_0_0_0_#e2e8f0]">
                        <div className="font-semibold text-slate-900 leading-snug">{p.userName || 'Learner'}</div>
                        <div className="text-xs text-slate-500 font-normal leading-tight truncate max-w-[160px]">
                          {p.userEmail}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3.5 font-medium text-slate-900 max-w-[240px]">
                        <div className="truncate" title={p.courseTitle}>
                          {p.courseTitle}
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progressVal >= 100
                                  ? 'bg-emerald-500'
                                  : progressVal > 0
                                  ? 'bg-green-600'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-900 min-w-[32px]">
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      {/* Lessons Completed */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 text-xs">
                        {p.lessonsCompleted ?? 0}{' '}
                        <span className="text-slate-400 font-normal">/ {p.lessonsTotal ?? 0}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : progressVal > 0
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>COMPLETED</span>
                            </>
                          ) : progressVal > 0 ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span>IN PROGRESS</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>ACTIVE</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Enrolled Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(p.enrollmentDate || p.enrolledAt)}
                      </td>

                      {/* Completion Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(p.completionDate || p.completedAt)}
                      </td>

                      {/* Certificate */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.certificateNumber ? (
                          <span className="inline-flex items-center gap-1 font-mono text-green-700 font-bold text-xs bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                            <Award className="w-3 h-3 text-green-600" />
                            {p.certificateNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.verificationCode && (
                            <a
                              href={`/certificate/verify/${p.verificationCode}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                              title="Verify Certificate"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Verify</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onNavigate(`/admin/users/${p.userId}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-200/80 transition cursor-pointer"
                            title="View User Details"
                          >
                            <User className="w-3 h-3 text-slate-500" />
                            <span>Dossier</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Count */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>
            Total: <strong className="font-semibold text-slate-800">{progressList.length}</strong> enrollment record{progressList.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseProgressPage;
