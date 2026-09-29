"use client";
import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Github,
  Globe,
  Tag,
  CheckCircle2,
  Clock,
  X,
  Loader2
} from 'lucide-react';
import { UserProjectDto, addProject, updateProject, deleteProject } from '../../api/profileApi';

interface StudentProjectsSectionProps {
  projectsList: UserProjectDto[];
  onRefresh: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentProjectsSection: React.FC<StudentProjectsSectionProps> = ({
  projectsList,
  onRefresh,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<UserProjectDto | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Full Stack Web App');
  const [technologies, setTechnologies] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('Completed');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setCategory('Full Stack Web App');
    setTechnologies('');
    setGithubUrl('');
    setLiveUrl('');
    setImageUrl('');
    setStatus('Completed');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (proj: UserProjectDto) => {
    setEditingProject(proj);
    setTitle(proj.title || '');
    setDescription(proj.description || '');
    setCategory(proj.category || 'Full Stack Web App');
    setTechnologies(proj.technologies || '');
    setGithubUrl(proj.githubUrl || '');
    setLiveUrl(proj.liveUrl || '');
    setImageUrl(proj.imageUrl || '');
    setStatus(proj.status || 'Completed');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Project title is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload: UserProjectDto = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      technologies: technologies.trim(),
      githubUrl: githubUrl.trim(),
      liveUrl: liveUrl.trim(),
      imageUrl: imageUrl.trim(),
      status: status.trim(),
    };

    try {
      if (editingProject?.id) {
        await updateProject(editingProject.id, payload);
        if (onShowToast) onShowToast('Project updated successfully!', 'success');
      } else {
        await addProject(payload);
        if (onShowToast) onShowToast('Project added to portfolio!', 'success');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || err?.message || 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to remove this project?')) return;

    try {
      await deleteProject(id);
      if (onShowToast) onShowToast('Project deleted.', 'info');
      onRefresh();
    } catch (err: any) {
      if (onShowToast) onShowToast('Failed to delete project.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#8DB600]" />
            Projects & Portfolio ({projectsList.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Demonstrate your hands-on problem solving skills to recruiters with live code and demos
          </p>
        </div>

        <button
          id="add-project-btn"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {projectsList.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No projects added yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Showcase your capstone projects, hackathons, or freelance work to highlight your capabilities.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#8DB600]" />
            <span>Add Your First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className="p-5 rounded-2xl bg-gray-50/70 hover:bg-white border border-gray-100 hover:border-lime-200 hover:shadow-sm transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {project.category || 'Project'}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1 group-hover:text-[#6d8d00] transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    project.status?.toLowerCase() === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {project.status?.toLowerCase() === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-amber-500" />
                    )}
                    {project.status || 'Completed'}
                  </span>
                </div>

                {project.description && (
                  <p className="text-xs text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Tech Stack */}
                {project.technologies && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.split(',').map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-gray-200 text-gray-600"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Links & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 mt-2">
                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Code</span>
                    </a>
                  )}

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#8DB600] hover:text-[#7ba000]"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Edit Project"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-gray-900">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E-Commerce Platform with Microservices"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent bg-white"
                >
                  <option value="Full Stack Web App">Full Stack Web App</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Backend & APIs">Backend & APIs</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Data Analytics & ML">Data Analytics & ML</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Open Source">Open Source Contribution</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Technologies Used (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker, Tailwind"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    GitHub Repo URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://myproject.vercel.app"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent bg-white"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the problem solved, key features, architecture, and personal learning outcomes."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProject ? 'Save Changes' : 'Add Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
