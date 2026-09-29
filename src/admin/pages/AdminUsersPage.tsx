"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Phone,
  Mail,
  Calendar,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserStats,
  getAdminUserDetails,
  updateAdminUser,
  updateAdminUserStatus,
  updateAdminUserRole,
  deleteOrDeactivateAdminUser,
} from '../../api/adminApi';
import { useAppSelector } from '../../store/hooks';
import { UserProfile } from '../../types';

export interface AdminUsersPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
  currentUser?: UserProfile | null;
  initialRoleFilter?: 'ALL' | 'LEARNER' | 'INSTRUCTOR' | 'ADMIN' | 'EMPLOYER';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  instructors: number;
  administrators: number;
  learners: number;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({
  onNavigate: _onNavigate,
  onShowToast,
  currentUser: propUser,
  initialRoleFilter = 'ALL',
}) => {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const loggedInUser = propUser || authUser;

  // Data states
  const [users, setUsers] = useState<any[]>([]);

  const formatDateTime = (val?: string | null) => {
    if (!val) return null;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      const dateStr = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { dateStr, timeStr };
    } catch {
      return null;
    }
  };

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LEARNER' | 'INSTRUCTOR' | 'ADMIN' | 'EMPLOYER'>(initialRoleFilter);
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingDetails, setViewingDetails] = useState<any | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'LEARNER',
    active: true,
    emailVerified: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Local Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    if (onShowToast) onShowToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Fetch Users & Statistics
  const fetchData = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const [userData, statsData] = await Promise.all([
        getAdminUsers(searchQuery),
        getAdminUserStats().catch(() => null),
      ]);

      const userList = Array.isArray(userData) ? userData : [];
      setUsers(userList);

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback calculations if stats endpoint fails
        const total = userList.length;
        const active = userList.filter((u) => u.active !== false).length;
        const verified = userList.filter((u) => u.emailVerified === true).length;
        const instructors = userList.filter((u) => (u.role || '').toUpperCase() === 'INSTRUCTOR').length;
        const admins = userList.filter((u) => (u.role || '').toUpperCase() === 'ADMIN').length;
        const learners = userList.filter((u) => {
          const r = (u.role || '').toUpperCase();
          return r === 'LEARNER' || r === 'STUDENT';
        }).length;
        setStats({
          totalUsers: total,
          activeUsers: active,
          inactiveUsers: total - active,
          verifiedUsers: verified,
          unverifiedUsers: total - verified,
          instructors,
          administrators: admins,
          learners,
        });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('Failed to load user directory. Please try again.', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Filter
      if (roleFilter !== 'ALL') {
        const userRole = (u.role || '').toUpperCase();
        if (roleFilter === 'LEARNER' && userRole !== 'LEARNER' && userRole !== 'STUDENT') {
          return false;
        } else if (roleFilter !== 'LEARNER' && userRole !== roleFilter) {
          return false;
        }
      }

      // Verification Filter
      if (verificationFilter === 'VERIFIED' && !u.emailVerified) {
        return false;
      }
      if (verificationFilter === 'UNVERIFIED' && u.emailVerified) {
        return false;
      }

      // Account Status Filter
      if (statusFilter === 'ACTIVE' && u.active === false) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && u.active !== false) {
        return false;
      }

      return true;
    });
  }, [users, roleFilter, verificationFilter, statusFilter]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, verificationFilter, statusFilter, pageSize]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    roleFilter !== 'ALL' ||
    verificationFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setVerificationFilter('ALL');
    setStatusFilter('ALL');
  };

  // Helper to check if a user is the currently logged-in admin
  const isSelf = (targetUser: any) => {
    if (!loggedInUser) return false;
    if (loggedInUser.id && targetUser.id && String(loggedInUser.id) === String(targetUser.id)) {
      return true;
    }
    if (
      loggedInUser.email &&
      targetUser.email &&
      loggedInUser.email.toLowerCase() === targetUser.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (user: any) => {
    if (isSelf(user) && user.active) {
      showToast('Security restriction: You cannot deactivate your own logged-in admin account.', 'error');
      return;
    }

    const nextStatus = !user.active;
    try {
      await updateAdminUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextStatus } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          activeUsers: stats.activeUsers + (nextStatus ? 1 : -1),
          inactiveUsers: stats.inactiveUsers + (nextStatus ? -1 : 1),
        });
      }
      showToast(`User "${user.name}" is now ${nextStatus ? 'Activated' : 'Deactivated'}.`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to update user status.';
      showToast(errMsg, 'error');
    }
  };

  // Open View User Modal
  const handleViewUser = async (userId: string) => {
    setViewingUserId(userId);
    setViewingDetails(null);
    setViewingLoading(true);
    try {
      const details = await getAdminUserDetails(userId);
      setViewingDetails(details);
    } catch (err) {
      console.error('Failed to load user details:', err);
      showToast('Could not load user details.', 'error');
      setViewingUserId(null);
    } finally {
      setViewingLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: (user.role || 'LEARNER').toUpperCase(),
      active: user.active !== false,
      emailVerified: Boolean(user.emailVerified),
    });
  };

  // Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (isSelf(editingUser)) {
      if (!editForm.active) {
        showToast('You cannot deactivate your own logged-in admin account.', 'error');
        return;
      }
      if (editForm.role !== 'ADMIN') {
        showToast('You cannot remove admin privileges from your own logged-in account.', 'error');
        return;
      }
    }

    setSavingEdit(true);
    try {
      await updateAdminUser(editingUser.id, editForm);
      showToast(`User details for "${editForm.name}" updated successfully.`);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to update user details.';
      showToast(errMsg, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete User Confirmation
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    if (isSelf(deleteTarget)) {
      showToast('Security restriction: You cannot delete your own logged-in admin account.', 'error');
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteOrDeactivateAdminUser(deleteTarget.id);
      showToast(res.message || `User "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to delete user.';
      showToast(errMsg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Users
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage learners, instructors, and administrators registered on the platform.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh user directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. 6 STATISTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Users</span>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-slate-900">
            {statsLoading ? '—' : stats?.totalUsers ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">All registered accounts</div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Users</span>
            <div className="p-1.5 bg-green-50 rounded-lg text-green-700">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-green-700">
            {statsLoading ? '—' : stats?.activeUsers ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Can login & learn</div>
        </div>

        {/* Verified Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Verified</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-emerald-700">
            {statsLoading ? '—' : stats?.verifiedUsers ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Email confirmed</div>
        </div>

        {/* Unverified Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Unverified</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-amber-700">
            {statsLoading ? '—' : stats?.unverifiedUsers ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Pending verification</div>
        </div>

        {/* Instructors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Instructors</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-blue-700">
            {statsLoading ? '—' : stats?.instructors ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Teaching faculty</div>
        </div>

        {/* Administrators */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Admins</span>
            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-700">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-purple-700">
            {statsLoading ? '—' : stats?.administrators ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Platform managers</div>
        </div>
      </div>

      {/* 3. SEARCH + FILTER TOOLBAR */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Roles</option>
            <option value="LEARNER">Learner</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYER">Employer</option>
          </select>

          {/* Email Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>

          {/* Account Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer shrink-0 self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* 4. USERS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {/* DESKTOP TABLE */}
          <table className="hidden md:table w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50 min-w-[200px]">User</th>
                <th className="px-4 py-3.5 bg-slate-50 min-w-[200px]">Email</th>
                <th className="px-4 py-3.5 bg-slate-50">Role</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Email Status</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Joined</th>
                <th className="px-4 py-3.5 bg-slate-50">Last Login</th>
                <th className="px-5 py-3.5 bg-slate-50 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                      <span className="text-sm font-medium">Loading user records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">No Users Found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveFilters
                          ? 'No registered users match your search or filter criteria. Try resetting filters.'
                          : 'No user accounts currently exist in the database.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const selfUser = isSelf(u);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* User Column (Profile image + name) */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={u.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 border border-green-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 group-hover:text-green-700 transition truncate max-w-[150px]">
                                {u.name || 'Unnamed User'}
                              </span>
                              {selfUser && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-green-100 text-green-800">
                                  You
                                </span>
                              )}
                            </div>
                            {u.phone && (
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono text-slate-600 truncate block max-w-[210px]" title={u.email}>
                          {u.email}
                        </span>
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'INSTRUCTOR'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : u.role === 'EMPLOYER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          {u.role === 'STUDENT' ? 'LEARNER' : u.role}
                        </span>
                      </td>

                      {/* Email Status Column */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <XCircle className="w-3 h-3 text-amber-500" />
                            <span>Unverified</span>
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={selfUser && u.active}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                            selfUser && u.active ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                          } ${
                            u.active !== false
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={
                            selfUser && u.active
                              ? 'Cannot deactivate your own logged-in admin account'
                              : 'Click to toggle status'
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active !== false ? 'bg-green-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{u.active !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Joined Date Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {(() => {
                          const formatted = formatDateTime(u.registrationDate || u.createdAt || u.created_at);
                          if (!formatted) return <span className="text-slate-400">—</span>;
                          return (
                            <div>
                              <div className="font-medium text-slate-800 leading-snug">{formatted.dateStr}</div>
                              <div className="text-[11px] text-slate-400 font-normal leading-tight">{formatted.timeStr}</div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Last Login Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">
                        {(() => {
                          const lastVal = u.lastLogin || u.last_login;
                          const formatted = formatDateTime(lastVal);
                          if (!formatted) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                                Never
                              </span>
                            );
                          }
                          return (
                            <div>
                              <div className="font-medium text-slate-800 leading-snug">{formatted.dateStr}</div>
                              <div className="text-[11px] text-slate-400 font-normal leading-tight">{formatted.timeStr}</div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => handleViewUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-green-700 hover:bg-green-50 transition cursor-pointer border border-transparent hover:border-green-200"
                            title="View Complete User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit user */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer border border-transparent hover:border-blue-200"
                            title="Edit User Information"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete user */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(u)}
                            disabled={selfUser}
                            className={`p-1.5 rounded-lg transition border border-transparent ${
                              selfUser
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 cursor-pointer'
                            }`}
                            title={
                              selfUser
                                ? 'Cannot delete your own admin account'
                                : 'Delete or Deactivate User'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* MOBILE RESPONSIVE CARDS VIEW */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading && users.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                <span className="text-sm">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm font-semibold">No users found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              paginatedUsers.map((u) => {
                const selfUser = isSelf(u);

                return (
                  <div key={u.id} className="p-4 space-y-3 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.profileImage ? (
                          <img
                            src={u.profileImage}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 border border-green-200 flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">
                              {u.name || 'Unnamed User'}
                            </h3>
                            {selfUser && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-green-100 text-green-800 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <span className="block font-mono text-xs text-slate-500 truncate mt-0.5">
                            {u.email}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'INSTRUCTOR'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Email Verification</span>
                        <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                          {u.emailVerified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-amber-500" /> Unverified
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Joined</span>
                        <span className="font-medium text-slate-800 mt-0.5 block">
                          {(() => {
                            const formatted = formatDateTime(u.registrationDate || u.createdAt || u.created_at);
                            return formatted ? `${formatted.dateStr} ${formatted.timeStr}` : '—';
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Last Login</span>
                        <span className="font-medium text-slate-800 mt-0.5 block">
                          {(() => {
                            const formatted = formatDateTime(u.lastLogin || u.last_login);
                            return formatted ? `${formatted.dateStr} ${formatted.timeStr}` : 'Never';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={selfUser && u.active}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          u.active !== false
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        ● {u.active !== false ? 'Active' : 'Inactive'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewUser(u.id)}
                          className="p-1.5 text-slate-600 hover:text-green-700 rounded-lg hover:bg-slate-100"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          disabled={selfUser}
                          className={`p-1.5 rounded-lg ${
                            selfUser
                              ? 'text-slate-300'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 5. PAGINATION FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="font-semibold text-slate-900">
                {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, filteredUsers.length)}
              </strong>{' '}
              of <strong className="font-semibold text-slate-900">{filteredUsers.length}</strong> users
            </span>

            {/* Page Size Selector */}
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              // Sliding window around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                    currentPage === pageNum
                      ? 'bg-green-600 text-white shadow-2xs'
                      : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. VIEW USER DETAILS MODAL */}
      {viewingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                  User Intelligence
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  User Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingUserId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {viewingLoading || !viewingDetails ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                  <span>Loading full account history...</span>
                </div>
              ) : (
                <>
                  {/* Profile Summary Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-4">
                      {viewingDetails.profile?.profileImage ? (
                        <img
                          src={viewingDetails.profile.profileImage}
                          alt={viewingDetails.profile.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-800 flex items-center justify-center font-bold text-xl border border-green-200">
                          {viewingDetails.profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {viewingDetails.profile?.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {viewingDetails.profile?.email}
                        </p>
                        {viewingDetails.profile?.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {viewingDetails.profile.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col sm:items-end gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                        {viewingDetails.profile?.role}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            viewingDetails.profile?.active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          ● {viewingDetails.profile?.active ? 'Active' : 'Inactive'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            viewingDetails.profile?.emailVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {viewingDetails.profile?.emailVerified ? '✓ Verified' : '○ Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Timestamps */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-[11px] text-slate-400 block">Registration Date</span>
                        <span className="font-semibold text-slate-800">
                          {viewingDetails.profile?.createdDate
                            ? new Date(viewingDetails.profile.createdDate).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-[11px] text-slate-400 block">Last Login</span>
                        <span className="font-semibold text-slate-800">
                          {viewingDetails.profile?.lastLogin
                            ? new Date(viewingDetails.profile.lastLogin).toLocaleString()
                            : 'Never recorded'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Learning Progress Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        Course Enrollments (
                        {viewingDetails.learning?.coursesEnrolled || 0})
                      </h4>
                      <span className="text-xs text-slate-500">
                        {viewingDetails.learning?.coursesCompleted || 0} completed •{' '}
                        {viewingDetails.learning?.overallProgress || 0}% overall progress
                      </span>
                    </div>

                    {(!viewingDetails.learning?.enrollments ||
                      viewingDetails.learning.enrollments.length === 0) ? (
                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        This user is not enrolled in any courses yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {viewingDetails.learning.enrollments.map((enr: any) => (
                          <div
                            key={enr.enrollmentId}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {enr.courseTitle}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                Enrolled: {new Date(enr.enrolledAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                <div
                                  className="bg-green-600 h-full rounded-full transition-all"
                                  style={{ width: `${enr.progress || 0}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 w-9 text-right">
                                {enr.progress || 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certificates */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Certificates Issued (
                      {viewingDetails.certificates?.length || 0})
                    </h4>

                    {(!viewingDetails.certificates ||
                      viewingDetails.certificates.length === 0) ? (
                      <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        No certificates earned yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewingDetails.certificates.map((cert: any) => (
                          <div
                            key={cert.certificateId}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 truncate">
                                {cert.course}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {cert.verificationCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payments */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Payment History (
                      {viewingDetails.payments?.length || 0})
                    </h4>

                    {(!viewingDetails.payments ||
                      viewingDetails.payments.length === 0) ? (
                      <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        No payments recorded for this account.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {viewingDetails.payments.map((p: any) => (
                          <div
                            key={p.paymentId}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{p.course}</p>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {p.paymentNumber} • {new Date(p.paymentDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-green-700">
                                ₹{Number(p.finalAmount || p.amount || 0).toLocaleString()}
                              </span>
                              <span className="block text-[10px] text-slate-400 uppercase">
                                {p.paymentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingUserId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                  Account Management
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Edit User: {editingUser.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update account details, role permissions, and active status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Platform Role
                </label>
                <select
                  value={editForm.role}
                  disabled={isSelf(editingUser)}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition ${
                    isSelf(editingUser) ? 'bg-slate-100 cursor-not-allowed opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <option value="LEARNER">LEARNER</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYER">EMPLOYER</option>
                </select>
                {isSelf(editingUser) && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    You cannot change the role of your own admin account.
                  </p>
                )}
              </div>

              {/* Account Status & Verification Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="block font-bold text-slate-900">Account Active</span>
                    <span className="block text-[11px] text-slate-500">
                      User can log in and access enrolled courses.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.active}
                    disabled={isSelf(editingUser)}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 accent-green-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="block font-bold text-slate-900">Email Verified</span>
                    <span className="block text-[11px] text-slate-500">
                      Manually mark this user's email address as verified.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.emailVerified}
                    onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 accent-green-600"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {savingEdit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. DELETE USER CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Delete User?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{deleteTarget.name}</strong>? This action
              may affect their enrollments, payments, courses, and certificates.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Note: If this user has active enrollment or financial payment records, their account will be safely deactivated to preserve database integrity.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteUser}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deleting ? 'Processing...' : 'Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
