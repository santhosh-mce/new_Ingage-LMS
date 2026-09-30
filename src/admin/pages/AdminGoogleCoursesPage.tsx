"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  getAdminCredentialCourses,
  togglePublishCredentialCourse,
  deleteAdminCredentialCourse,
  CredentialCourseDto,
} from '../../api/credentialApi';
import { getAccessibleImageUrl } from '../../api/authApi';
import {
  Award,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  Star,
  Users,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface AdminGoogleCoursesPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminGoogleCoursesPage: React.FC<AdminGoogleCoursesPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [courses, setCourses] = useState<CredentialCourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  // Delete modal state
  const [deleteModalCourse, setDeleteModalCourse] = useState<CredentialCourseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGoogleCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCredentialCourses();
      // Only Google courses or credential courses associated with Google provider
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
    } catch (err: any) {
      console.error('Failed to load Google courses', err);
      // Fallback: direct fetch from /api/admin/credential-courses
      try {
        const res = await fetch('/api/admin/credential-courses');
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e2) {
        setError('Unable to load Google courses from database.');
        if (onShowToast) onShowToast('Failed to load Google courses.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleCourses();
  }, []);

  const handleTogglePublish = async (course: CredentialCourseDto) => {
    const nextStatus = !course.published;
    try {
      await togglePublishCredentialCourse(course.id);
      if (onShowToast) {
        onShowToast(`"${course.title}" ${nextStatus ? 'published' : 'hidden'}.`);
      }
      fetchGoogleCourses();
    } catch {
      if (onShowToast) onShowToast('Failed to update status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalCourse) return;
    setIsDeleting(true);
    try {
      await deleteAdminCredentialCourse(deleteModalCourse.id);
      if (onShowToast) onShowToast('Google course deleted.');
      setDeleteModalCourse(null);
      fetchGoogleCourses();
    } catch {
      if (onShowToast) onShowToast('Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Google Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Must be Google-related if multiple providers exist
      const isGoogle =
        (c.provider && c.provider.toLowerCase().includes('google')) ||
        (c.title && c.title.toLowerCase().includes('google')) ||
        (c.slug && c.slug.toLowerCase().includes('google'));

      if (!isGoogle && courses.some((x) => (x.provider || '').toLowerCase().includes('google'))) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        const matchesDesc = (c.shortDescription || c.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesDesc) return false;
      }
      if (levelFilter !== 'ALL') {
        if ((c.level || '').toLowerCase() !== levelFilter.toLowerCase()) return false;
      }
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PUBLISHED' && !c.published) return false;
        if (statusFilter === 'DRAFT' && c.published) return false;
      }
      return true;
    });
  }, [courses, searchQuery, levelFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Award className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Google Courses
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage official Google professional certificates, cloud engineering pathways, and credentials.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchGoogleCourses}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Google Courses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            id="admin-create-google-course-btn"
            onClick={() => onNavigate('/admin/credential-edge')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Google Course</span>
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
              placeholder="Search Google courses..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer transition"
          >
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
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
            onClick={fetchGoogleCourses}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Google courses found.</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery || statusFilter !== 'ALL' || levelFilter !== 'ALL'
                ? 'Try adjusting your search query or active filter tags.'
                : 'No Google credential courses exist in the system.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin/credential-edge')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Google Course</span>
          </button>
        </div>
      )}

      {/* Card Grid (NO TABLE) */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            const isPublished = course.published;
            const priceText = course.free || course.price === 0 || !course.price ? '₹0 / Free' : `₹${course.price}`;
            const modulesCount = course.modules?.length || 8;

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white p-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2">
                        <Award className="w-7 h-7 text-blue-300" />
                      </div>
                      <span className="text-xs font-bold tracking-wider text-blue-200">Google Career Certificate</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        isPublished ? 'bg-emerald-600/90 text-white' : 'bg-slate-700/90 text-white'
                      }`}
                    >
                      {isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>

                  {/* Google Brand Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Google</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Category & Level */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50 truncate max-w-[160px]">
                        {course.category || 'Google Career'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {course.level || 'Beginner'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug"
                      title={course.title}
                    >
                      {course.title}
                    </h3>

                    {/* Duration & Modules */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{course.duration || 'Approx. 6 months'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>{modulesCount} Modules</span>
                      </span>
                    </div>
                  </div>

                  {/* Rating, Price & Learners */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-normal block leading-none">Price</span>
                      <span className="text-base font-extrabold text-blue-700">
                        {priceText}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{course.rating || '4.8'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {course.learnersCount ? `${course.learnersCount.toLocaleString()} learners` : 'Google Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {/* View Button */}
                    <button
                      onClick={() => onNavigate(`/credential-edge/${course.slug}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="View credential course page"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => onNavigate('/admin/credential-edge')}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Edit in Credential Edge management"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Publish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(course)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                      title={isPublished ? 'Unpublish Google course' : 'Publish Google course'}
                    >
                      {isPublished ? (
                        <XCircle className="w-4 h-4 text-slate-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteModalCourse(course)}
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Delete Google course"
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
              <h3 className="text-lg font-bold text-slate-900">Delete Google Course</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteModalCourse.title}"</span>?
                This will remove the course and its credential modules.
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

export default AdminGoogleCoursesPage;
