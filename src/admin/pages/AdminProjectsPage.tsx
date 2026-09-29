"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Code,
  Clock,
  BookOpen,
} from 'lucide-react';
import {
  getAdminProjects,
  getAdminProjectStats,
  createAdminProject,
  updateAdminProject,
  toggleProjectStatus,
  toggleProjectPublish,
  deleteAdminProject,
} from '../../api/adminApi';

export interface AdminProjectsPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminProjectsPage: React.FC<AdminProjectsPageProps> = ({
  onNavigate: _onNavigate,
  onShowToast,
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedProjects: 0,
    draftProjects: 0,
    activeProjects: 0,
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'Beginner' | 'Intermediate' | 'Advanced'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<any | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: '',
    slug: '',
    category: 'Healthcare',
    description: '',
    difficulty: 'Beginner',
    duration: '25h',
    skillsCount: 5,
    learnersCount: 1000,
    imageUrl: '',
    prerequisites: '',
    techStack: '',
    whatYouWillBuild: '',
    learningOutcomes: '',
    skillsLearned: '',
    active: true,
    published: true,
    displayOrder: 0,
  };

  const [form, setForm] = useState(emptyForm);
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

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const [listData, statsData] = await Promise.all([
        getAdminProjects(),
        getAdminProjectStats().catch(() => null),
      ]);

      const items = Array.isArray(listData) ? listData : [];
      setProjects(items);

      if (statsData) {
        setStats({
          totalProjects: Number(statsData.totalProjects || 0),
          publishedProjects: Number(statsData.publishedProjects || 0),
          draftProjects: Number(statsData.draftProjects || 0),
          activeProjects: Number(statsData.activeProjects || 0),
        });
      } else {
        const total = items.length;
        const pub = items.filter((p) => p.published !== false).length;
        setStats({
          totalProjects: total,
          publishedProjects: pub,
          draftProjects: total - pub,
          activeProjects: items.filter((p) => p.active !== false).length,
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      showToast('Unable to load projects from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  // Dynamic Categories from real backend data
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      const cat = p.category || p.industry;
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return Array.from(set).sort();
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Status Filter
      if (statusFilter === 'PUBLISHED' && p.published === false) return false;
      if (statusFilter === 'DRAFT' && p.published !== false) return false;

      // 2. Difficulty Filter
      if (difficultyFilter !== 'ALL' && p.difficulty?.toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL') {
        const cat = p.category || p.industry;
        if (cat?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      // 4. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCat = (p.category || p.industry)?.toLowerCase().includes(q);
        const matchesTech = p.techStack?.some((t: string) => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesTech) return false;
      }

      return true;
    });
  }, [projects, statusFilter, difficultyFilter, categoryFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, difficultyFilter, categoryFilter]);

  // Paginated projects
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const handleOpenCreateModal = () => {
    setEditingProjectId(null);
    setForm({
      ...emptyForm,
      displayOrder: projects.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProjectId(p.id);
    setForm({
      title: p.title || '',
      slug: p.slug || '',
      category: p.category || p.industry || 'Healthcare',
      description: p.description || '',
      difficulty: p.difficulty || 'Beginner',
      duration: p.duration || '25h',
      skillsCount: p.skillsCount || 5,
      learnersCount: p.learnersCount || 1000,
      imageUrl: p.imageUrl || '',
      prerequisites: p.prerequisites || '',
      techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : '',
      whatYouWillBuild: Array.isArray(p.whatYouWillBuild) ? p.whatYouWillBuild.join('\n') : '',
      learningOutcomes: Array.isArray(p.learningOutcomes) ? p.learningOutcomes.join('\n') : '',
      skillsLearned: Array.isArray(p.skillsLearned) ? p.skillsLearned.join(', ') : '',
      active: p.active !== false,
      published: p.published !== false,
      displayOrder: p.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (p: any) => {
    setViewingProject(p);
    setIsViewModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Project title is required.', 'error');
      return;
    }

    const slug = form.slug.trim()
      ? form.slug.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
      : form.title.toLowerCase().trim().replaceAll(/[^a-z0-9]+/g, '-');

    const payload: Record<string, any> = {
      ...form,
      slug,
      industry: form.category,
      techStack: form.techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      skillsLearned: form.skillsLearned
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      whatYouWillBuild: form.whatYouWillBuild
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      learningOutcomes: form.learningOutcomes
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      if (editingProjectId) {
        await updateAdminProject(editingProjectId, payload);
        showToast('Project updated successfully.');
      } else {
        await createAdminProject(payload);
        showToast('Project created successfully.');
      }
      setIsModalOpen(false);
      setEditingProjectId(null);
      fetchProjectsData();
    } catch (err) {
      console.error('Failed to save project:', err);
      showToast('Failed to save project. Please check the inputs.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (p: any) => {
    const newPub = !(p.published !== false);
    try {
      await toggleProjectPublish(p.id, newPub);
      fetchProjectsData();
      showToast(`Project marked as ${newPub ? 'Published' : 'Draft'}.`);
    } catch {
      showToast('Failed to toggle published status.', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminProject(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjectsData();
      showToast(`Project "${deleteTarget.title}" deleted.`);
    } catch {
      showToast('Failed to delete project.', 'error');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
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
            className="ml-2 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-green-600" />
            Projects
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage projects available to learners and keep project content organized.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchProjectsData}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh projects"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Project</span>
          </button>
        </div>
      </div>

      {/* 2. 4 STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Projects</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{stats.totalProjects}</div>
          <div className="mt-1 text-xs text-slate-500">All registered tracks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Published Projects</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">{stats.publishedProjects}</div>
          <div className="mt-1 text-xs text-slate-500">Live for learners</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Draft Projects</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-700">{stats.draftProjects}</div>
          <div className="mt-1 text-xs text-slate-500">Unpublished drafts</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Projects</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-700">{stats.activeProjects}</div>
          <div className="mt-1 text-xs text-slate-500">Active track status</div>
        </div>
      </div>

      {/* 3. SEARCH AND FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {dynamicCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {(searchTerm || statusFilter !== 'ALL' || difficultyFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDifficultyFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. PROJECTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Difficulty</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mb-2"></div>
                    <p>Loading projects from PostgreSQL...</p>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {searchTerm || statusFilter !== 'ALL' || difficultyFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
                      <div>
                        <p className="font-semibold text-slate-700">No projects match your search.</p>
                        <p className="text-slate-400 text-[11px] mt-1">Try clearing filters or search terms.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-700">No projects found</p>
                        <p className="text-slate-400 text-[11px] mt-1">Create your first project to get started.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    {/* Project */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 font-bold flex items-center justify-center shrink-0 border border-green-200">
                            <Code className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{p.title}</div>
                          <div className="text-slate-400 text-[11px] font-mono mt-0.5">/projects/{p.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.category || p.industry || 'General'}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.difficulty === 'Beginner'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.difficulty === 'Intermediate'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.difficulty || 'Beginner'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          p.published !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle publish visibility"
                      >
                        {p.published !== false ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Created */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Updated */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDate(p.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenViewModal(p)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                          title="View Project Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION */}
        {!loading && filteredProjects.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span>–
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * pageSize, filteredProjects.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{filteredProjects.length}</span> projects
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-green-600 cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-semibold text-slate-700 px-1">
                {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveProject}
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-600" />
                {editingProjectId ? 'Edit Project' : 'Create Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Resume Builder"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Slug</label>
                  <input
                    type="text"
                    placeholder="ai-resume-builder"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category / Industry *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Healthcare, FinTech, AI"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 25h"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thumbnail / Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description / Overview</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what learners will build in this project..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technologies / Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, PostgreSQL, Tailwind CSS"
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prerequisites / Requirements</label>
                <input
                  type="text"
                  placeholder="e.g. Basic JavaScript and HTML knowledge"
                  value={form.prerequisites}
                  onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    What You Will Build (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.whatYouWillBuild}
                    onChange={(e) => setForm({ ...form, whatYouWillBuild: e.target.value })}
                    placeholder="Real-time analytics dashboard&#10;Role-based access control&#10;Automated export pipeline"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={form.learningOutcomes}
                    onChange={(e) => setForm({ ...form, learningOutcomes: e.target.value })}
                    placeholder="Architect production microservices&#10;Implement end-to-end testing&#10;Deploy to cloud container"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 border-slate-300"
                  />
                  <span>Published (Visible to learners)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 border-slate-300"
                  />
                  <span>Active track</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition"
              >
                {saving ? 'Saving...' : editingProjectId ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. VIEW PROJECT MODAL */}
      {isViewModalOpen && viewingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                {viewingProject.imageUrl ? (
                  <img
                    src={viewingProject.imageUrl}
                    alt={viewingProject.title}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center border border-green-200">
                    <Code className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingProject.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">/projects/{viewingProject.slug}</p>
                </div>
              </div>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-slate-700 bg-slate-100 font-semibold border border-slate-200">
                  {viewingProject.category || viewingProject.industry}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-blue-700 bg-blue-50 font-semibold border border-blue-200">
                  {viewingProject.difficulty}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-slate-700 bg-slate-100 font-semibold border border-slate-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {viewingProject.duration}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold border ${
                    viewingProject.published !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {viewingProject.published !== false ? 'Published' : 'Draft'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Description</h4>
                <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingProject.description || 'No description provided.'}
                </p>
              </div>

              {viewingProject.prerequisites && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Prerequisites</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100">{viewingProject.prerequisites}</p>
                </div>
              )}

              {/* Technologies */}
              {viewingProject.techStack && viewingProject.techStack.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProject.techStack.map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-semibold border border-green-200 text-[11px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What You Will Build */}
              {viewingProject.whatYouWillBuild && viewingProject.whatYouWillBuild.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    What You Will Build
                  </h4>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 list-disc list-inside">
                    {viewingProject.whatYouWillBuild.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Outcomes */}
              {viewingProject.learningOutcomes && viewingProject.learningOutcomes.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Learning Outcomes
                  </h4>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 list-disc list-inside">
                    {viewingProject.learningOutcomes.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-slate-400 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-600">Created:</span> {formatDate(viewingProject.createdAt)}
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Updated:</span> {formatDate(viewingProject.updatedAt)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewingProject);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
              >
                Edit Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this project? This action may affect learner project references and
              related records.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-900">{deleteTarget.title}</span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">/projects/{deleteTarget.slug}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectsPage;
