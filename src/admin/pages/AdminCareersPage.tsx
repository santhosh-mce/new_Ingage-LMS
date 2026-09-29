"use client";
import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  BookOpen,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Layers3,
  ExternalLink,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  assignCourseToCareer,
  createAdminCareer,
  deleteAdminCareer,
  getAdminCareers,
  getAdminCourses,
  removeCourseFromCareer,
  toggleCareerPublish,
  toggleCareerStatus,
  updateAdminCareer,
} from '../../api/adminApi';

interface Course {
  id: number;
  title: string;
  category?: string;
  level?: string;
  price?: number;
  finalPrice?: number;
  duration?: string;
}

interface AssignedCourse extends Course {
  included?: boolean;
  requiredForCompletion?: boolean;
}

interface Career {
  id: number;
  title: string;
  slug: string;
  category?: string;
  level?: string;
  duration?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  avgSalary?: string;
  jobOpenings?: string;
  description?: string;
  featured?: boolean;
  popular?: boolean;
  active?: boolean;
  published?: boolean;
  assignedCoursesCount?: number;
  assignedCourses?: AssignedCourse[];
}

interface CareerForm {
  title: string;
  slug: string;
  category: string;
  level: string;
  duration: string;
  salaryMin: number;
  salaryMax: number;
  jobOpenings: string;
  description: string;
  featured: boolean;
  popular: boolean;
  active: boolean;
  published: boolean;
}

interface AdminCareersPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

const emptyForm: CareerForm = {
  title: '',
  slug: '',
  category: 'Data & AI',
  level: 'Beginner to Advanced',
  duration: '6 Months',
  salaryMin: 600000,
  salaryMax: 1200000,
  jobOpenings: '15,000+',
  description: '',
  featured: false,
  popular: false,
  active: true,
  published: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const formatMoney = (value?: number) => {
  if (value == null) return 'Price unavailable';
  return `₹${value.toLocaleString('en-IN')}`;
};

const formatSalary = (career: Career) => {
  if (
    career.salaryMin != null &&
    career.salaryMax != null &&
    career.salaryMin > 0 &&
    career.salaryMax > 0
  ) {
    const minL = (career.salaryMin / 100000).toFixed(career.salaryMin % 100000 === 0 ? 0 : 1);
    const maxL = (career.salaryMax / 100000).toFixed(career.salaryMax % 100000 === 0 ? 0 : 1);
    return `₹${minL}–${maxL} LPA`;
  }
  if (career.avgSalary && career.avgSalary.trim()) {
    return career.avgSalary;
  }
  if (career.salaryMin != null && career.salaryMin > 0) {
    return `₹${(career.salaryMin / 100000).toFixed(1)} LPA`;
  }
  return 'Competitive';
};

export const AdminCareersPage: React.FC<AdminCareersPageProps> = ({
  onNavigate: _onNavigate,
  onShowToast,
}) => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED'>('ALL');

  // Modals & Drawers
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CareerForm>(emptyForm);
  const [draftCourses, setDraftCourses] = useState<AssignedCourse[]>([]);
  const [isFormPickerOpen, setIsFormPickerOpen] = useState(false);

  // Manage Courses Drawer / Modal
  const [manageCareer, setManageCareer] = useState<Career | null>(null);
  const [isManagePickerOpen, setIsManagePickerOpen] = useState(false);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState<Course | null>(null);
  const [assignIncluded, setAssignIncluded] = useState(true);
  const [assignRequired, setAssignRequired] = useState(true);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<Career | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Local Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (onShowToast) onShowToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [careerData, courseData] = await Promise.all([
        getAdminCareers(),
        getAdminCourses(),
      ]);
      setCareers(Array.isArray(careerData) ? careerData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (err) {
      console.error('Failed to load career data:', err);
      showToast('Unable to load career paths. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamic Categories from active data
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    careers.forEach((c) => {
      if (c.category && c.category.trim()) set.add(c.category.trim());
    });
    return Array.from(set).sort();
  }, [careers]);

  // Filtered Careers
  const filteredCareers = useMemo(() => {
    return careers.filter((career) => {
      // Search by title, slug, category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (career.title || '').toLowerCase().includes(q);
        const slugMatch = (career.slug || '').toLowerCase().includes(q);
        const catMatch = (career.category || '').toLowerCase().includes(q);
        if (!titleMatch && !slugMatch && !catMatch) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && career.category !== categoryFilter) {
        return false;
      }

      // Status filter (Active / Inactive)
      if (statusFilter === 'ACTIVE' && career.active === false) return false;
      if (statusFilter === 'INACTIVE' && career.active !== false) return false;

      // Visibility filter (Published / Unpublished)
      if (visibilityFilter === 'PUBLISHED' && career.published === false) return false;
      if (visibilityFilter === 'UNPUBLISHED' && career.published !== false) return false;

      return true;
    });
  }, [careers, searchQuery, categoryFilter, statusFilter, visibilityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = careers.length;
    const published = careers.filter((c) => c.published !== false).length;
    const active = careers.filter((c) => c.active !== false).length;
    const assignedCourses = careers.reduce((sum, c) => {
      const count = c.assignedCoursesCount ?? c.assignedCourses?.length ?? 0;
      return sum + count;
    }, 0);
    return { total, published, active, assignedCourses };
  }, [careers]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    visibilityFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
  };

  // Toggle Publish
  const handleTogglePublish = async (career: Career, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !(career.published !== false);
    setTogglingId(career.id);
    try {
      await toggleCareerPublish(career.id, nextVal);
      setCareers((prev) =>
        prev.map((c) => (c.id === career.id ? { ...c, published: nextVal } : c))
      );
      showToast(nextVal ? `Published "${career.title}"` : `Unpublished "${career.title}"`);
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      showToast('Failed to update visibility status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Active
  const handleToggleActive = async (career: Career, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !(career.active !== false);
    setTogglingId(career.id);
    try {
      await toggleCareerStatus(career.id, nextVal);
      setCareers((prev) =>
        prev.map((c) => (c.id === career.id ? { ...c, active: nextVal } : c))
      );
      showToast(nextVal ? `Activated "${career.title}"` : `Deactivated "${career.title}"`);
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      showToast('Failed to update active status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Create Career Modal
  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDraftCourses([]);
    setIsFormPickerOpen(false);
    setFormOpen(true);
  };

  // Open Edit Career Modal
  const openEditModal = (career: Career) => {
    setEditingId(career.id);
    setForm({
      title: career.title || '',
      slug: career.slug || '',
      category: career.category || 'Data & AI',
      level: career.level || 'Beginner to Advanced',
      duration: career.duration || '6 Months',
      salaryMin: career.salaryMin ?? 600000,
      salaryMax: career.salaryMax ?? 1200000,
      jobOpenings: career.jobOpenings || '10,000+',
      description: career.description || '',
      featured: Boolean(career.featured),
      popular: Boolean(career.popular),
      active: career.active !== false,
      published: career.published !== false,
    });
    // Populate draft courses
    const assigned = (career.assignedCourses || []).map((c) => ({
      ...c,
      included: c.included !== false,
      requiredForCompletion: c.requiredForCompletion !== false,
    }));
    setDraftCourses(assigned);
    setIsFormPickerOpen(false);
    setFormOpen(true);
  };

  // Save Career (Create or Edit) with Curriculum Sequencing
  const handleSaveCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Career title is required.', 'error');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.title);

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...form,
        slug: finalSlug,
      };

      let careerId: number;
      if (editingId) {
        await updateAdminCareer(editingId, payload);
        careerId = editingId;
      } else {
        const created = await createAdminCareer(payload);
        careerId = Number(created.id);
      }

      if (!careerId) throw new Error('Missing career ID after saving');

      // Reconcile Courses
      const originalCareer = editingId ? careers.find((c) => c.id === editingId) : null;
      const originalCourses = originalCareer?.assignedCourses || [];

      // 1. Remove courses that were removed from draft
      for (const orig of originalCourses) {
        if (!draftCourses.some((d) => d.id === orig.id)) {
          try {
            await removeCourseFromCareer(careerId, orig.id);
          } catch (remErr) {
            console.warn(`Failed to remove course ${orig.id}:`, remErr);
          }
        }
      }

      // 2. Assign / Update selected courses
      const failedAssignments: string[] = [];
      for (let i = 0; i < draftCourses.length; i++) {
        const course = draftCourses[i];
        try {
          await assignCourseToCareer(careerId, course.id, {
            sequenceOrder: i + 1,
            included: course.included !== false,
            requiredForCompletion: course.requiredForCompletion !== false,
          });
        } catch (assignErr) {
          console.warn(`Failed to assign course ${course.id}:`, assignErr);
          failedAssignments.push(course.title);
        }
      }

      await fetchData();
      setFormOpen(false);

      if (failedAssignments.length > 0) {
        showToast(
          `Career saved, but course assignments failed for: ${failedAssignments.join(', ')}`,
          'error'
        );
      } else {
        showToast(editingId ? 'Career path updated successfully.' : 'Career path created successfully.');
      }
    } catch (err) {
      console.error('Failed to save career:', err);
      showToast('Failed to save career path details. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Career
  const handleDeleteCareer = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminCareer(deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
      showToast(`Career path "${deleteTarget.title}" deleted.`);
    } catch (err) {
      console.error('Failed to delete career:', err);
      showToast('Failed to delete career path. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Manage Courses Actions
  const handleOpenManageCourses = (career: Career) => {
    setManageCareer(career);
    setIsManagePickerOpen(false);
    setSelectedCourseToAssign(null);
    setAssignIncluded(true);
    setAssignRequired(true);
  };

  const handleAssignCourseToManage = async () => {
    if (!manageCareer || !selectedCourseToAssign) return;
    setAssigningLoading(true);
    try {
      await assignCourseToCareer(manageCareer.id, selectedCourseToAssign.id, {
        included: assignIncluded,
        requiredForCompletion: assignRequired,
      });

      const updatedCourse: AssignedCourse = {
        ...selectedCourseToAssign,
        included: assignIncluded,
        requiredForCompletion: assignRequired,
      };

      setManageCareer((prev) => {
        if (!prev) return null;
        const existing = prev.assignedCourses || [];
        return {
          ...prev,
          assignedCourses: [...existing, updatedCourse],
          assignedCoursesCount: (prev.assignedCoursesCount ?? existing.length) + 1,
        };
      });

      await fetchData();
      setSelectedCourseToAssign(null);
      setIsManagePickerOpen(false);
      showToast(`Assigned "${selectedCourseToAssign.title}" to ${manageCareer.title}`);
    } catch (err) {
      console.error('Failed to assign course:', err);
      showToast('Failed to assign course to career.', 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleRemoveCourseFromManage = async (courseId: number, courseTitle: string) => {
    if (!manageCareer) return;
    try {
      await removeCourseFromCareer(manageCareer.id, courseId);
      setManageCareer((prev) => {
        if (!prev) return null;
        const filtered = (prev.assignedCourses || []).filter((c) => c.id !== courseId);
        return {
          ...prev,
          assignedCourses: filtered,
          assignedCoursesCount: Math.max(0, (prev.assignedCoursesCount ?? 1) - 1),
        };
      });
      await fetchData();
      showToast(`Removed "${courseTitle}" from career path.`);
    } catch (err) {
      console.error('Failed to remove course:', err);
      showToast('Failed to remove course from career.', 'error');
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

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-green-600" />
            Career Paths
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage career paths, career visibility, and the courses included in each learning roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh career paths"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            id="admin-add-career-btn"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Career Path</span>
          </button>
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Careers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Careers</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-500">Live career roadmaps</div>
        </div>

        {/* Published */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Published</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">{stats.published}</div>
          <div className="mt-1 text-xs text-slate-500">Visible in public catalog</div>
        </div>

        {/* Active */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active</span>
            <div className="p-2 bg-green-50 rounded-xl text-green-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-green-700">{stats.active}</div>
          <div className="mt-1 text-xs text-slate-500">Accepting enrollments</div>
        </div>

        {/* Assigned Courses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Assigned Courses</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-700">
              <Layers3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-indigo-700">{stats.assignedCourses}</div>
          <div className="mt-1 text-xs text-slate-500">Curriculum courses linked</div>
        </div>
      </div>

      {/* SEARCH + FILTER TOOLBAR */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search career paths..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
            />
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Categories</option>
            {dynamicCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer transition"
          >
            <option value="ALL">All Visibility</option>
            <option value="PUBLISHED">Published</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* CAREER TABLE (RESPONSIVE TABLE / MOBILE CARDS) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        {/* Scrollable table container */}
        <div className="overflow-x-auto">
          {/* DESKTOP & TABLET TABLE */}
          <table className="hidden md:table w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-xs text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50 min-w-[260px]">Career Path</th>
                <th className="px-4 py-3.5 bg-slate-50">Category</th>
                <th className="px-4 py-3.5 bg-slate-50">Level</th>
                <th className="px-4 py-3.5 bg-slate-50 min-w-[170px]">Courses</th>
                <th className="px-4 py-3.5 bg-slate-50">Salary</th>
                <th className="px-4 py-3.5 bg-slate-50">Duration</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Status</th>
                <th className="px-4 py-3.5 bg-slate-50 text-center">Visibility</th>
                <th className="px-5 py-3.5 bg-slate-50 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && careers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                      <span className="text-sm font-medium">Loading career paths...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCareers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">No Career Paths Found</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {hasActiveFilters
                          ? 'No career paths match your search or filter criteria. Try resetting filters.'
                          : 'Get started by creating your first career learning roadmap.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          onClick={openCreateModal}
                          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition"
                        >
                          + Add Career Path
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCareers.map((career) => {
                  const assignedCount =
                    career.assignedCoursesCount ?? career.assignedCourses?.length ?? 0;
                  const assignedList = career.assignedCourses || [];
                  const previewCourses = assignedList.slice(0, 2);
                  const extraCount = Math.max(0, assignedCount - previewCourses.length);

                  return (
                    <tr
                      key={career.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Career Path Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-200/50 mt-0.5">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 group-hover:text-green-700 transition">
                                {career.title}
                              </span>
                              {career.featured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Sparkles className="w-2.5 h-2.5" /> Featured
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              /roles/{career.slug}
                            </div>
                            {career.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-1">
                                {career.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-slate-100 border border-slate-700">
                          {career.category || 'General'}
                        </span>
                      </td>

                      {/* Level Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-700">
                          {career.level || 'All Levels'}
                        </span>
                      </td>

                      {/* Courses Column */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenManageCourses(career)}
                          className="text-left group/courses cursor-pointer"
                          title="Click to manage courses"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 group-hover/courses:text-green-800">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {assignedCount} {assignedCount === 1 ? 'Course' : 'Courses'}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              (Manage)
                            </span>
                          </div>
                          {previewCourses.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {previewCourses.map((c) => (
                                <div
                                  key={c.id}
                                  className="text-[11px] text-slate-500 truncate max-w-[190px]"
                                  title={c.title}
                                >
                                  • {c.title}
                                </div>
                              ))}
                              {extraCount > 0 && (
                                <span className="inline-block text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  +{extraCount} more
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Salary Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700">
                        {formatSalary(career)}
                      </td>

                      {/* Duration Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        {career.duration || 'Flexible'}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(career, e)}
                          disabled={togglingId === career.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                            career.active !== false
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle Active status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              career.active !== false ? 'bg-green-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{career.active !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Visibility Column */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleTogglePublish(career, e)}
                          disabled={togglingId === career.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                            career.published !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to toggle Published visibility"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              career.published !== false
                                ? 'bg-emerald-600'
                                : 'border border-amber-600 bg-white'
                            }`}
                          />
                          <span>
                            {career.published !== false ? 'Published' : 'Unpublished'}
                          </span>
                        </button>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(career)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-green-700 hover:bg-green-50 transition cursor-pointer border border-transparent hover:border-green-200"
                            title="Edit Career Path"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenManageCourses(career)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer border border-transparent hover:border-indigo-200"
                            title="Manage Courses"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(career)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Delete Career Path"
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

          {/* MOBILE RESPONSIVE LIST / CARD VIEW */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading && careers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                <span className="text-sm">Loading career paths...</span>
              </div>
            ) : filteredCareers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm font-semibold">No career paths found</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredCareers.map((career) => {
                const assignedCount =
                  career.assignedCoursesCount ?? career.assignedCourses?.length ?? 0;

                return (
                  <div key={career.id} className="p-4 space-y-3 hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-slate-900 truncate">
                            {career.title}
                          </h3>
                          {career.featured && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                        <span className="block font-mono text-xs text-slate-400 truncate mt-0.5">
                          /roles/{career.slug}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-100 border border-slate-700 shrink-0">
                        {career.category || 'General'}
                      </span>
                    </div>

                    {career.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {career.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Level</span>
                        <span className="font-medium text-slate-800">{career.level || 'All'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Duration</span>
                        <span className="font-medium text-slate-800">{career.duration || 'Flexible'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Salary</span>
                        <span className="font-medium text-slate-800">{formatSalary(career)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Courses</span>
                        <button
                          type="button"
                          onClick={() => handleOpenManageCourses(career)}
                          className="font-semibold text-green-700 underline text-xs"
                        >
                          {assignedCount} Courses
                        </button>
                      </div>
                    </div>

                    {/* Status & Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(career)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            career.active !== false
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          ● {career.active !== false ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePublish(career)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            career.published !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {career.published !== false ? '● Published' : '○ Unpublished'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(career)}
                          className="p-1.5 text-slate-600 hover:text-green-700 rounded-lg hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenManageCourses(career)}
                          className="p-1.5 text-slate-600 hover:text-indigo-700 rounded-lg hover:bg-slate-100"
                          title="Courses"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(career)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 rounded-lg hover:bg-slate-100"
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
      </div>

      {/* MANAGE CAREER COURSES MODAL / DRAWER */}
      {manageCareer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                  Career Curriculum
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Manage Career Courses
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-slate-800">
                    {manageCareer.title}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    /roles/{manageCareer.slug}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageCareer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Assigned Courses List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Assigned Courses</h3>
                    <p className="text-xs text-slate-500">
                      Courses currently linked to this career roadmap.
                    </p>
                  </div>
                  {!isManagePickerOpen && (
                    <button
                      type="button"
                      onClick={() => setIsManagePickerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Assign Course</span>
                    </button>
                  )}
                </div>

                {/* Course Picker Dropdown/Selector within Manage Modal */}
                {isManagePickerOpen && (
                  <div className="mb-4 p-4 bg-slate-50 border border-green-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-green-600" />
                        Select a Course to Assign
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManagePickerOpen(false);
                          setSelectedCourseToAssign(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>

                    <CourseSearchSelector
                      courses={courses}
                      excludedIds={(manageCareer.assignedCourses || []).map((c) => c.id)}
                      onSelect={(course) => setSelectedCourseToAssign(course)}
                      selectedCourse={selectedCourseToAssign}
                    />

                    {selectedCourseToAssign && (
                      <div className="pt-2 border-t border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={assignIncluded}
                              onChange={(e) => setAssignIncluded(e.target.checked)}
                              className="w-4 h-4 rounded text-green-600 focus:ring-green-500 accent-green-600"
                            />
                            <span>Included in Career Path</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={assignRequired}
                              onChange={(e) => setAssignRequired(e.target.checked)}
                              className="w-4 h-4 rounded text-green-600 focus:ring-green-500 accent-green-600"
                            />
                            <span>Required for Career Completion</span>
                          </label>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCourseToAssign(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Change Selection
                          </button>
                          <button
                            type="button"
                            disabled={assigningLoading}
                            onClick={handleAssignCourseToManage}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                          >
                            {assigningLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Assign Course</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned Courses Rows */}
                {(!manageCareer.assignedCourses || manageCareer.assignedCourses.length === 0) ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs">
                    No courses are assigned to this career path yet. Click "+ Assign Course" above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manageCareer.assignedCourses.map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-400 w-6">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {c.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span>{formatMoney(c.price ?? c.finalPrice)}</span>
                              <span>•</span>
                              <span>{c.level || c.category || 'Standard'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {c.included !== false && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Included
                            </span>
                          )}
                          {c.requiredForCompletion !== false && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Required
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveCourseFromManage(c.id, c.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setManageCareer(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CAREER MODAL (WITH CURRICULUM COURSE SELECTOR) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveCareer}
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                  {editingId ? 'Edit Configuration' : 'New Career Roadmap'}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {editingId ? 'Edit Career Path' : 'Add Career Path'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define career metadata, visibility switches, and course roadmap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-700">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="font-bold text-slate-900">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Career Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Career Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          title: newTitle,
                          ...(editingId ? {} : { slug: slugify(newTitle) }),
                        }));
                      }}
                      placeholder="e.g. Data Scientist"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slug <span className="text-slate-400 font-normal">(/roles/{form.slug || 'slug'})</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                      }
                      placeholder="data-scientist"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="e.g. Data & AI"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Level
                    </label>
                    <select
                      value={form.level}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, level: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition cursor-pointer"
                    >
                      <option value="Beginner to Advanced">Beginner to Advanced</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Summary of this career roadmap, responsibilities, and outcomes..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CAREER DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900">Career Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      placeholder="e.g. 6 Months"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Min Salary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Minimum Salary (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={form.salaryMin}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salaryMin: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Max Salary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maximum Salary (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={form.salaryMax}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salaryMax: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>

                  {/* Job Openings */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Openings
                    </label>
                    <input
                      type="text"
                      value={form.jobOpenings}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, jobOpenings: e.target.value }))
                      }
                      placeholder="e.g. 15,000+"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: VISIBILITY TOGGLES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900">Visibility & Enrollment</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Published */}
                  <ToggleSwitch
                    title="Published"
                    description="Visible in public career catalog and explore pages."
                    checked={form.published}
                    onChange={(val) => setForm((p) => ({ ...p, published: val }))}
                  />

                  {/* Active */}
                  <ToggleSwitch
                    title="Active"
                    description="Accepting new student enrollments."
                    checked={form.active}
                    onChange={(val) => setForm((p) => ({ ...p, active: val }))}
                  />

                  {/* Featured */}
                  <ToggleSwitch
                    title="Featured"
                    description="Show in top featured badges and carousels."
                    checked={form.featured}
                    onChange={(val) => setForm((p) => ({ ...p, featured: val }))}
                  />

                  {/* Popular */}
                  <ToggleSwitch
                    title="Popular"
                    description="Mark as popular choice for learners."
                    checked={form.popular}
                    onChange={(val) => setForm((p) => ({ ...p, popular: val }))}
                  />
                </div>
              </div>

              {/* SECTION 4: CAREER CURRICULUM (ADD COURSES DURING CREATION) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">Career Curriculum</h3>
                      <p className="text-xs text-slate-500">
                        Choose courses for this career roadmap.
                      </p>
                    </div>
                  </div>

                  {!isFormPickerOpen && (
                    <button
                      type="button"
                      onClick={() => setIsFormPickerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Course</span>
                    </button>
                  )}
                </div>

                {/* Form Course Picker */}
                {isFormPickerOpen && (
                  <div className="p-4 bg-slate-50 border border-green-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-green-600" />
                        Search courses to add to roadmap
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFormPickerOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                      >
                        Close
                      </button>
                    </div>

                    <CourseSearchSelector
                      courses={courses}
                      excludedIds={draftCourses.map((c) => c.id)}
                      onSelect={(course) => {
                        setDraftCourses((prev) => [
                          ...prev,
                          {
                            ...course,
                            included: true,
                            requiredForCompletion: true,
                          },
                        ]);
                        setIsFormPickerOpen(false);
                      }}
                    />
                  </div>
                )}

                {/* Selected Courses List */}
                {draftCourses.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs">
                    No courses selected yet. Click "+ Add Course" to attach learning modules.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {draftCourses.map((course, idx) => (
                      <div
                        key={course.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-400 w-5 mt-0.5">
                            {idx + 1}.
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {course.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {formatMoney(course.price ?? course.finalPrice)} •{' '}
                              {course.level || course.category || 'Module'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={course.included !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setDraftCourses((prev) =>
                                  prev.map((item) =>
                                    item.id === course.id
                                      ? { ...item, included: checked }
                                      : item
                                  )
                                );
                              }}
                              className="w-3.5 h-3.5 rounded text-green-600 accent-green-600"
                            />
                            <span>Included</span>
                          </label>

                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={course.requiredForCompletion !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setDraftCourses((prev) =>
                                  prev.map((item) =>
                                    item.id === course.id
                                      ? { ...item, requiredForCompletion: checked }
                                      : item
                                  )
                                );
                              }}
                              className="w-3.5 h-3.5 rounded text-green-600 accent-green-600"
                            />
                            <span>Required</span>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setDraftCourses((prev) =>
                                prev.filter((item) => item.id !== course.id)
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove from roadmap"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : editingId ? 'Update Career' : 'Create Career Path'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Delete Career Path?</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-800">{deleteTarget.title}</strong>? Course
              records will not be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCareer}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{deleting ? 'Deleting...' : 'Delete Career'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Clean Toggle Card / Switch Component
function ToggleSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition cursor-pointer ${
        checked
          ? 'bg-green-50/50 border-green-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        <span className="block text-xs font-bold text-slate-900">{title}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{description}</span>
      </div>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform mt-[3px] ${
            checked ? 'translate-x-4 ml-0.5' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

// Searchable Course Selector for adding/assigning courses
function CourseSearchSelector({
  courses,
  excludedIds,
  onSelect,
  selectedCourse,
}: {
  courses: Course[];
  excludedIds: number[];
  onSelect: (course: Course) => void;
  selectedCourse?: Course | null;
}) {
  const [query, setQuery] = useState('');

  const available = useMemo(() => {
    return courses
      .filter((c) => !excludedIds.includes(c.id))
      .filter((c) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          (c.title || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q)
        );
      });
  }, [courses, excludedIds, query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses by title or category..."
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
        {available.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            {courses.length === 0
              ? 'No courses available in catalog.'
              : 'No unassigned courses match your search.'}
          </div>
        ) : (
          available.map((c) => {
            const isSelected = selectedCourse?.id === c.id;
            return (
              <div
                key={c.id}
                className={`pt-1.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-lg transition ${
                  isSelected ? 'bg-green-100/70 border border-green-300' : 'hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-semibold text-slate-900 truncate">
                    {c.title}
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    {formatMoney(c.price ?? c.finalPrice)} •{' '}
                    {c.category || 'General'} • {c.level || 'All levels'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                    isSelected
                      ? 'bg-green-700 text-white'
                      : 'bg-white hover:bg-green-50 text-green-700 border border-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminCareersPage;
