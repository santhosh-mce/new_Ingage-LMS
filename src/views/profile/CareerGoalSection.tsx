"use client";
import React, { useState, useEffect } from 'react';
import {
  Compass,
  Briefcase,
  Building,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { CareerGoalDto, updateCareerGoal } from '../../api/profileApi';
import { getCareers, CareerDto } from '../../api/careerApi';

interface CareerGoalSectionProps {
  careerGoal: CareerGoalDto | null;
  onRefresh: () => void;
  onNavigateToCompass?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CareerGoalSection: React.FC<CareerGoalSectionProps> = ({
  careerGoal,
  onRefresh,
  onNavigateToCompass,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [targetJobRole, setTargetJobRole] = useState('');
  const [preferredIndustry, setPreferredIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [goalObjective, setGoalObjective] = useState('');
  const [openToWork, setOpenToWork] = useState(false);

  const [availableCareers, setAvailableCareers] = useState<CareerDto[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (careerGoal) {
      setTargetJobRole(careerGoal.targetJobRole || '');
      setPreferredIndustry(careerGoal.preferredIndustry || '');
      setExperienceLevel(careerGoal.experienceLevel || 'Fresher');
      setPreferredLocation(careerGoal.preferredLocation || '');
      setGoalObjective(careerGoal.careerGoal || '');
      setOpenToWork(careerGoal.openToWork ?? false);
    }
  }, [careerGoal]);

  useEffect(() => {
    setLoadingCareers(true);
    getCareers({ size: 50 })
      .then((res) => {
        if (res && res.content) {
          setAvailableCareers(res.content);
        }
      })
      .catch((err) => {
        console.warn('Could not load career roles list:', err);
      })
      .finally(() => {
        setLoadingCareers(false);
      });
  }, []);

  const handleStartEdit = () => {
    if (careerGoal) {
      setTargetJobRole(careerGoal.targetJobRole || '');
      setPreferredIndustry(careerGoal.preferredIndustry || '');
      setExperienceLevel(careerGoal.experienceLevel || 'Fresher');
      setPreferredLocation(careerGoal.preferredLocation || '');
      setGoalObjective(careerGoal.careerGoal || '');
      setOpenToWork(careerGoal.openToWork ?? false);
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (careerGoal) {
      setTargetJobRole(careerGoal.targetJobRole || '');
      setPreferredIndustry(careerGoal.preferredIndustry || '');
      setExperienceLevel(careerGoal.experienceLevel || 'Fresher');
      setPreferredLocation(careerGoal.preferredLocation || '');
      setGoalObjective(careerGoal.careerGoal || '');
      setOpenToWork(careerGoal.openToWork ?? false);
    }
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateCareerGoal({
        targetJobRole: targetJobRole.trim(),
        preferredIndustry: preferredIndustry.trim(),
        experienceLevel: experienceLevel.trim(),
        preferredLocation: preferredLocation.trim(),
        careerGoal: goalObjective.trim(),
        openToWork,
      });

      setIsEditing(false);
      if (onRefresh) onRefresh();
      if (onShowToast) {
        onShowToast('Career information updated successfully.', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update career goals.';
      if (onShowToast) {
        onShowToast(msg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#8DB600]" />
            Career Information & Goals
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Define your dream job role, target industry, experience, and job search status
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToCompass && (
            <button
              type="button"
              onClick={onNavigateToCompass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer border border-gray-200"
            >
              <span>Career Compass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs"
              title="Edit Career Information"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* INLINE EDIT MODE */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Open to Work Toggle Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-lime-50/70 via-emerald-50/50 to-white border border-lime-200/80 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Open to Job Opportunities</span>
                {openToWork && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                Signal to verified hiring partners and recruiters that you are actively seeking opportunities.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={openToWork}
                onChange={(e) => setOpenToWork(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DB600]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Target Job Role */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Target Job Role</span>
                <span className="text-[11px] text-[#8DB600] font-medium lowercase">
                  Integrates with Career Compass
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="career-roles-list"
                  placeholder="e.g. Full Stack Developer, Data Analyst, Cloud Engineer"
                  value={targetJobRole}
                  onChange={(e) => setTargetJobRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600] font-medium"
                />
                <datalist id="career-roles-list">
                  {availableCareers.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.category} • {c.level}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600] font-medium bg-white cursor-pointer"
              >
                <option value="Fresher">Fresher (0 - 1 year)</option>
                <option value="Junior">Junior (1 - 2 years)</option>
                <option value="Mid-Level">Mid-Level (2 - 4 years)</option>
                <option value="Senior">Senior (5+ years)</option>
              </select>
            </div>

            {/* Preferred Location */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Preferred Job Location
              </label>
              <input
                type="text"
                placeholder="e.g. Chennai, Bangalore, Remote"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600] font-medium"
              />
            </div>

            {/* Industry */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Industry / Domain
              </label>
              <input
                type="text"
                placeholder="e.g. Software & Technology, EdTech, FinTech"
                value={preferredIndustry}
                onChange={(e) => setPreferredIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600] font-medium"
              />
            </div>

            {/* Career Goal */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Career Goal / Professional Objective
              </label>
              <textarea
                rows={3}
                placeholder="Describe what kind of projects or roles you want to grow into..."
                value={goalObjective}
                onChange={(e) => setGoalObjective(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8DB600] font-medium resize-y"
              />
            </div>
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
        <div className="space-y-5">
          {/* Career Goal Objective Box */}
          {goalObjective && (
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Career Goal
              </span>
              <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-line">
                "{goalObjective}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Role */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span>Target Role</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{targetJobRole || 'Not specified'}</p>
            </div>

            {/* Experience */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Experience</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{experienceLevel || 'Fresher'}</p>
            </div>

            {/* Preferred Location */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Preferred Location</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{preferredLocation || 'Any'}</p>
            </div>

            {/* Open to Work */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Open to Work</span>
              </div>
              <div>
                {openToWork ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Yes — Actively Seeking
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-gray-500">Not actively seeking</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
