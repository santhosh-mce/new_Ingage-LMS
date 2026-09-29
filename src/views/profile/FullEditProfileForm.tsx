"use client";
import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Code,
  Link2,
  Github,
  Linkedin,
  Globe,
  Upload,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  ProfileDto,
  UserEducationDto,
  UserSkillDto,
  updateFullProfile,
  uploadResume,
  deleteResume
} from '../../api/profileApi';
import { getAccessibleImageUrl } from '../../api/authApi';

interface FullEditProfileFormProps {
  user: UserProfile | null;
  profile: ProfileDto | null;
  onSaveSuccess: (updatedProfile: ProfileDto) => void;
  onCancel: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onChangePhoto?: () => void;
}

export const FullEditProfileForm: React.FC<FullEditProfileFormProps> = ({
  user,
  profile,
  onSaveSuccess,
  onCancel,
  onShowToast,
  onChangePhoto,
}) => {
  // Personal Info Form State
  const [fullName, setFullName] = useState(profile?.personalInfo?.fullName || user?.name || '');
  const [email] = useState(profile?.personalInfo?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.personalInfo?.phone || user?.phone || '');
  const [location, setLocation] = useState(profile?.personalInfo?.location || '');
  const [bio, setBio] = useState(profile?.personalInfo?.bio || '');

  // Career Info Form State
  const [targetJobRole, setTargetJobRole] = useState(profile?.careerGoal?.targetJobRole || '');
  const [experienceLevel, setExperienceLevel] = useState(profile?.careerGoal?.experienceLevel || 'Fresher');
  const [preferredLocation, setPreferredLocation] = useState(profile?.careerGoal?.preferredLocation || '');
  const [preferredIndustry, setPreferredIndustry] = useState(profile?.careerGoal?.preferredIndustry || '');
  const [careerGoal, setCareerGoal] = useState(profile?.careerGoal?.careerGoal || '');
  const [openToWork, setOpenToWork] = useState(profile?.careerGoal?.openToWork ?? true);

  // Professional Links Form State
  const [githubUrl, setGithubUrl] = useState(profile?.links?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.links?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.links?.portfolioUrl || '');
  const [otherWebsiteUrl, setOtherWebsiteUrl] = useState(profile?.links?.otherWebsiteUrl || '');

  // Education Form State
  const [educationList, setEducationList] = useState<UserEducationDto[]>(
    profile?.education && profile.education.length > 0
      ? profile.education.map((e) => ({ ...e }))
      : [
          {
            degree: '',
            institution: '',
            department: '',
            graduationYear: '',
            cgpa: '',
          },
        ]
  );

  // Skills Form State
  const [skillsList, setSkillsList] = useState<UserSkillDto[]>(
    profile?.skills && profile.skills.length > 0 ? profile.skills.map((s) => ({ ...s })) : []
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newSkillError, setNewSkillError] = useState<string | null>(null);

  // Resume State
  const [currentResume, setCurrentResume] = useState(profile?.resume || null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayAvatar = getAccessibleImageUrl(
    profile?.personalInfo?.profileImage || user?.avatarUrl || user?.profileImage
  );

  // Education Helpers
  const handleAddEducation = () => {
    setEducationList([
      ...educationList,
      {
        degree: '',
        institution: '',
        department: '',
        graduationYear: '',
        cgpa: '',
      },
    ]);
  };

  const handleUpdateEducation = (index: number, field: keyof UserEducationDto, value: string) => {
    const updated = [...educationList];
    updated[index] = { ...updated[index], [field]: value };
    setEducationList(updated);
  };

  const handleRemoveEducation = (index: number) => {
    if (educationList.length === 1) {
      setEducationList([
        {
          degree: '',
          institution: '',
          department: '',
          graduationYear: '',
          cgpa: '',
        },
      ]);
    } else {
      setEducationList(educationList.filter((_, i) => i !== index));
    }
  };

  // Skill Helpers
  const handleAddSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) {
      setNewSkillError('Please enter a skill name.');
      return;
    }
    if (skillsList.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillError(`Skill "${trimmed}" is already added.`);
      return;
    }

    setSkillsList([
      ...skillsList,
      {
        name: trimmed,
        category: 'TECHNOLOGIES',
        level: newSkillLevel,
      },
    ]);
    setNewSkillName('');
    setNewSkillError(null);
  };

  const handleRemoveSkill = (skillNameToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s.name.toLowerCase() !== skillNameToRemove.toLowerCase()));
  };

  // Resume Helpers
  const handleResumeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      if (onShowToast) onShowToast('Only PDF files (.pdf) are supported.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (onShowToast) onShowToast('File size must be under 5 MB.', 'error');
      return;
    }

    setUploadingResume(true);
    try {
      const res = await uploadResume(file);
      if (res && res.resume) {
        setCurrentResume(res.resume);
        if (onShowToast) onShowToast('Resume uploaded successfully.', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to upload resume.';
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to remove your resume?')) return;
    setDeletingResume(true);
    try {
      await deleteResume();
      setCurrentResume(null);
      if (onShowToast) onShowToast('Resume removed.', 'info');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove resume.';
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setDeletingResume(false);
    }
  };

  // Global Save Handler
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Filter valid educations
    const validEducations = educationList
      .filter((edu) => edu.degree.trim() || edu.institution.trim())
      .map((edu) => ({
        ...edu,
        degree: edu.degree.trim(),
        institution: edu.institution.trim(),
        department: edu.department?.trim() || '',
        graduationYear: edu.graduationYear?.trim() || '',
        cgpa: edu.cgpa?.trim() || '',
      }));

    setSaving(true);
    try {
      const updatedProfile = await updateFullProfile({
        personalInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
          bio: bio.trim(),
        },
        careerGoal: {
          targetJobRole: targetJobRole.trim(),
          experienceLevel: experienceLevel.trim(),
          preferredLocation: preferredLocation.trim(),
          preferredIndustry: preferredIndustry.trim(),
          careerGoal: careerGoal.trim(),
          openToWork,
        },
        links: {
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
          otherWebsiteUrl: otherWebsiteUrl.trim(),
        },
        education: validEducations,
        skills: skillsList,
      });

      if (onShowToast) {
        onShowToast('Profile updated successfully.', 'success');
      }
      onSaveSuccess(updatedProfile);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save changes. Please try again.';
      setErrorMessage(msg);
      if (onShowToast) {
        onShowToast(msg, 'error');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-50 border border-lime-200 text-[#6d8d00] text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#8DB600] animate-pulse"></span>
            Inline Edit Mode
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Profile</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Update your personal details, education records, career preferences, skills, links, and resume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
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
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Profile Photo Row */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#8DB600]" />
          Profile Photo
        </h3>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={fullName}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-lime-50 border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-lime-100 border border-lime-200 flex items-center justify-center text-lime-900 font-extrabold text-2xl">
                {fullName.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-800">Your Avatar</p>
            <p className="text-xs text-gray-500">
              Clear square photos (JPG, PNG or WEBP, max 2MB) make your profile stand out to recruiters.
            </p>
            {onChangePhoto && (
              <button
                type="button"
                onClick={onChangePhoto}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-lime-400" />
                <span>Change Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-[#8DB600]" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Santhosh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent transition-all"
            />
          </div>

          {/* Email (Read-Only) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-gray-400 font-normal">(Account identifier)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium text-gray-500 cursor-not-allowed"
              />
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent transition-all"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Chennai, India"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent transition-all"
            />
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Short Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief professional summary about your aspirations, passion for building software, and tech stack..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] focus:border-transparent transition-all resize-y"
            />
          </div>
        </div>
      </div>

      {/* 3. Education Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#8DB600]" />
            Education
          </h3>
          <button
            type="button"
            onClick={handleAddEducation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] text-xs font-bold transition-colors cursor-pointer border border-lime-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>

        <div className="space-y-4">
          {educationList.map((edu, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 relative space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/60">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Education Record #{idx + 1}
                </span>
                {educationList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
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
                    onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
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
                    onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                    placeholder="e.g. Meenakshi College of Engineering"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Department / Specialization
                  </label>
                  <input
                    type="text"
                    value={edu.department || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'department', e.target.value)}
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
                    onChange={(e) => handleUpdateEducation(idx, 'graduationYear', e.target.value)}
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
                    onChange={(e) => handleUpdateEducation(idx, 'cgpa', e.target.value)}
                    placeholder="e.g. 8.1"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Career Information */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#8DB600]" />
          Career Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Target Job Role */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Job Role
            </label>
            <input
              type="text"
              value={targetJobRole}
              onChange={(e) => setTargetJobRole(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all cursor-pointer"
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
              Preferred Location
            </label>
            <input
              type="text"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="e.g. Chennai, Bangalore, Remote"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Industry
            </label>
            <input
              type="text"
              value={preferredIndustry}
              onChange={(e) => setPreferredIndustry(e.target.value)}
              placeholder="e.g. Software & Technology, Fintech, Edtech"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* Career Goal */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Career Goal / Objective
            </label>
            <textarea
              rows={2}
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="Describe what kind of projects or roles you want to grow into over the next 1-2 years..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all resize-y"
            />
          </div>

          {/* Open to Work */}
          <div className="sm:col-span-2 p-4 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Open to Work</p>
              <p className="text-xs text-gray-500">
                Signals to prospective recruiters and hiring partners that you are actively seeking opportunities.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={openToWork}
                onChange={(e) => setOpenToWork(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DB600]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 5. Skills */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Code className="w-4 h-4 text-[#8DB600]" />
          Skills
        </h3>

        {/* Existing Skills Cloud */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Current Skills ({skillsList.length})
          </label>
          {skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {skillsList.map((skill) => (
                <div
                  key={skill.name}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-lime-50/60 border border-gray-200 text-xs font-semibold text-gray-800 transition-colors"
                >
                  <span>{skill.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-lime-100 text-lime-800">
                    {skill.level || 'Intermediate'}
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
            <p className="text-xs text-gray-400 italic">No skills added yet. Add your core technical skills below.</p>
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
                setNewSkillError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="e.g. Python, React, Spring Boot, SQL, Git..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
            />

            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as any)}
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

          {newSkillError && <p className="text-xs text-rose-600 font-medium">{newSkillError}</p>}
        </div>
      </div>

      {/* 6. Professional Links */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#8DB600]" />
          Professional Links
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* GitHub */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-gray-600" />
              <span>GitHub Profile</span>
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5 text-blue-600" />
              <span>LinkedIn Profile</span>
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portfolio Website</span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://myportfolio.dev"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>

          {/* Other Website */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              <span>Other Website / Blog</span>
            </label>
            <input
              type="url"
              value={otherWebsiteUrl}
              onChange={(e) => setOtherWebsiteUrl(e.target.value)}
              placeholder="https://blog.dev"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] transition-all"
            />
          </div>
        </div>
      </div>

      {/* 7. Resume Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8DB600]" />
          Resume / CV
        </h3>

        <div className="space-y-4">
          {currentResume && currentResume.url ? (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{currentResume.filename}</p>
                  <p className="text-xs text-gray-500">
                    {currentResume.formattedFileSize || 'PDF Document'} • Uploaded
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentResume.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Download / View</span>
                </a>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="px-3 py-1.5 rounded-lg bg-lime-50 border border-lime-200 text-[#6d8d00] hover:bg-lime-100 text-xs font-semibold cursor-pointer"
                >
                  {uploadingResume ? 'Uploading...' : 'Upload New'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteResume}
                  disabled={deletingResume}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  title="Remove Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 text-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-800">Upload your Resume (PDF)</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Recruiters check your resume when applying for jobs and capstone projects. Max size: 5 MB.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingResume}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {uploadingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{uploadingResume ? 'Uploading...' : 'Select PDF File'}</span>
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleResumeFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4">
        <p className="text-xs text-gray-500 hidden sm:block">
          Ensure all required details are filled. Changes will immediately update your overview.
        </p>

        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
