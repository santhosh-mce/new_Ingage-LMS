"use client";
import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Pencil,
  Mail,
  Shield,
  CheckCircle,
  Camera,
  MapPin,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Sparkles,
  Award
} from 'lucide-react';
import { UserProfile } from '../../types';
import { ProfileDto } from '../../api/profileApi';
import { getAccessibleImageUrl } from '../../api/authApi';

interface ProfileHeaderProps {
  user: UserProfile | null;
  profile: ProfileDto | null;
  onEditProfile: () => void;
  onChangePhoto?: () => void;
  onViewPublicProfile?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  profile,
  onEditProfile,
  onChangePhoto,
  onViewPublicProfile,
}) => {
  const [imageError, setImageError] = useState(false);

  const rawAvatar = profile?.personalInfo?.profileImage || user?.avatarUrl || user?.profileImage;

  useEffect(() => {
    setImageError(false);
  }, [rawAvatar]);

  const displayAvatar = getAccessibleImageUrl(rawAvatar);

  const fullName = profile?.personalInfo?.fullName || user?.name || 'Learner';
  const email = profile?.personalInfo?.email || user?.email || '';
  const location = profile?.personalInfo?.location || 'Location not set';
  const targetRole = profile?.careerGoal?.targetJobRole || 'Aspiring Professional';
  const experienceLevel = profile?.careerGoal?.experienceLevel || 'Fresher';
  const completionPercentage = profile?.profileCompletionPercentage ?? 40;
  const isOpenToWork = profile?.careerGoal?.openToWork ?? false;

  const educationDisplay = profile?.education?.[0]?.degree
    ? `${profile.education[0].degree}${profile.education[0].institution ? ` • ${profile.education[0].institution}` : ''}`
    : user?.highestQualification || 'Education not specified';
  const bio = profile?.personalInfo?.bio;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const roleDisplay = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : 'Learner';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-lime-50 rounded-full blur-3xl pointer-events-none opacity-80" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-44 h-44 bg-emerald-50 rounded-full blur-2xl pointer-events-none opacity-50" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Avatar & Identity details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full lg:w-auto">
          {/* Avatar with Photo update button */}
          <div className="relative group shrink-0">
            {displayAvatar && !imageError ? (
              <img
                src={displayAvatar}
                alt={fullName}
                onError={() => setImageError(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-lime-50 shadow-md border border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-lime-100 via-lime-200 to-emerald-200 border-2 border-lime-300/60 flex items-center justify-center text-lime-900 font-extrabold text-2xl sm:text-3xl shadow-xs ring-4 ring-lime-50">
                {initials}
              </div>
            )}

            {/* Change Photo Camera Overlay Button */}
            {onChangePhoto && (
              <button
                id="change-profile-photo-btn"
                type="button"
                onClick={onChangePhoto}
                className="absolute -top-1.5 -left-1.5 bg-slate-900 hover:bg-slate-950 text-white p-2 rounded-xl shadow-md transition-all cursor-pointer hover:scale-105 border-2 border-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                title="Change Profile Photo"
                aria-label="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5 text-lime-400" />
              </button>
            )}

            <div
              className="absolute -bottom-1 -right-1 bg-[#8DB600] text-white p-1 rounded-full ring-2 ring-white shadow-xs"
              title="Verified Student Account"
            >
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-lime-100 text-lime-800 border border-lime-200">
                <Shield className="w-3 h-3 text-lime-700" />
                {roleDisplay}
              </span>
              {isOpenToWork && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Open to Work
                </span>
              )}
            </div>

            {/* Target Job Role & Experience Level */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#8DB600]" />
                {targetRole}
              </span>
              <span className="text-gray-300">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {experienceLevel}
              </span>
            </div>

            {/* Education & Location */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                {educationDisplay}
              </span>
              {location && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {location}
                  </span>
                </>
              )}
            </div>

            {/* Short Bio */}
            {bio && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 pt-1 italic leading-relaxed">
                "{bio}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Profile Completion & Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-72 gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          {/* Profile Completion Meter */}
          <div className="w-full bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8DB600]" />
                Profile Completion
              </span>
              <span className={`font-bold ${completionPercentage >= 80 ? 'text-emerald-700' : 'text-[#8DB600]'}`}>
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8DB600] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <button
              id="edit-profile-open-btn"
              onClick={onEditProfile}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#8DB600] hover:bg-[#7ba000] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            {onViewPublicProfile && (
              <button
                id="view-public-profile-btn"
                onClick={onViewPublicProfile}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-xs sm:text-sm shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300"
                title="View Public Profile"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span>View Public Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
