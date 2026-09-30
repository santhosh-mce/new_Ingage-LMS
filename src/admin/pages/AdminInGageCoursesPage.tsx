"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  getAdminCourses,
  publishAdminCourse,
  unpublishAdminCourse,
  archiveAdminCourse,
  deleteAdminCourse,
} from '../../api/adminApi';
import { getAccessibleImageUrl } from '../../api/authApi';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  Clock,
  User,
  Users,
  Award,
  AlertCircle,
  TrendingUp,
  Tag,
  ExternalLink,
} from 'lucide-react';

export interface AdminInGageCoursesPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminInGageCoursesPage: React.FC<AdminInGageCoursesPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Delete modal state
  const [deleteModalCourse, setDeleteModalCourse] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load InGage courses', err);
      setError('Unable to load InGage courses from database.');
      if (onShowToast) onShowToast('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handlePublish = async (course: any) => {
    try {
      const res = await publishAdminCourse(course.id);
      if (res.success) {
        if (onShowToast) onShowToast(`"${course.title}" is now published.`);
        fetchCourses();
      } else {
        if (onShowToast) onShowToast(res.message || 'Failed to publish.');
      }
    } catch {
      if (onShowToast) onShowToast('Failed to publish course.');
    }
  };

  const handleUnpublish = async (course: any) => {
    try {
      const res = await unpublishAdminCourse(course.id);
      if (res.success) {
        if (onShowToast) onShowToast(`"${course.title}" is now unpublished.`);
        fetchCourses();
      } else {
        if (onShowToast) onShowToast(res.message || 'Failed to unpublish.');
      }
    } catch {
      if (onShowToast) onShowToast('Failed to unpublish course.');
    }
  };

  const handleArchive = async (course: any) => {
    if (!window.confirm(`Are you sure you want to archive "${course.title}"?`)) return;
    try {
      const res = await archiveAdminCourse(course.id);
      if (res.success) {
        if (onShowToast) onShowToast('Course archived.');
        fetchCourses();
      } else {
        if (onShowToast) onShowToast(res.message || 'Failed to archive.');
      }
    } catch {
      if (onShowToast) onShowToast('Failed to archive course.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalCourse) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminCourse(deleteModalCourse.id);
      if (onShowToast) onShowToast(res.message || 'Course deleted.');
      setDeleteModalCourse(null);
      fetchCourses();
    } catch {
      if (onShowToast) onShowToast('Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side Instant Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        const matchesInstructor = (c.instructor || '').toLowerCase().includes(q);
        const matchesDesc = (c.shortDescription || c.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesInstructor && !matchesDesc) return false;
      }
      if (categoryFilter !== 'ALL') {
        if ((c.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }
      if (levelFilter !== 'ALL') {
        if ((c.level || '').toLowerCase() !== levelFilter.toLowerCase()) return false;
      }
      if (statusFilter !== 'ALL') {
        const st = (c.status || (c.published ? 'PUBLISHED' : 'DRAFT')).toUpperCase();
        if (statusFilter === 'PUBLISHED' && !c.published && st !== 'PUBLISHED') return false;
        if (statusFilter === 'DRAFT' && (c.published || st !== 'DRAFT')) return false;
        if (statusFilter === 'ARCHIVED' && st !== 'ARCHIVED') return false;
      }
      return true;
    });
  }, [courses, searchQuery, categoryFilter, levelFilter, statusFilter]);

  // Extract unique categories for filter dropdown
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats);
  }, [courses]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-green-500/10 text-green-700">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              InGage Courses
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage InGage self-paced and flagship programs, pricing, status, and curriculum.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Courses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            id="admin-create-ingage-course-btn"
            onClick={() => onNavigate('/admin/courses/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-900">{error}</h3>
          <p className="text-sm text-red-700">Please check your network or database connection.</p>
          <button
            onClick={fetchCourses}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
              <div className="w-full h-44 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-7 bg-slate-100 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No InGage courses found.</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || levelFilter !== 'ALL'
                ? 'Try adjusting your search query or active filter tags.'
                : 'Get started by creating your first course on InGage LMS.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin/courses/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Course</span>
          </button>
        </div>
      )}

      {/* Card Grid (NO TABLE) */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isPublished = course.published || course.status === 'PUBLISHED';
            const isDraft = !isPublished && course.status !== 'ARCHIVED';
            const isArchived = course.status === 'ARCHIVED';

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-green-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Thumbnail Container */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={getAccessibleImageUrl(course.thumbnail)}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
                      <BookOpen className="w-10 h-10 text-slate-300 mb-1" />
                      <span className="text-xs font-medium text-slate-400">InGage LMS</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        isPublished
                          ? 'bg-emerald-600/90 text-white'
                          : isDraft
                          ? 'bg-slate-700/90 text-white'
                          : 'bg-amber-600/90 text-white'
                      }`}
                    >
                      {course.status || (isPublished ? 'PUBLISHED' : 'DRAFT')}
                    </span>
                  </div>

                  {/* Level Pill */}
                  {course.level && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                        {course.level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Category */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200/50 truncate max-w-[170px]">
                        {course.category || 'General'}
                      </span>
                      {course.duration && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-bold text-slate-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug"
                      title={course.title}
                    >
                      {course.title}
                    </h3>

                    {/* Instructor */}
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{course.instructor || 'InGage Instructor'}</span>
                    </p>
                  </div>

                  {/* Pricing & Learners Stats */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-slate-900">
                          {course.finalPrice === 0 || course.price === 0
                            ? 'Free'
                            : `₹${Number(course.finalPrice || course.price).toLocaleString()}`}
                        </span>
                        {course.discountType && course.price > (course.finalPrice || 0) && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{Number(course.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {course.discountType && (
                        <span className="text-[10px] text-green-700 font-semibold">
                          {course.discountType === 'PERCENTAGE'
                            ? `${course.discountValue}% OFF`
                            : `₹${course.discountValue} OFF`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{course.students || 0}</span>
                      <span className="text-[11px]">students</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {/* View Button */}
                    <button
                      onClick={() => onNavigate(`/courses/${course.id}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="View public course page"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onNavigate(`/admin/courses/${course.id}/analytics`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-green-50 text-slate-700 hover:text-green-700 text-xs font-semibold border border-slate-200 hover:border-green-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit course details & curriculum"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-green-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Publish / Unpublish Toggle */}
                    {isPublished ? (
                      <button
                        onClick={() => handleUnpublish(course)}
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Unpublish course"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(course)}
                        className="p-1.5 rounded-lg bg-white hover:bg-green-50 text-slate-500 hover:text-green-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Publish course"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </button>
                    )}

                    {/* Delete / Archive Button */}
                    <button
                      onClick={() => setDeleteModalCourse(course)}
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeleting && setDeleteModalCourse(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Course</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteModalCourse.title}"</span>?
                If students are enrolled, the course will be safely archived instead of removed permanently.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalCourse(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInGageCoursesPage;
