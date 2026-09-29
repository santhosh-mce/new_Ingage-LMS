"use client";
import React from 'react';
import {
  X,
  User,
  Shield,
  Briefcase,
  MapPin,
  GraduationCap,
  Sparkles,
  FolderGit2,
  FileText,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { ProfileDto } from '../../api/profileApi';
import { getAccessibleImageUrl } from '../../api/authApi';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileDto | null;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen || !profile) return null;

  const p = profile.personalInfo;
  const fullName = p?.fullName || 'Learner';
  const role = profile.careerGoal?.targetJobRole || 'Aspiring Professional';
  const location = p?.location || 'India';
  const avatarUrl = getAccessibleImageUrl(p?.profileImage);
  const isOpenToWork = profile.careerGoal?.openToWork;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with close */}
        <div className="relative bg-gradient-to-r from-slate-900 via-gray-900 to-slate-950 p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-lime-400 to-[#8DB600] text-gray-900 font-extrabold text-3xl flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                {initials}
              </div>
            )}

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
                {isOpenToWork && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Open to Work
                  </span>
                )}
              </div>
              <p className="text-lime-400 font-semibold text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="w-4 h-4" />
                {role}
              </p>
              <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Bio */}
          {p?.bio && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                {p.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Verified Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 rounded-xl bg-lime-50 text-lime-900 text-xs font-semibold border border-lime-200"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Education</h3>
              <div className="space-y-3">
                {profile.education.map((e) => (
                  <div key={e.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-[#8DB600] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{e.degree}</h4>
                      <p className="text-xs text-gray-600">{e.institution}</p>
                      {e.graduationYear && <p className="text-[11px] text-gray-400 mt-0.5">Class of {e.graduationYear}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile.projects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portfolio Projects</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{proj.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{proj.description}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/60">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-gray-700 hover:underline flex items-center gap-1"
                        >
                          <Github className="w-3.5 h-3.5" /> Code
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#8DB600] hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Globe className="w-3.5 h-3.5" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            InGage Career Flow LMS • Verified Public Portfolio
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
