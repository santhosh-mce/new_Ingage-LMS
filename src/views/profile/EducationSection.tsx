"use client";
import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  BookOpen,
  Award,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { UserEducationDto, updateFullProfile } from '../../api/profileApi';

interface EducationSectionProps {
  educationList: UserEducationDto[];
  onRefresh: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  educationList,
  onRefresh,
  onShowToast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftList, setDraftList] = useState<UserEducationDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (educationList && educationList.length > 0) {
      setDraftList(educationList.map((e) => ({ ...e })));
    } else {
      setDraftList([
        {
          degree: '',
          institution: '',
          department: '',
          graduationYear: '',
          cgpa: '',
        },
      ]);
    }
  }, [educationList]);

  const handleStartEdit = () => {
    if (educationList && educationList.length > 0) {
      setDraftList(educationList.map((e) => ({ ...e })));
    } else {
      setDraftList([
        {
          degree: '',
          institution: '',
          department: '',
          graduationYear: '',
          cgpa: '',
        },
      ]);
    }
    setErrorMessage(null);
    setIsEditing(true);
  };

  const handleAddRecord = () => {
    setDraftList([
      ...draftList,
      {
        degree: '',
        institution: '',
        department: '',
        graduationYear: '',
        cgpa: '',
      },
    ]);
  };

  const handleUpdateRecord = (index: number, field: keyof UserEducationDto, value: string) => {
    const updated = [...draftList];
    updated[index] = { ...updated[index], [field]: value };
    setDraftList(updated);
  };

  const handleRemoveRecord = (index: number) => {
    if (draftList.length === 1) {
      setDraftList([
        {
          degree: '',
          institution: '',
          department: '',
          graduationYear: '',
          cgpa: '',
        },
      ]);
    } else {
      setDraftList(draftList.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const valid = draftList.filter((e) => e.degree.trim() || e.institution.trim());
    if (valid.length > 0 && valid.some((e) => !e.degree.trim() || !e.institution.trim())) {
      setErrorMessage('Both Degree and College/Institution are required for each education entry.');
      return;
    }

    setSaving(true);
    try {
      await updateFullProfile({
        education: valid,
      });
      setIsEditing(false);
      if (onRefresh) onRefresh();
      if (onShowToast) onShowToast('Education details updated successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save education details.';
      setErrorMessage(msg);
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (educationList && educationList.length > 0) {
      setDraftList(educationList.map((e) => ({ ...e })));
    } else {
      setDraftList([
        {
          degree: '',
          institution: '',
          department: '',
          graduationYear: '',
          cgpa: '',
        },
      ]);
    }
    setErrorMessage(null);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#8DB600]" />
            Education
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Academic degrees, institutions, graduation timeline, and scores
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs"
            title="Edit Education"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* INLINE EDIT MODE */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">
            {draftList.map((edu, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 relative space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Education Record #{idx + 1}
                  </span>
                  {draftList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRecord(idx)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Degree */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Degree / Course <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateRecord(idx, 'degree', e.target.value)}
                      placeholder="e.g. B.E. Computer Science Engineering"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                    />
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      College / Institution <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleUpdateRecord(idx, 'institution', e.target.value)}
                      placeholder="e.g. Meenakshi College of Engineering"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={edu.department || ''}
                      onChange={(e) => handleUpdateRecord(idx, 'department', e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                    />
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={edu.graduationYear || ''}
                      onChange={(e) => handleUpdateRecord(idx, 'graduationYear', e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                    />
                  </div>

                  {/* CGPA */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      CGPA / Percentage
                    </label>
                    <input
                      type="text"
                      value={edu.cgpa || ''}
                      onChange={(e) => handleUpdateRecord(idx, 'cgpa', e.target.value)}
                      placeholder="e.g. 8.1"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddRecord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] text-xs font-bold transition-colors cursor-pointer border border-lime-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Education</span>
            </button>

            <div className="flex items-center gap-3">
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
          </div>
        </form>
      ) : (
        /* READ-ONLY OVERVIEW MODE */
        <div>
          {educationList && educationList.length > 0 ? (
            <div className="space-y-4">
              {educationList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-lime-100/60 text-[#6d8d00] shrink-0 mt-0.5">
                      <GraduationCap className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900 tracking-tight">
                        {item.degree}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>{item.institution}</span>
                        {item.department && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{item.department}</span>
                          </>
                        )}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500">
                        {item.graduationYear && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            Class of {item.graduationYear}
                          </span>
                        )}
                        {item.cgpa && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-800 font-semibold text-[11px]">
                              <Award className="w-3 h-3 text-[#8DB600]" />
                              CGPA: {item.cgpa}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600 mb-1">No education records added yet</p>
              <p className="text-xs text-gray-400 mb-3">Add your college, degree, and graduation year</p>
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 text-[#6d8d00] hover:bg-lime-100 text-xs font-bold transition-colors cursor-pointer border border-lime-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
