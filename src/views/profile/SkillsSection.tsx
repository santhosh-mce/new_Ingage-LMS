"use client";
import React, { useState, useEffect } from 'react';
import {
  Code,
  Layers,
  Plus,
  X,
  Sparkles,
  Check,
  Loader2,
  Pencil,
  Trash2
} from 'lucide-react';
import { UserSkillDto, updateFullProfile } from '../../api/profileApi';

interface SkillsSectionProps {
  skillsList: UserSkillDto[];
  onRefresh: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  skillsList,
  onRefresh,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftSkills, setDraftSkills] = useState<UserSkillDto[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<string>('Intermediate');
  const [skillError, setSkillError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (skillsList) {
      setDraftSkills(skillsList.map((s) => ({ ...s })));
    }
  }, [skillsList]);

  const handleStartEdit = () => {
    setDraftSkills(skillsList ? skillsList.map((s) => ({ ...s })) : []);
    setNewSkillName('');
    setSkillError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftSkills(skillsList ? skillsList.map((s) => ({ ...s })) : []);
    setNewSkillName('');
    setSkillError(null);
    setIsEditing(false);
  };

  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) {
      setSkillError('Please enter a skill name.');
      return;
    }
    if (draftSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError(`Skill "${trimmed}" is already in the list.`);
      return;
    }

    setDraftSkills([
      ...draftSkills,
      {
        name: trimmed,
        category: 'TECHNOLOGIES',
        level: newSkillLevel,
      },
    ]);
    setNewSkillName('');
    setSkillError(null);
  };

  const handleRemoveSkill = (skillNameToRemove: string) => {
    setDraftSkills(draftSkills.filter((s) => s.name.toLowerCase() !== skillNameToRemove.toLowerCase()));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFullProfile({
        skills: draftSkills,
      });
      setIsEditing(false);
      if (onRefresh) onRefresh();
      if (onShowToast) onShowToast('Skills updated successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update skills.';
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatLevel = (lvl?: string) => {
    if (!lvl) return 'Intermediate';
    const lower = lvl.toLowerCase();
    if (lower === 'beginner') return 'Beginner';
    if (lower === 'advanced') return 'Advanced';
    return 'Intermediate';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Code className="w-5 h-5 text-[#8DB600]" />
            Skills & Proficiencies
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Technical skills, frameworks, databases, and proficiency levels
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs"
            title="Edit Skills"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* INLINE EDIT MODE */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Draft Skills List */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Skills ({draftSkills.length})
            </label>
            {draftSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {draftSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-lime-50/70 border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                  >
                    <span>{skill.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-lime-100 text-lime-800">
                      {formatLevel(skill.level)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="p-0.5 rounded-full hover:bg-rose-100 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={`Remove ${skill.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No skills added yet. Add skills below.</p>
            )}
          </div>

          {/* Add Skill Row */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Add New Skill
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => {
                  setNewSkillName(e.target.value);
                  setSkillError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="e.g. Python, React, Next.js, Django, Spring Boot, SQL, Git..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
              />

              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600] cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>

            {skillError && <p className="text-xs text-rose-600 font-medium">{skillError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY OVERVIEW MODE */
        <div>
          {skillsList && skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((skill) => (
                <div
                  key={skill.name}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-50/80 hover:bg-lime-50/60 border border-gray-200/80 text-xs sm:text-sm font-semibold text-gray-800 transition-colors shadow-2xs"
                >
                  <span>{skill.name}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-lime-100 text-lime-800">
                    {formatLevel(skill.level)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <Code className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 mb-1">No skills added yet</p>
              <p className="text-xs text-gray-400 mb-3">Add your programming languages, frameworks, and developer tools</p>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 text-[#6d8d00] hover:bg-lime-100 text-xs font-bold transition-colors cursor-pointer border border-lime-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Skills</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
