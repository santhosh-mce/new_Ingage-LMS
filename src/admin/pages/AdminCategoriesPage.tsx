"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryStatus,
  deleteAdminCategory,
  AdminCategoryItem,
} from '../../api/adminApi';
import {
  FolderTree,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  X,
  Layers,
  Calendar,
  BookOpen,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface AdminCategoriesPageProps {
  onNavigate?: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminCategoriesPage: React.FC<AdminCategoriesPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal states
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    active: true,
    displayOrder: 1,
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getAdminCategories(searchQuery, statusFilter);
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories', err);
      if (onShowToast) onShowToast('Failed to load categories from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchQuery, statusFilter]);

  // Helper to slugify
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.displayOrder || 0)) + 1 : 1;
    setFormData({
      name: '',
      slug: '',
      description: '',
      active: true,
      displayOrder: nextOrder,
    });
    setSlugManuallyEdited(false);
    setFormError(null);
    setEditingCategory(null);
    setModalMode('ADD');
  };

  // Open Edit Modal
  const handleOpenEdit = (category: AdminCategoryItem) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      active: category.active,
      displayOrder: category.displayOrder || 1,
    });
    setSlugManuallyEdited(true); // Don't auto-overwrite existing slug unless user wants to
    setFormError(null);
    setModalMode('EDIT');
  };

  const handleNameChange = (newName: string) => {
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: !slugManuallyEdited ? generateSlug(newName) : prev.slug,
    }));
  };

  const handleSlugChange = (newSlug: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: newSlug.toLowerCase().trim().replace(/\s+/g, '-'),
    }));
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const finalSlug = (formData.slug.trim() || generateSlug(trimmedName));

    if (!trimmedName) {
      setFormError('Category name is required.');
      return;
    }

    if (!finalSlug) {
      setFormError('Category slug is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'ADD') {
        await createAdminCategory({
          name: trimmedName,
          slug: finalSlug,
          description: formData.description.trim(),
          active: formData.active,
          displayOrder: formData.displayOrder,
        });
        if (onShowToast) onShowToast(`Category "${trimmedName}" created successfully.`);
      } else if (modalMode === 'EDIT' && editingCategory) {
        await updateAdminCategory(editingCategory.id, {
          name: trimmedName,
          slug: finalSlug,
          description: formData.description.trim(),
          active: formData.active,
          displayOrder: formData.displayOrder,
        });
        if (onShowToast) onShowToast(`Category "${trimmedName}" updated successfully.`);
      }

      setModalMode(null);
      fetchCategories();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Operation failed.';
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (category: AdminCategoryItem) => {
    const nextStatus = !category.active;
    try {
      await toggleAdminCategoryStatus(category.id, nextStatus);
      if (onShowToast) {
        onShowToast(`Category "${category.name}" marked as ${nextStatus ? 'Active' : 'Inactive'}.`);
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, active: nextStatus } : c))
      );
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to update category status.';
      if (onShowToast) onShowToast(errMsg);
      fetchCategories();
    }
  };

  // Delete category
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminCategory(deleteTarget.id);
      if (onShowToast) onShowToast(`Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete category.';
      setDeleteError(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Pagination logic
  const totalItems = categories.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl border border-green-100">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage course categories and organize your LMS content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            id="admin-create-category-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search categories by name, slug, or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
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

      {/* 3. Categories Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50 w-14">#</th>
                <th className="px-5 py-3.5 bg-slate-50">Category Name</th>
                <th className="px-4 py-3.5 bg-slate-50">Slug</th>
                <th className="px-4 py-3.5 bg-slate-50">Description</th>
                <th className="px-4 py-3.5 text-center bg-slate-50">Courses</th>
                <th className="px-4 py-3.5 text-center bg-slate-50">Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Created Date</th>
                <th className="px-5 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                      <span className="text-sm font-medium">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <FolderTree className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mb-1">No Categories Found</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'No categories match your search or filter criteria.'
                          : 'Get started by creating your first course category.'}
                      </p>
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* # Numbering */}
                      <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                        {globalIndex}
                      </td>

                      {/* Category Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs shrink-0 border border-green-100">
                            {cat.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {cat.slug}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-xs text-slate-500 line-clamp-2" title={cat.description || ''}>
                          {cat.description || <span className="text-slate-400 italic">No description</span>}
                        </p>
                      </td>

                      {/* Courses Count */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            cat.coursesCount > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{cat.coursesCount}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          title={`Click to set ${cat.active ? 'Inactive' : 'Active'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                            cat.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cat.active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(cat.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(cat)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              cat.active
                                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={cat.active ? 'Deactivate Category' : 'Activate Category'}
                          >
                            {cat.active ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTarget(cat);
                              setDeleteError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
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
        </div>

        {/* Pagination Footer */}
        {totalItems > pageSize && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{totalItems}</span> categories
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Add / Edit Category Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  {modalMode === 'ADD' ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalMode === 'ADD' ? 'Add Category' : 'Edit Category'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === 'ADD'
                      ? 'Create a new course category for your catalog.'
                      : `Update details for "${editingCategory?.name}".`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 font-medium">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Full Stack Development"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Used in URLs and filters</span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. full-stack-development"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description about courses under this category..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition resize-none"
                />
              </div>

              {/* Display Order & Status Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, active: !prev.active }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        formData.active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {formData.active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'ADD' ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal with Course-Assignment Guard */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Category</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <span className="font-semibold text-slate-700">"{deleteTarget.name}"</span>?
                </p>
              </div>
            </div>

            {/* Guard notice if courses are assigned */}
            {deleteTarget.coursesCount > 0 ? (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cannot delete assigned category</p>
                  <p className="mt-1 text-amber-800">
                    This category is currently assigned to{' '}
                    <span className="font-bold">{deleteTarget.coursesCount}</span>{' '}
                    {deleteTarget.coursesCount === 1 ? 'course' : 'courses'}. Please reassign or remove the category
                    from those courses before deleting.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4">
                This action is permanent and will remove the category from your LMS catalog.
              </p>
            )}

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                {deleteTarget.coursesCount > 0 ? 'Close' : 'Cancel'}
              </button>

              {deleteTarget.coursesCount === 0 && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Delete Category</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCategoriesPage;
