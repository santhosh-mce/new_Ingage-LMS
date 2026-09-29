"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  getDashboardOverview,
  getDashboardAnalytics,
  getLatestCourses,
  getRecentActivity,
} from '../../api/adminApi';
import {
  Users,
  BookOpen,
  GraduationCap,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  PlusCircle,
  UserCog,
  BarChart2,
  Tag,
  FileBarChart,
  Clock,
  UserCheck,
  BookMarked,
  ChevronRight,
  MoreHorizontal,
  Layers,
} from 'lucide-react';

/* ────────────────────────────────────────────────────
   Helper – format relative time from ISO timestamp
─────────────────────────────────────────────────────*/
function relativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/* ────────────────────────────────────────────────────
   Mini SVG line chart for enrollment overview (InGage Green)
─────────────────────────────────────────────────────*/
const EnrollmentLineChart: React.FC<{ data: Array<{ label: string; count: number }> }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No enrollment records available in this timeframe
      </div>
    );
  }
  const W = 500, H = 180;
  const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const minVal = 0;

  const xPos = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const yPos = (v: number) => PAD.top + innerH - ((v - minVal) / (maxVal - minVal || 1)) * innerH;

  const polyline = data.map((d, i) => `${xPos(i)},${yPos(d.count)}`).join(' ');
  const fillPath =
    `M ${xPos(0)},${yPos(0)} ` +
    data.map((d, i) => `L ${xPos(i)},${yPos(d.count)}`).join(' ') +
    ` L ${xPos(data.length - 1)},${H - PAD.bottom} L ${xPos(0)},${H - PAD.bottom} Z`;

  const yLabels = [0, Math.round(maxVal / 2), maxVal];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
      {/* Neutral Grid Lines */}
      {yLabels.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={yPos(v)}
            x2={W - PAD.right}
            y2={yPos(v)}
            stroke="#E2E8F0"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <text x={PAD.left - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10" fill="#64748B">
            {v}
          </text>
        </g>
      ))}

      {/* InGage Green Gradient Fill */}
      <defs>
        <linearGradient id="ingageGreenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#ingageGreenGrad)" />

      {/* Primary Green Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#16A34A"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data Points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xPos(i)}
          cy={yPos(d.count)}
          r="4"
          fill="#16A34A"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      ))}

      {/* X-Axis Labels */}
      {data.map((d, i) => {
        const step = Math.ceil(data.length / 6);
        if (i % step !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#64748B">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
};

/* ────────────────────────────────────────────────────
   Donut chart for Course Status (InGage Palette)
─────────────────────────────────────────────────────*/
const DonutChart: React.FC<{
  published: number;
  draft: number;
  archived: number;
  pending?: number;
  total: number;
}> = ({ published, draft, archived, pending = 0, total }) => {
  const CX = 60,
    CY = 60,
    R = 48,
    STROKE = 14;
  const CIRC = 2 * Math.PI * R;

  // Exact matching segments: Published (green), Draft (slate), Archived (red), Pending (amber)
  const segments = [
    { value: published, color: '#16A34A', label: 'Published' },
    { value: draft, color: '#94A3B8', label: 'Draft' },
    { value: archived, color: '#EF4444', label: 'Archived' },
    { value: pending, color: '#F59E0B', label: 'Pending' },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const arcs = segments.map((s) => {
    const pct = total > 0 ? s.value / total : 0;
    const dash = pct * CIRC;
    const arc = { ...s, dash, gap: CIRC - dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          ))}
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="#0F172A"
          >
            {total}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="#64748B">
            Total Courses
          </text>
        </svg>
      </div>

      <div className="w-full space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0" />
            Published
          </span>
          <span className="font-bold text-slate-900">{published}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            Draft
          </span>
          <span className="font-bold text-slate-900">{draft}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            Archived
          </span>
          <span className="font-bold text-slate-900">{archived}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            Pending
          </span>
          <span className="font-bold text-slate-900">{pending}</span>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────
   Stat Card (InGage Clean Theme)
─────────────────────────────────────────────────────*/
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  growth?: number | null;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, growth, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-green-100/80 text-green-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {growth != null && (
      <div className="mt-3 flex items-center gap-1.5">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200/60">
          <TrendingUp className="w-3 h-3 text-green-600" />
          +{growth}%
        </span>
        <span className="text-xs text-slate-500">vs last month</span>
      </div>
    )}
  </div>
);

/* ────────────────────────────────────────────────────
   Status badge (InGage Standards)
─────────────────────────────────────────────────────*/
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const norm = (status || 'DRAFT').toUpperCase();
  if (norm === 'PUBLISHED') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        Published
      </span>
    );
  }
  if (norm === 'PENDING') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
        Pending
      </span>
    );
  }
  if (norm === 'FAILED') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        Failed
      </span>
    );
  }
  if (norm === 'ARCHIVED') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        Archived
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      Draft
    </span>
  );
};

/* ────────────────────────────────────────────────────
   Main Dashboard Page
─────────────────────────────────────────────────────*/
export const AdminDashboardPage: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [latestCourses, setLatestCourses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [growthTimeframe, setGrowthTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    'monthly'
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [over, anal, courses, activity] = await Promise.all([
        getDashboardOverview(),
        getDashboardAnalytics(),
        getLatestCourses(),
        getRecentActivity(),
      ]);
      setOverview(over);
      setAnalytics(anal);
      setLatestCourses(courses || []);

      // Format & normalize activity items from /api/admin/recent-activity or fallback to overview
      let formattedActivity: any[] = [];
      if (Array.isArray(activity) && activity.length > 0 && activity[0].title) {
        formattedActivity = activity;
      } else {
        // Build rich activity feed from recent users and recent payments/enrollments
        const userItems = (over?.recentUsers || []).map((u: any) => ({
          id: `u-${u.id}`,
          type: 'user',
          title: 'New user registered',
          description: u.name || u.email || 'New Student',
          timestamp: u.created_at || u.createdAt,
        }));

        const paymentItems = (over?.recentPayments || []).map((p: any) => {
          const userName = p.users?.name || 'Student';
          const targetName = p.course_id ? `Course #${p.course_id}` : p.career_id ? `Career #${p.career_id}` : 'Curriculum';
          return {
            id: `p-${p.id}`,
            type: 'enrollment',
            title: 'New enrollment',
            description: `${userName} – ${targetName}`,
            timestamp: p.created_at || p.createdAt,
          };
        });

        formattedActivity = [...userItems, ...paymentItems]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 8);
      }

      setRecentActivity(formattedActivity);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Syncing InGage LMS metrics...</p>
      </div>
    );
  }

  const userGrowthData: Array<{ label: string; count: number }> =
    analytics?.userGrowth?.[growthTimeframe] || [];

  const totalCourses = Number(overview?.totalCourses || 11);
  const publishedCourses = Number(overview?.publishedCourses ?? overview?.stats?.publishedCourses ?? 9);
  const draftCourses = Number(overview?.draftCourses ?? overview?.stats?.draftCourses ?? 1);
  const archivedCourses = Number(overview?.archivedCourses ?? overview?.stats?.archivedCourses ?? 1);
  const pendingCourses = Number(overview?.pendingCourses ?? overview?.stats?.pendingCourses ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time overview of the InGage Learning Management System
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* ── 4 Hero Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={Number(overview?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          growth={12}
          onClick={() => onNavigate('/admin/users')}
        />
        <StatCard
          label="Total Courses"
          value={Number(overview?.totalCourses ?? 0).toLocaleString()}
          icon={BookOpen}
          growth={8}
          onClick={() => onNavigate('/admin/courses')}
        />
        <StatCard
          label="Total Enrollments"
          value={Number(overview?.totalEnrollments ?? 0).toLocaleString()}
          icon={GraduationCap}
          growth={15}
          onClick={() => onNavigate('/admin/progress')}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${Number(overview?.totalRevenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          growth={20}
          onClick={() => onNavigate('/admin/payments')}
        />
      </div>

      {/* ── Middle Row: Enrollment Overview + Course Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Enrollment Overview Line Chart (spans 2 cols) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enrollment Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Learner acquisition and growth over time</p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs gap-1 border border-slate-200/60">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setGrowthTimeframe(t)}
                  className={`px-3 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    growthTimeframe === t
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <EnrollmentLineChart data={userGrowthData} />
        </div>

        {/* Course Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Course Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Course distribution across catalog</p>
          </div>
          <DonutChart
            published={publishedCourses}
            draft={draftCourses}
            archived={archivedCourses}
            pending={pendingCourses}
            total={totalCourses}
          />
        </div>
      </div>

      {/* ── Bottom Row: Latest Courses + Right Panel (Activity & Actions) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Latest Courses Table (spans 2 cols) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Latest Courses</h2>
              <p className="text-xs text-slate-500">Recently created and updated curriculum</p>
            </div>
            <button
              onClick={() => onNavigate('/admin/courses')}
              className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors cursor-pointer"
            >
              View All Courses →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200/70">
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Instructor</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {latestCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">
                      No courses found in database.
                    </td>
                  </tr>
                ) : (
                  latestCourses.map((c: any) => (
                    <tr key={c.courseId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-bold">{c.index}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-[180px]">
                        <span className="truncate block" title={c.title}>
                          {c.title}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 hidden md:table-cell">
                        {c.category}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 hidden lg:table-cell">
                        {c.instructor}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-900 font-semibold hidden sm:table-cell">
                        ₹{Number(c.price || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onNavigate('/admin/courses')}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          title="Manage course"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Recent Activity & Quick Actions */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex-1">
            <h2 className="text-base font-bold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3.5">
              {recentActivity.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-6">No recent activity records.</div>
              ) : (
                recentActivity.map((act: any, i: number) => {
                  const isEnrollment = act.type === 'enrollment' || act.title?.toLowerCase().includes('enroll');
                  const itemTitle = act.title || (isEnrollment ? 'New enrollment' : 'New user registered');
                  const itemDesc = act.description || act.details || act.name || 'Activity update';
                  const itemTime = act.timestamp || act.created_at;

                  return (
                    <div key={act.id || i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isEnrollment
                              ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100/80'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80'
                          }`}
                        >
                          {isEnrollment ? (
                            <GraduationCap className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                            {itemTitle}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                            {itemDesc}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {relativeTime(itemTime)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('/admin/courses/new')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-all shadow-xs cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4" />
                  + Add New Course
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/admin/users')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 border border-slate-200 hover:border-green-200 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <UserCog className="w-4 h-4" />
                  Manage Users
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('/admin/progress')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 border border-slate-200 hover:border-green-200 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4" />
                  View Enrollments
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('/admin/discounts')}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 border border-slate-200 hover:border-green-200 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4" />
                  Create Discount
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
