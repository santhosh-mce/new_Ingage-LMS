"use client";
import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  getAdminCredentialCourses,
  createAdminCredentialCourse,
  updateAdminCredentialCourse,
  deleteAdminCredentialCourse,
  togglePublishCredentialCourse,
  CredentialCourseDto,
  CredentialModuleDto
} from '../../api/credentialApi';

const CATEGORY_OPTIONS = [
  'Data & Analytics',
  'Cybersecurity',
  'Generative AI',
  'Cloud',
  'Cloud & Infrastructure',
  'IT & Infrastructure',
  'Project Management',
  'UX Design',
  'Digital Marketing',
  'Other'
];

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export function AdminCredentialEdgePage() {
  const [courses, setCourses] = useState<CredentialCourseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CredentialCourseDto | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [provider, setProvider] = useState('Google');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [level, setLevel] = useState(LEVEL_OPTIONS[0]);
  const [duration, setDuration] = useState('Approx. 6 months');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [credentialType, setCredentialType] = useState('Professional Certificate');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState<boolean>(true);
  const [published, setPublished] = useState<boolean>(true);
  const [featured, setFeatured] = useState<boolean>(true);
  const [careerSlug, setCareerSlug] = useState('');
  const [learningOutcomesText, setLearningOutcomesText] = useState('');
  const [prerequisitesText, setPrerequisitesText] = useState('');
  const [modules, setModules] = useState<CredentialModuleDto[]>([
    { title: 'Module 1 — Foundations', description: 'Core introductory concepts', duration: '3 weeks', orderIndex: 1 }
  ]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCredentialCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load Google courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setTitle('');
    setSlug('');
    setProvider('Google');
    setCategory(CATEGORY_OPTIONS[0]);
    setLevel(LEVEL_OPTIONS[0]);
    setDuration('Approx. 6 months');
    setDescription('');
    setShortDescription('');
    setThumbnail('');
    setCredentialName('');
    setCredentialType('Professional Certificate');
    setCredentialUrl('');
    setPrice(0);
    setIsFree(true);
    setPublished(true);
    setFeatured(true);
    setCareerSlug('');
    setLearningOutcomesText('');
    setPrerequisitesText('');
    setModules([
      { title: 'Module 1 — Foundations', description: 'Core introductory concepts', duration: '3 weeks', orderIndex: 1 }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: CredentialCourseDto) => {
    setEditingCourse(c);
    setTitle(c.title);
    setSlug(c.slug);
    setProvider(c.provider || 'Google');
    setCategory(c.category);
    setLevel(c.level || 'Beginner');
    setDuration(c.duration || '');
    setDescription(c.description || '');
    setShortDescription(c.shortDescription || '');
    setThumbnail(c.thumbnail || '');
    setCredentialName(c.credentialName || '');
    setCredentialType(c.credentialType || 'Professional Certificate');
    setCredentialUrl(c.credentialUrl || '');
    setPrice(c.price || 0);
    setIsFree(c.free);
    setPublished(c.published);
    setFeatured(c.featured);
    setCareerSlug(c.careerSlug || '');
    setLearningOutcomesText(c.learningOutcomes ? c.learningOutcomes.join('\n') : '');
    setPrerequisitesText(c.prerequisites ? c.prerequisites.join('\n') : '');
    setModules(c.modules && c.modules.length > 0 ? [...c.modules] : [
      { title: 'Module 1 — Foundations', description: 'Core introductory concepts', duration: '3 weeks', orderIndex: 1 }
    ]);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const outcomes = learningOutcomesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const prereqs = prerequisitesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload: Partial<CredentialCourseDto> = {
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, ''),
        provider: provider.trim() || 'Google',
        category,
        level,
        duration,
        description,
        shortDescription,
        thumbnail,
        credentialName,
        credentialType,
        credentialUrl,
        price: isFree ? 0 : price,
        free: isFree,
        published,
        featured,
        careerSlug: careerSlug.trim(),
        learningOutcomes: outcomes,
        prerequisites: prereqs,
        modules
      };

      if (editingCourse) {
        await updateAdminCredentialCourse(editingCourse.id, payload);
      } else {
        await createAdminCredentialCourse(payload);
      }

      setIsModalOpen(false);
      await loadCourses();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: number, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) return;
    try {
      await deleteAdminCredentialCourse(id);
      await loadCourses();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete course.');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await togglePublishCredentialCourse(id);
      await loadCourses();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        title: `Module ${modules.length + 1}`,
        description: 'Module syllabus description',
        duration: '3 weeks',
        orderIndex: modules.length + 1
      }
    ]);
  };

  const handleRemoveModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const handleModuleChange = (idx: number, field: keyof CredentialModuleDto, value: string) => {
    const next = [...modules];
    next[idx] = { ...next[idx], [field]: value };
    setModules(next);
  };

  const filteredCourses = courses.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.credentialName && c.credentialName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5 text-green-600" />
            <span>Credential Edge Control Plane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Google Certified Courses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage official Google course curricula, credentials, pricing, and career path integrations.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Google Course</span>
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Total Courses
          </span>
          <span className="text-2xl font-bold text-gray-900">{courses.length}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Published
          </span>
          <span className="text-2xl font-bold text-green-700">
            {courses.filter((c) => c.published).length}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Free Courses
          </span>
          <span className="text-2xl font-bold text-emerald-600">
            {courses.filter((c) => c.free).length}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Total Learners
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {courses.reduce((acc, c) => acc + (c.learnersCount || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, or credential name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-green-600 bg-gray-50/50"
          />
        </div>

        <button
          onClick={loadCourses}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Refresh table"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 animate-pulse">Loading Google courses...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-600">{error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">No Google credential courses found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Course</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Level</th>
                  <th className="py-3.5 px-6">Credential Name</th>
                  <th className="py-3.5 px-6">Pricing</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <div>{c.title}</div>
                      <span className="text-[11px] font-mono text-gray-400 font-normal">/{c.slug}</span>
                    </td>
                    <td className="py-4 px-6">{c.category}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold text-[11px]">
                        {c.level || 'Beginner'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-amber-700">
                      {c.credentialName || 'Google Certificate'}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {c.free ? (
                        <span className="text-emerald-600 font-bold">Free</span>
                      ) : (
                        `₹${c.price}`
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleTogglePublish(c.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          c.published
                            ? 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {c.published ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                        <span>{c.published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                          title="Edit course"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Summary Count */}
        {!loading && !error && filteredCourses.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
            <span>
              Total: <strong className="font-semibold text-slate-800">{filteredCourses.length}</strong> Google certified course{filteredCourses.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? 'Edit Google Course' : 'Create Google Course'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-6 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Google Data Analytics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. google-data-analytics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600 bg-white"
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. Approx. 6 months"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Provider</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Credential Name *</label>
                  <input
                    type="text"
                    required
                    value={credentialName}
                    onChange={(e) => setCredentialName(e.target.value)}
                    placeholder="e.g. Google Data Analytics Professional Certificate"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">External Credential URL</label>
                  <input
                    type="url"
                    value={credentialUrl}
                    onChange={(e) => setCredentialUrl(e.target.value)}
                    placeholder="https://grow.google/certificates/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Career Compass Link (Slug)</label>
                  <input
                    type="text"
                    value={careerSlug}
                    onChange={(e) => setCareerSlug(e.target.value)}
                    placeholder="e.g. data-analyst or security-analyst"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence overview for course cards"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive description of the course content and career objectives"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600 font-sans"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={learningOutcomesText}
                    onChange={(e) => setLearningOutcomesText(e.target.value)}
                    placeholder="SQL queries and joins&#10;Spreadsheet formulas&#10;Data visualization"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600 font-sans"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">
                    Prerequisites (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={prerequisitesText}
                    onChange={(e) => setPrerequisitesText(e.target.value)}
                    placeholder="No prior technical knowledge required"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600 font-sans"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="font-bold text-gray-800">Free Course</span>
                  </label>
                </div>

                {!isFree && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-green-600"
                    />
                  </div>
                )}
              </div>

              {/* Module Builder */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Course Modules ({modules.length})</h3>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 text-green-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Add Module
                  </button>
                </div>

                <div className="space-y-3">
                  {modules.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleModuleChange(idx, 'title', e.target.value)}
                          placeholder={`Module ${idx + 1} Title`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white"
                        />
                        <input
                          type="text"
                          value={m.duration}
                          onChange={(e) => handleModuleChange(idx, 'duration', e.target.value)}
                          placeholder="Duration (e.g. 3 weeks)"
                          className="w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                        {modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveModule(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => handleModuleChange(idx, 'description', e.target.value)}
                        placeholder="Module brief description"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCredentialEdgePage;
