"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Globe,
  User,
  ShieldCheck,
  Mail,
  CreditCard,
  Bell,
  Sliders,
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  Send,
  Lock,
  Database,
  Cpu,
  Clock,
  ExternalLink,
  Shield,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  getAdminSettings,
  updateAdminSettings,
  updateAdminGeneralSettings,
  updateAdminPassword,
  sendAdminTestEmail,
  uploadAdminAvatar,
  updateAdminUser
} from '../../api/adminApi';

export interface AdminSettingsPageProps {
  onNavigate?: (path: string) => void;
  currentUser?: any;
  onShowToast?: (msg: string) => void;
}

type TabType =
  | 'general'
  | 'profile'
  | 'security'
  | 'email'
  | 'payments'
  | 'notifications'
  | 'platform'
  | 'system';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'profile', label: 'Admin Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'platform', label: 'Platform', icon: Sliders },
  { id: 'system', label: 'System', icon: Server },
];

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  onNavigate,
  currentUser,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // General Settings
  const [generalForm, setGeneralForm] = useState({
    platform_name: 'Ingage',
    platform_description: '',
    support_email: 'support@ingage.com',
    support_phone: '+1 (555) 000-1234',
    website_url: 'https://ingage-lms.vercel.app',
    timezone: 'Asia/Kolkata (IST)',
    default_language: 'English',
  });

  // Admin Profile Settings
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Administrator',
    email: currentUser?.email || 'admin@ingage.com',
    phone: currentUser?.phone || '',
    role: currentUser?.role || 'ADMIN',
    status: 'Active',
    profileImage: currentUser?.profileImage || currentUser?.avatarUrl || '',
    lastLogin: currentUser?.lastLogin || '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Security / Password
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email Configuration
  const [emailConfig, setEmailConfig] = useState({
    provider: 'In-App / System Logger',
    status: 'Active (In-App Verification & Database Logging)',
    email_sender_name: 'Ingage LMS Support',
    email_sender_email: 'no-reply@ingage.com',
    credentialsMasked: '••••••••••••',
  });
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Payments (Razorpay)
  const [paymentsConfig, setPaymentsConfig] = useState({
    provider: 'Razorpay',
    currency: 'INR',
    configured: true,
    status: 'Connected',
    mode: 'Test',
    keyIdMasked: 'rzp_test_••••••••',
    secretMasked: '••••••••••••',
    webhookStatus: 'Connected / Active',
  });

  // Notifications
  const [notificationToggles, setNotificationToggles] = useState<Record<string, boolean>>({
    notify_new_user_registration: true,
    notify_course_enrollment: true,
    notify_payment_success: true,
    notify_certificate_generated: true,
    notify_password_reset: true,
    notify_email_verification: true,
  });

  // Platform Controls
  const [platformToggles, setPlatformToggles] = useState<Record<string, boolean>>({
    allow_user_registration: true,
    require_email_verification: false,
    allow_course_enrollment: true,
    allow_opportunity_applications: true,
    maintenance_mode: false,
  });

  // System Telemetry
  const [systemTelemetry, setSystemTelemetry] = useState<Record<string, any>>({
    appName: 'Ingage LMS Platform',
    appVersion: '1.0.0',
    backendStatus: 'Operational / Healthy',
    databaseStatus: 'Connected (PostgreSQL / HikariCP Pool Size: 20)',
    apiPrefix: '/api',
    serverTime: '',
    javaVersion: '26',
    springVersion: '4.1.1',
    environment: 'Production / Live',
    uptime: 'Loading...',
  });

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSettings();
      if (data) {
        if (data.general) {
          setGeneralForm((prev) => ({
            ...prev,
            ...data.general,
          }));
        }
        if (data.email) {
          setEmailConfig((prev) => ({
            ...prev,
            ...data.email,
          }));
        }
        if (data.payments) {
          setPaymentsConfig((prev) => ({
            ...prev,
            ...data.payments,
          }));
        }
        if (data.notifications) {
          setNotificationToggles((prev) => ({
            ...prev,
            ...data.notifications,
          }));
        }
        if (data.platform) {
          setPlatformToggles((prev) => ({
            ...prev,
            ...data.platform,
          }));
        }
        if (data.system) {
          setSystemTelemetry(data.system);
        }
      }

      // Sync currentUser into profile form
      if (currentUser) {
        setProfileForm((prev) => ({
          ...prev,
          name: currentUser.name || prev.name,
          email: currentUser.email || prev.email,
          phone: currentUser.phone || prev.phone,
          role: currentUser.role || prev.role,
          profileImage: currentUser.profileImage || currentUser.avatarUrl || prev.profileImage,
          lastLogin: currentUser.lastLogin || prev.lastLogin,
        }));
      }

      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Failed to load admin settings:', err);
      setError(err?.response?.data?.error || 'Unable to load settings from server. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleTabChange = (tab: TabType) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs without saving?'
      );
      if (!confirmLeave) return;
    }
    setActiveTab(tab);
    setError(null);
    setPasswordError(null);
    setTestEmailStatus(null);
    setHasUnsavedChanges(false);
  };

  // --- SAVE GENERAL SETTINGS ---
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateAdminGeneralSettings(generalForm);
      setHasUnsavedChanges(false);
      notify('Settings saved successfully.');
    } catch (err: any) {
      console.error('Failed to save general settings:', err);
      setError(err?.response?.data?.error || 'Failed to save general settings.');
    } finally {
      setSaving(false);
    }
  };

  // --- SAVE ADMIN PROFILE ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id && !currentUser?.userId) {
      setError('Cannot identify logged-in admin user ID.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const userId = currentUser.id || currentUser.userId;
      await updateAdminUser(userId, {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setHasUnsavedChanges(false);
      notify('Profile updated successfully.');
    } catch (err: any) {
      console.error('Failed to update admin profile:', err);
      setError(err?.response?.data?.error || 'Failed to update admin profile.');
    } finally {
      setSaving(false);
    }
  };

  // --- AVATAR UPLOAD ---
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be less than 5 MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      const res = await uploadAdminAvatar(file);
      const newUrl = res.profileImage || res.avatarUrl;
      if (newUrl) {
        setProfileForm((prev) => ({ ...prev, profileImage: newUrl }));
        notify('Profile image updated successfully.');
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError(err?.response?.data?.error || 'Failed to upload profile image.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // --- CHANGE PASSWORD ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!securityForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!securityForm.newPassword) {
      setPasswordError('New password is required.');
      return;
    }
    if (securityForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      await updateAdminPassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
        confirmPassword: securityForm.confirmPassword,
      });
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      notify('Password updated successfully.');
    } catch (err: any) {
      console.error('Password update failed:', err);
      setPasswordError(err?.response?.data?.error || 'Failed to update password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  // --- SEND TEST EMAIL ---
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setTestEmailStatus({
        success: false,
        message: 'Please enter a valid recipient email address.',
      });
      return;
    }

    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await sendAdminTestEmail(testEmailRecipient.trim());
      setTestEmailStatus({
        success: true,
        message: res.message || `Test email dispatched successfully to ${testEmailRecipient}.`,
      });
      notify('Test email sent successfully.');
    } catch (err: any) {
      console.error('Test email dispatch failed:', err);
      setTestEmailStatus({
        success: false,
        message: err?.response?.data?.error || 'Failed to dispatch test email.',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  // --- SAVE NOTIFICATION PREFERENCES ---
  const handleSaveNotifications = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAdminSettings(notificationToggles);
      setHasUnsavedChanges(false);
      notify('Notification settings saved successfully.');
    } catch (err: any) {
      console.error('Failed to save notifications:', err);
      setError(err?.response?.data?.error || 'Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  };

  // --- SAVE PLATFORM SETTINGS ---
  const handleSavePlatform = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAdminSettings(platformToggles);
      setHasUnsavedChanges(false);
      notify('Platform controls saved successfully.');
    } catch (err: any) {
      console.error('Failed to save platform settings:', err);
      setError(err?.response?.data?.error || 'Failed to save platform controls.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-400" />
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your LMS platform configuration, account preferences, and system settings.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadSettings}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You have unsaved changes. Make sure to click save before navigating away.</span>
        </div>
      )}

      {/* Main Settings Body */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 shadow-xl">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading platform configuration from PostgreSQL...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left-Side Settings Navigation Tabs */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-2.5 shadow-xl space-y-1 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-1 lg:gap-0 sticky top-24">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right-Side Tab Content Panel */}
          <div className="lg:col-span-9 space-y-6">
            {/* 1. GENERAL SETTINGS TAB */}
            {activeTab === 'general' && (
              <form onSubmit={handleSaveGeneral} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    General Settings
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage core LMS metadata, platform identity, and contact information.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Platform Name</label>
                    <input
                      type="text"
                      value={generalForm.platform_name}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, platform_name: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Platform Description</label>
                    <textarea
                      rows={3}
                      value={generalForm.platform_description}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, platform_description: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Support Email</label>
                    <input
                      type="email"
                      value={generalForm.support_email}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, support_email: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Support Phone</label>
                    <input
                      type="text"
                      value={generalForm.support_phone}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, support_phone: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Website URL</label>
                    <input
                      type="url"
                      value={generalForm.website_url}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, website_url: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Timezone</label>
                    <select
                      value={generalForm.timezone}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, timezone: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+05:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York (EST)">America/New_York (EST/EDT)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT/BST)</option>
                      <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC+08:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Default Language</label>
                    <select
                      value={generalForm.default_language}
                      onChange={(e) => {
                        setGeneralForm({ ...generalForm, default_language: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. ADMIN PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Admin Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage your personal administrator identity and contact details.
                  </p>
                </div>

                {/* Profile Image & Quick Status */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                      {profileForm.profileImage ? (
                        <img
                          src={profileForm.profileImage}
                          alt="Admin avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-950/70 rounded-2xl flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {profileForm.role}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {profileForm.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Upload a new photo (Max 5MB • JPG, PNG, WEBP).
                    </div>

                    <div className="pt-1">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarFileChange}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, name: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Admin email is tied to authentication credentials and cannot be changed here.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Login</label>
                    <div className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-400">
                      {profileForm.lastLogin ? new Date(profileForm.lastLogin).toLocaleString() : 'Active session'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Updating...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* 3. SECURITY TAB */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Security & Password
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your account password with Spring Security cryptographic hashing.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="max-w-md space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={securityForm.currentPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={securityForm.newPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                        placeholder="Minimum 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={securityForm.confirmPassword}
                        onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                        className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                        required
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="font-medium text-slate-300">Password Requirements:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    <li>Must be between 8 and 72 characters</li>
                    <li>Securely hashed with BCrypt before storage in PostgreSQL</li>
                    <li>Never stored or logged in plain text</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* 4. EMAIL SETTINGS TAB */}
            {activeTab === 'email' && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-400" />
                    Email Architecture & Dispatch
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect current email services, verify sender identity, and test transactional dispatch.
                  </p>
                </div>

                {/* Email Service Status Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Active Email Provider</div>
                    <div className="text-base font-semibold text-slate-100 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {emailConfig.provider}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {emailConfig.status}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Sender Identity</div>
                    <div className="text-sm font-semibold text-slate-100 mt-1">
                      {emailConfig.email_sender_name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {emailConfig.email_sender_email}
                    </div>
                  </div>
                </div>

                {/* Supported Notifications List */}
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-300">Supported Email Notification Types:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Account Registration & Welcome
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Login OTP Verification
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Password Reset Requests
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Payment Success & Receipts
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Course Enrollment Confirmation
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Certificate Issuance Notification
                    </div>
                  </div>
                </div>

                {/* Live Test Email Tool */}
                <form onSubmit={handleSendTestEmail} className="pt-4 border-t border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Send Test Email</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send a live test message to verify outbound delivery and logger dispatch.
                    </p>
                  </div>

                  {testEmailStatus && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 ${
                        testEmailStatus.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {testEmailStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span>{testEmailStatus.message}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      disabled={sendingTestEmail}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-emerald-400" />
                      {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 5. PAYMENTS TAB (Razorpay) */}
            {activeTab === 'payments' && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Payment Gateway (Razorpay)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingage LMS integrates with Razorpay for secure course purchases and checkout.
                  </p>
                </div>

                {/* Gateway Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Payment Provider</div>
                    <div className="text-base font-semibold text-slate-100 mt-1">
                      {paymentsConfig.provider}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Currency: {paymentsConfig.currency} (₹)</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Gateway Status</div>
                    <div className="text-base font-semibold text-emerald-400 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {paymentsConfig.status}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Operating in {paymentsConfig.mode} Mode</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Webhook Status</div>
                    <div className="text-base font-semibold text-slate-200 mt-1">
                      {paymentsConfig.webhookStatus}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Instant order capture enabled</div>
                  </div>
                </div>

                {/* Credentials Inspection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Razorpay Key ID</label>
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-300 flex items-center justify-between">
                      <span>{paymentsConfig.keyIdMasked}</span>
                      <span className="text-[11px] font-sans px-2 py-0.5 bg-slate-800 rounded text-slate-400">Masked</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Razorpay Key Secret</label>
                    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-300 flex items-center justify-between">
                      <span>{paymentsConfig.secretMasked}</span>
                      <span className="text-[11px] font-sans px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                        Protected Server-Side
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Security policy: Razorpay secrets are stored in server environment variables and are never transmitted to client browsers.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-400" />
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Control which platform events trigger automated transactional notifications.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'notify_new_user_registration',
                      title: 'New User Registration',
                      desc: 'Send welcome notification upon student/instructor account creation.',
                    },
                    {
                      key: 'notify_course_enrollment',
                      title: 'Course Enrollment',
                      desc: 'Notify learners when they successfully enroll in a course or roadmap.',
                    },
                    {
                      key: 'notify_payment_success',
                      title: 'Payment Success & Invoices',
                      desc: 'Send receipt and transaction confirmation upon Razorpay payment capture.',
                    },
                    {
                      key: 'notify_certificate_generated',
                      title: 'Certificate Issuance',
                      desc: 'Notify learner when their course completion certificate is generated.',
                    },
                    {
                      key: 'notify_password_reset',
                      title: 'Password Reset Alerts',
                      desc: 'Alert users when a password reset code or link is generated.',
                    },
                    {
                      key: 'notify_email_verification',
                      title: 'Email Verification OTP',
                      desc: 'Send 6-digit authentication code during OTP-based sign-in.',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{item.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!notificationToggles[item.key]}
                          onChange={(e) => {
                            setNotificationToggles({
                              ...notificationToggles,
                              [item.key]: e.target.checked,
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Notification Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* 7. PLATFORM CONTROLS TAB */}
            {activeTab === 'platform' && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    Platform Governance & Access Controls
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Control global user onboarding policies and application behaviors.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'allow_user_registration',
                      title: 'Allow New User Registration',
                      desc: 'Allow new students and candidates to register on Ingage LMS.',
                      warning: false,
                    },
                    {
                      key: 'require_email_verification',
                      title: 'Require Email Verification',
                      desc: 'Require students to verify their email before accessing enrolled courses.',
                      warning: false,
                    },
                    {
                      key: 'allow_course_enrollment',
                      title: 'Allow Course Enrollment',
                      desc: 'Permit new course enrollments and checkout orders.',
                      warning: false,
                    },
                    {
                      key: 'allow_opportunity_applications',
                      title: 'Allow Opportunity Applications',
                      desc: 'Allow learners to apply to internships and job listings on /opportunities.',
                      warning: false,
                    },
                    {
                      key: 'maintenance_mode',
                      title: 'Maintenance Mode',
                      desc: 'When active, platform displays a maintenance announcement to learners.',
                      warning: true,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                        item.warning && platformToggles[item.key]
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-950/40 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                          {item.title}
                          {item.warning && platformToggles[item.key] && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!platformToggles[item.key]}
                          onChange={(e) => {
                            setPlatformToggles({
                              ...platformToggles,
                              [item.key]: e.target.checked,
                            });
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePlatform}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Platform Controls'}
                  </button>
                </div>
              </div>
            )}

            {/* 8. SYSTEM INFORMATION TAB */}
            {activeTab === 'system' && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    System Information & Diagnostics
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time runtime telemetry reported by the Spring Boot backend and PostgreSQL database.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Application Name</div>
                    <div className="text-base font-semibold text-slate-100 mt-1">{systemTelemetry.appName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Version {systemTelemetry.appVersion}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Backend Status</div>
                    <div className="text-base font-semibold text-emerald-400 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {systemTelemetry.backendStatus}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Prefix: {systemTelemetry.apiPrefix}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Database Engine</div>
                    <div className="text-sm font-semibold text-emerald-400 mt-1">
                      {systemTelemetry.databaseStatus}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Uptime</div>
                    <div className="text-base font-semibold text-slate-200 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      {systemTelemetry.uptime}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Runtime Environment</div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      Java {systemTelemetry.javaVersion} • Spring Boot {systemTelemetry.springVersion}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Server Clock (UTC)</div>
                    <div className="text-xs font-mono text-slate-300 mt-1">
                      {systemTelemetry.serverTime || 'Synchronized'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Environment secrets, database credentials, JWT keys, and Razorpay tokens are strictly managed server-side and shielded from public APIs.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
