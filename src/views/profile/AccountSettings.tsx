"use client";
import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
  Bell,
  Trash2
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AccountSettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  user,
  onLogout,
  onNavigate,
  onShowToast,
}) => {
  const [courseNotif, setCourseNotif] = useState(true);
  const [careerNotif, setCareerNotif] = useState(true);
  const [credentialNotif, setCredentialNotif] = useState(true);

  const handleToggle = (type: 'course' | 'career' | 'credential') => {
    if (type === 'course') setCourseNotif(!courseNotif);
    if (type === 'career') setCareerNotif(!careerNotif);
    if (type === 'credential') setCredentialNotif(!credentialNotif);

    if (onShowToast) onShowToast('Notification preference updated.', 'info');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#8DB600]" />
          <span>Account & Security Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage your credentials, authentication status, notifications, and session
        </p>
      </div>

      {/* 1. Account Security & Verification Status */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Email Verification & Account Status</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white border border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Registered Email
            </span>
            <p className="text-sm font-bold text-gray-900 break-words">{user?.email || 'N/A'}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Verified Email
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Access Permission Level
            </span>
            <p className="text-sm font-bold text-gray-900 capitalize">{user?.role?.toLowerCase() || 'Learner'}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Shield className="w-3 h-3" />
              Standard Learner Access
            </span>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-700" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3">
          {/* Course Notifications */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Skill Forge Course Notifications</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Updates on enrolled courses, new modules, quizzes, and learning reminders
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={courseNotif}
                onChange={() => handleToggle('course')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DB600]"></div>
            </label>
          </div>

          {/* Career Notifications */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Career Compass & Job Opportunity Alerts</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Notifications when new jobs matching your target role become available
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={careerNotif}
                onChange={() => handleToggle('career')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DB600]"></div>
            </label>
          </div>

          {/* Credential Notifications */}
          <div className="p-4 rounded-xl bg-white border border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Credential Edge Updates</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Verification status updates and credential readiness alerts
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={credentialNotif}
                onChange={() => handleToggle('credential')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DB600]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Password Management */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-700" />
          <span>Password & Authentication</span>
        </h3>

        <div className="p-4 rounded-xl bg-white border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Change Password</p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-md">
              Your account password is encrypted and securely stored using BCrypt. You can reset or update your password via our authentication flow.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/forgot-password')}
            className="shrink-0 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* 4. Session & Sign Out */}
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out of LMS Session</span>
            </h3>
            <p className="text-xs text-rose-700/80 mt-0.5">
              Safely end your current session on this device. You will need to log in again to access enrolled courses.
            </p>
          </div>

          <button
            onClick={onLogout}
            id="profile-logout-btn"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
