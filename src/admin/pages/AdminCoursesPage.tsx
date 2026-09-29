"use client";
import React, { useState, useEffect } from 'react';
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
  BarChart2,
  Eye,
  RefreshCw,
} from 'lucide-react';

export interface AdminCoursesPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminCoursesPage: React.FC<AdminCoursesPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await getAdminCourses(searchQuery, statusFilter, categoryFilter);
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses', err);
      if (onShowToast) onShowToast('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchQuery, statusFilter, categoryFilter]);

  const handlePublish = async (course: any) => {
    try {
      const res = await publishAdminCourse(course.id);
      if (res.success) {
        if (onShowToast) onShowToast('Course published to public catalog.');
        fetchCourses();
      } else {
        if (onShowToast) onShowToast(res.message || 'Failed to publish.');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Publish validation failed.';
      if (onShowToast) onShowToast(errMsg);
    }
  };

  const handleUnpublish = async (course: any) => {
    try {
      const res = await unpublishAdminCourse(course.id);
      if (res.success) {
        if (onShowToast) onShowToast('Course hidden from public catalog.');
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

  const handleDelete = async (course: any) => {
    const confirmed = window.confirm(
      `Delete course "${course.title}"?\n\nIf students are already enrolled, the course will be safely archived instead of removed.`
    );
    if (!confirmed) return;

    try {
      const res = await deleteAdminCourse(course.id);
      if (onShowToast) onShowToast(res.message || 'Course deleted.');
      fetchCourses();
    } catch {
      if (onShowToast) onShowToast('Failed to delete course.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Course Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, publish, edit pricing, manage curriculum, and monitor learner enrollments.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchCourses}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh Courses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            id="admin-create-course-btn"
            onClick={() => onNavigate('/admin/courses/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Course</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
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

          {/* Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Backend Development">Backend Development</option>
            <option value="Frontend Development">Frontend Development</option>
            <option value="Data & Analytics">Data & Analytics</option>
            <option value="Cloud & DevOps">Cloud & DevOps</option>
            <option value="Software Development">Software Development</option>
            <option value="Design & UI/UX">Design & UI/UX</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {['ALL', 'PUBLISHED', 'DRAFT', 'UNPUBLISHED', 'ARCHIVED'].map((st) => (
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

      {/* Courses Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Scrollable table container with defined max-height, vertical and horizontal overflow */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-xs text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Course</th>
                <th className="px-4 py-3.5 bg-slate-50">Category</th>
                <th className="px-4 py-3.5 bg-slate-50">Instructor</th>
                <th className="px-4 py-3.5 bg-slate-50">Price</th>
                <th className="px-4 py-3.5 bg-slate-50">Final Price</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 text-center bg-slate-50">Students</th>
                <th className="px-4 py-3.5 bg-slate-50">Completion Rate</th>
                <th className="px-4 py-3.5 bg-slate-50">Revenue</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && courses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No courses found matching selected filters.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 max-w-[200px]">
                      <div className="flex items-center gap-2.5">
                        {c.thumbnail ? (
                          <img
                            src={getAccessibleImageUrl(c.thumbnail)}
                            alt=""
                            className="w-10 h-7 object-cover rounded-md shrink-0 bg-slate-100 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-7 bg-slate-100 rounded-md shrink-0 flex items-center justify-center text-slate-400 border border-slate-200">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        <span className="truncate">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">{c.category || 'General'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700 font-normal truncate max-w-[140px]">
                      {c.instructor || 'InGage Instructor'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {c.price === 0 ? (
                        <span className="text-green-700 font-semibold">Free</span>
                      ) : (
                        `₹${c.price}`
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">
                      {c.finalPrice === 0 ? (
                        <span className="text-green-700 font-semibold">Free</span>
                      ) : (
                        `₹${c.finalPrice}`
                      )}
                      {c.discountType && (
                        <span className="ml-1 text-xs text-green-700 font-normal">
                          ({c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          c.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : c.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : c.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-900">
                      {c.students || 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-green-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, c.completionRate || 0)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{c.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-green-700">
                      ₹{Number(c.revenue || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* View */}
                      <button
                        onClick={() => onNavigate(`/courses/${c.id}`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-50 text-slate-600 hover:text-green-700 transition-colors cursor-pointer"
                        title="View Course Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Analytics */}
                      <button
                        onClick={() => onNavigate(`/admin/courses/${c.id}/analytics`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-50 text-slate-600 hover:text-green-700 transition-colors cursor-pointer"
                        title="Course Analytics"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onNavigate(`/admin/courses/${c.id}/edit`)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-50 text-slate-600 hover:text-green-700 transition-colors cursor-pointer"
                        title="Edit Course & Content"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Publish / Unpublish */}
                      {c.status === 'PUBLISHED' ? (
                        <button
                          onClick={() => handleUnpublish(c)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer border border-amber-200/60"
                          title="Unpublish Course"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublish(c)}
                          className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors cursor-pointer border border-green-200/60"
                          title="Validate & Publish"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Archive */}
                      {c.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Archive Course"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Count */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>
            Total: <strong className="font-semibold text-slate-800">{courses.length}</strong> course{courses.length === 1 ? '' : 's'}
          </span>
          </div>
      </div>
    </div>
  );
};

export default AdminCoursesPage;
