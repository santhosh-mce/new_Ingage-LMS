"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle2,
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  OpportunityItem,
  getAdminOpportunities,
  createAdminOpportunity,
  updateAdminOpportunity,
  toggleOpportunityPublish,
  toggleOpportunityStatus,
  deleteAdminOpportunity,
} from '../../api/opportunityApi';

interface AdminOpportunitiesPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminOpportunitiesPage: React.FC<AdminOpportunitiesPageProps> = ({
  onNavigate: _onNavigate,
  onShowToast,
}) => {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [workModeFilter, setWorkModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OpportunityItem | null>(null);

  const emptyForm = {
    title: '',
    company: '',
    companyLogo: '',
    location: '',
    type: 'Job',
    workMode: 'Remote',
    salary: '',
    experienceLevel: 'Entry Level',
    category: 'Software Engineering',
    matchScore: 85,
    description: '',
    aboutCompany: '',
    requiredSkills: '',
    responsibilities: '',
    qualifications: '',
    benefits: '',
    deadline: 'In 3 weeks',
    active: true,
    published: true,
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

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const data = await getAdminOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showToast('Unable to load opportunities from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditModal = (opp: OpportunityItem) => {
    setEditingId(opp.id);
    setForm({
      title: opp.title,
      company: opp.company,
      companyLogo: opp.companyLogo || '',
      location: opp.location,
      type: opp.type,
      workMode: opp.workMode,
      salary: opp.salary,
      experienceLevel: opp.experienceLevel,
      category: opp.category,
      matchScore: opp.matchScore,
      description: opp.description,
      aboutCompany: opp.aboutCompany,
      requiredSkills: opp.requiredSkills.map((s) => s.name).join(', '),
      responsibilities: opp.responsibilities.join('\n'),
      qualifications: opp.qualifications.join('\n'),
      benefits: opp.benefits.join('\n'),
      deadline: opp.deadline || '',
      active: opp.active !== false,
      published: opp.published !== false,
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) {
      showToast('Title and Company are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        title: form.title.trim(),
        company: form.company.trim(),
        companyLogo: form.companyLogo.trim(),
        location: form.location.trim(),
        type: form.type,
        workMode: form.workMode,
        salary: form.salary.trim(),
        experienceLevel: form.experienceLevel.trim(),
        category: form.category.trim(),
        matchScore: Number(form.matchScore) || 85,
        description: form.description.trim(),
        aboutCompany: form.aboutCompany.trim(),
        deadline: form.deadline.trim(),
        active: form.active,
        published: form.published,
        requiredSkills: form.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: form.responsibilities
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        qualifications: form.qualifications
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: form.benefits
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateAdminOpportunity(editingId, payload);
        showToast('Opportunity updated successfully.');
      } else {
        await createAdminOpportunity(payload);
        showToast('Opportunity created successfully.');
      }

      setFormOpen(false);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to save opportunity:', err);
      showToast('Failed to save opportunity. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (opp: OpportunityItem) => {
    try {
      await toggleOpportunityPublish(opp.id, !(opp.published !== false));
      fetchOpportunities();
      showToast(`Opportunity marked as ${opp.published ? 'Draft' : 'Published'}.`);
    } catch {
      showToast('Failed to toggle publish status.', 'error');
    }
  };

  const handleToggleStatus = async (opp: OpportunityItem) => {
    try {
      await toggleOpportunityStatus(opp.id, !(opp.active !== false));
      fetchOpportunities();
      showToast(`Opportunity marked as ${opp.active ? 'Inactive' : 'Active'}.`);
    } catch {
      showToast('Failed to toggle active status.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminOpportunity(deleteTarget.id);
      setDeleteTarget(null);
      fetchOpportunities();
      showToast(`Opportunity "${deleteTarget.title}" deleted.`);
    } catch {
      showToast('Failed to delete opportunity.', 'error');
    }
  };

  // Filtered Opportunities
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (typeFilter !== 'ALL' && opp.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (workModeFilter !== 'ALL' && opp.workMode.toLowerCase() !== workModeFilter.toLowerCase()) return false;
      if (statusFilter === 'PUBLISHED' && opp.published === false) return false;
      if (statusFilter === 'DRAFT' && opp.published !== false) return false;
      if (statusFilter === 'ACTIVE' && opp.active === false) return false;
      if (statusFilter === 'INACTIVE' && opp.active !== false) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesCompany = opp.company.toLowerCase().includes(q);
        const matchesLoc = opp.location.toLowerCase().includes(q);
        const matchesSkills = opp.requiredSkills.some((s) => s.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesLoc && !matchesSkills) return false;
      }
      return true;
    });
  }, [opportunities, typeFilter, workModeFilter, statusFilter, searchQuery]);

  const totalCount = opportunities.length;
  const publishedCount = opportunities.filter((o) => o.published !== false).length;
  const draftCount = totalCount - publishedCount;
  const activeCount = opportunities.filter((o) => o.active !== false).length;

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

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-600" />
            Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage jobs, internships, freelance gigs, and apprenticeship postings displayed on the platform.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchOpportunities}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh opportunities"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Opportunity</span>
          </button>
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Postings</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="mt-1 text-xs text-slate-500">All registered listings</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Published</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">{publishedCount}</div>
          <div className="mt-1 text-xs text-slate-500">Live on /opportunities</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Draft</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-700">{draftCount}</div>
          <div className="mt-1 text-xs text-slate-500">Hidden from learners</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-blue-700">{activeCount}</div>
          <div className="mt-1 text-xs text-slate-500">Accepting applications</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, company, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-green-600 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Job">Job</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
              <option value="Apprenticeship">Apprenticeship</option>
            </select>

            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-green-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {(searchQuery || typeFilter !== 'ALL' || workModeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('ALL');
                  setWorkModeFilter('ALL');
                  setStatusFilter('ALL');
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

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Opportunity</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Work Mode</th>
                <th className="py-3.5 px-4">Salary</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mb-2"></div>
                    <p>Loading opportunities from PostgreSQL...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No opportunities found. Click "+ Add Opportunity" to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {opp.companyLogo ? (
                          <img
                            src={opp.companyLogo}
                            alt={opp.company}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 font-bold flex items-center justify-center shrink-0 border border-green-200">
                            {opp.company.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{opp.title}</div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <span>{opp.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {opp.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {opp.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {opp.workMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {opp.salary || 'Competitive'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(opp)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          opp.published !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to toggle learner visibility"
                      >
                        {opp.published !== false ? (
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
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(opp)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          opp.active !== false
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {opp.active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(opp)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                          title="Edit Opportunity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(opp)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Opportunity"
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
      </div>

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSave}
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                {editingId ? 'Edit Opportunity' : 'Create New Opportunity'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Python Backend Developer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Technologies"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opportunity Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  >
                    <option value="Job">Job</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Apprenticeship">Apprenticeship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
                  <select
                    value={form.workMode}
                    onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, India"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salary / Compensation</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹5 - ₹8 LPA"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Experience Level</label>
                  <input
                    type="text"
                    placeholder="e.g. 0 - 2 Years"
                    value={form.experienceLevel}
                    onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineering"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Logo URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={form.companyLogo}
                  onChange={(e) => setForm({ ...form, companyLogo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Django, PostgreSQL, Docker"
                  value={form.requiredSkills}
                  onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the opportunity and core responsibilities..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">About Company</label>
                <textarea
                  rows={2}
                  value={form.aboutCompany}
                  onChange={(e) => setForm({ ...form, aboutCompany: e.target.value })}
                  placeholder="Company background and culture overview..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsibilities (one per line)</label>
                  <textarea
                    rows={3}
                    value={form.responsibilities}
                    onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                    placeholder="Build REST microservices&#10;Optimize database queries"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qualifications (one per line)</label>
                  <textarea
                    rows={3}
                    value={form.qualifications}
                    onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                    placeholder="Proficient with Python 3+&#10;Hands-on SQL database experience"
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
                  <span>Published (Visible to learners on /opportunities)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 border-slate-300"
                  />
                  <span>Active (Accepting applications)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition"
              >
                {saving ? 'Saving...' : editingId ? 'Update Opportunity' : 'Create Opportunity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Opportunity?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deleteTarget.title}</span> at{' '}
              <span className="font-bold text-slate-900">{deleteTarget.company}</span>? Any existing learner application
              records for this listing will be affected.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition"
              >
                Delete Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOpportunitiesPage;
