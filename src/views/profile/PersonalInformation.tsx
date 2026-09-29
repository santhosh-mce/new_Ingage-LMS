"use client";
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  Pencil,
  FileText,
  X,
  Check,
  Loader2,
  Link2
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  ProfileDto,
  updatePersonalInfo,
  updateProfessionalLinks
} from '../../api/profileApi';

interface PersonalInformationProps {
  user: UserProfile | null;
  profile: ProfileDto | null;
  onEdit?: () => void;
  onRefresh?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PersonalInformation: React.FC<PersonalInformationProps> = ({
  user,
  profile,
  onEdit,
  onRefresh,
  onShowToast,
}) => {
  const p = profile?.personalInfo;
  const links = profile?.links;

  // Inline editing state for Personal Info
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [fullName, setFullName] = useState(p?.fullName || user?.name || '');
  const [phone, setPhone] = useState(p?.phone || '');
  const [location, setLocation] = useState(p?.location || '');
  const [bio, setBio] = useState(p?.bio || '');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Inline editing state for Professional Links
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState(links?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(links?.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(links?.portfolioUrl || '');
  const [otherWebsiteUrl, setOtherWebsiteUrl] = useState(links?.otherWebsiteUrl || '');
  const [savingLinks, setSavingLinks] = useState(false);

  // Sync state when profile changes
  useEffect(() => {
    if (p) {
      setFullName(p.fullName || user?.name || '');
      setPhone(p.phone || '');
      setLocation(p.location || '');
      setBio(p.bio || '');
    }
  }, [p, user]);

  useEffect(() => {
    if (links) {
      setLinkedinUrl(links.linkedinUrl || '');
      setGithubUrl(links.githubUrl || '');
      setPortfolioUrl(links.portfolioUrl || '');
      setOtherWebsiteUrl(links.otherWebsiteUrl || '');
    }
  }, [links]);

  // Handle Save Personal Info
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      if (onShowToast) onShowToast('Full name is required.', 'error');
      return;
    }

    setSavingPersonal(true);
    try {
      await updatePersonalInfo({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        bio: bio.trim(),
      });
      setIsEditingPersonal(false);
      if (onRefresh) onRefresh();
      if (onShowToast) onShowToast('Personal information updated successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update personal information.';
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleCancelPersonal = () => {
    setFullName(p?.fullName || user?.name || '');
    setPhone(p?.phone || '');
    setLocation(p?.location || '');
    setBio(p?.bio || '');
    setIsEditingPersonal(false);
  };

  // Handle Save Professional Links
  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLinks(true);
    try {
      await updateProfessionalLinks({
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        otherWebsiteUrl: otherWebsiteUrl.trim(),
      });
      setIsEditingLinks(false);
      if (onRefresh) onRefresh();
      if (onShowToast) onShowToast('Professional links updated successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update professional links.';
      if (onShowToast) onShowToast(msg, 'error');
    } finally {
      setSavingLinks(false);
    }
  };

  const handleCancelLinks = () => {
    setLinkedinUrl(links?.linkedinUrl || '');
    setGithubUrl(links?.githubUrl || '');
    setPortfolioUrl(links?.portfolioUrl || '');
    setOtherWebsiteUrl(links?.otherWebsiteUrl || '');
    setIsEditingLinks(false);
  };

  const email = p?.email || user?.email || 'Not provided';
  const displayLocation = p?.location || 'Not provided';
  const displayPhone = p?.phone || 'Not provided';
  const displayBio = p?.bio || 'No bio added yet. Tell recruiters and mentors about your passions and goals.';

  return (
    <div className="space-y-6">
      {/* Personal Information Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-[#8DB600]" />
              Personal Information
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Your verified account details, contact information, and professional bio
            </p>
          </div>
          {!isEditingPersonal && (
            <button
              onClick={() => setIsEditingPersonal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs"
              title="Edit Personal Information"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* INLINE EDIT MODE */}
        {isEditingPersonal ? (
          <form onSubmit={handleSavePersonal} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  About Me / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a brief bio about your goals and tech skills..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600] resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancelPersonal}
                disabled={savingPersonal}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPersonal}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {savingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{savingPersonal ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY OVERVIEW MODE */
          <div className="space-y-6">
            {/* Bio Section */}
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>About Me / Bio</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {displayBio}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Full Name */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Full Name</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{fullName || 'Not provided'}</p>
              </div>

              {/* Email */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>Email</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{email}</p>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>Phone</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{displayPhone}</p>
              </div>

              {/* Location */}
              <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Location</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{displayLocation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Professional Links Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#8DB600]" />
              Professional Links
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Connect your developer profiles, portfolio, and social presence
            </p>
          </div>
          {!isEditingLinks && (
            <button
              onClick={() => setIsEditingLinks(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-[#6d8d00] hover:text-[#5b7500] font-semibold text-xs transition-colors cursor-pointer border border-lime-200 shadow-xs"
              title="Edit Professional Links"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* INLINE EDIT MODE FOR LINKS */}
        {isEditingLinks ? (
          <form onSubmit={handleSaveLinks} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-gray-700" />
                  <span>GitHub Profile URL</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portfolio URL</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://myportfolio.dev"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  <span>Other Website / Blog URL</span>
                </label>
                <input
                  type="url"
                  value={otherWebsiteUrl}
                  onChange={(e) => setOtherWebsiteUrl(e.target.value)}
                  placeholder="https://blog.dev"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8DB600]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancelLinks}
                disabled={savingLinks}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingLinks}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {savingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{savingLinks ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY OVERVIEW MODE FOR LINKS */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LinkedIn */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <Linkedin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500">LinkedIn Profile</div>
                  {links?.linkedinUrl ? (
                    <a
                      href={links.linkedinUrl.startsWith('http') ? links.linkedinUrl : `https://${links.linkedinUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-blue-600 hover:underline truncate block"
                    >
                      {links.linkedinUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No link added</span>
                  )}
                </div>
              </div>
              {links?.linkedinUrl && (
                <a
                  href={links.linkedinUrl.startsWith('http') ? links.linkedinUrl : `https://${links.linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* GitHub */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-gray-900 text-white shrink-0">
                  <Github className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500">GitHub Profile</div>
                  {links?.githubUrl ? (
                    <a
                      href={links.githubUrl.startsWith('http') ? links.githubUrl : `https://${links.githubUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-gray-800 hover:underline truncate block"
                    >
                      {links.githubUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No link added</span>
                  )}
                </div>
              </div>
              {links?.githubUrl && (
                <a
                  href={links.githubUrl.startsWith('http') ? links.githubUrl : `https://${links.githubUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Portfolio */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500">Portfolio Website</div>
                  {links?.portfolioUrl ? (
                    <a
                      href={links.portfolioUrl.startsWith('http') ? links.portfolioUrl : `https://${links.portfolioUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-emerald-600 hover:underline truncate block"
                    >
                      {links.portfolioUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No link added</span>
                  )}
                </div>
              </div>
              {links?.portfolioUrl && (
                <a
                  href={links.portfolioUrl.startsWith('http') ? links.portfolioUrl : `https://${links.portfolioUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Other Website */}
            <div className="p-4 rounded-xl bg-gray-50/60 border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500">Other Link</div>
                  {links?.otherWebsiteUrl ? (
                    <a
                      href={links.otherWebsiteUrl.startsWith('http') ? links.otherWebsiteUrl : `https://${links.otherWebsiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-purple-600 hover:underline truncate block"
                    >
                      {links.otherWebsiteUrl}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No link added</span>
                  )}
                </div>
              </div>
              {links?.otherWebsiteUrl && (
                <a
                  href={links.otherWebsiteUrl.startsWith('http') ? links.otherWebsiteUrl : `https://${links.otherWebsiteUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
