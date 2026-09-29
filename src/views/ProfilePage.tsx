"use client";
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Award,
  FolderGit2,
  Settings,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Code,
  FileText,
  User as UserIcon,
  Pencil
} from 'lucide-react';
import { UserProfile } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUserThunk } from '../store/slices/authSlice';
import { getMyEnrollments, UserEnrollmentRecord } from '../api/paymentApi';
import { ProfileDto, getMyProfile } from '../api/profileApi';

import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileSummaryCards } from './profile/ProfileSummaryCards';
import { ProfileCompletionCard } from './profile/ProfileCompletionCard';
import { PersonalInformation } from './profile/PersonalInformation';
import { EducationSection } from './profile/EducationSection';
import { CareerGoalSection } from './profile/CareerGoalSection';
import { SkillsSection } from './profile/SkillsSection';
import { CareerCompassProfileSection } from './profile/CareerCompassProfileSection';
import { EnrolledCourses } from './profile/EnrolledCourses';
import { CredentialEdgeProfileSection } from './profile/CredentialEdgeProfileSection';
import { StudentProjectsSection } from './profile/StudentProjectsSection';
import { ResumeSection } from './profile/ResumeSection';
import { AccountSettings } from './profile/AccountSettings';
import { ProfileImageModal } from './profile/ProfileImageModal';
import { PublicProfileModal } from './profile/PublicProfileModal';
import { StudentCertificatesSection } from './profile/StudentCertificatesSection';
import { FullEditProfileForm } from './profile/FullEditProfileForm';

export type ProfileSubView =
  | 'overview'
  | 'compass'
  | 'learning'
  | 'credentials'
  | 'projects'
  | 'settings';

export type ProfileTab = ProfileSubView;

interface ProfilePageProps {
  initialTab?: string;
  currentUser?: UserProfile | null;
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  initialTab,
  currentUser: propUser,
  onNavigate,
  onShowToast,
}) => {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const activeUser = propUser || authUser;

  // Active view inside /profile: Default is 'overview'
  const mapInitialTabToView = (tab?: string): ProfileSubView => {
    if (!tab) return 'overview';
    if (tab === 'compass') return 'compass';
    if (tab === 'learning') return 'learning';
    if (tab === 'credentials' || tab === 'certificates') return 'credentials';
    if (tab === 'projects') return 'projects';
    if (tab === 'settings') return 'settings';
    // All personal, education, career, skills, resume map directly to overview
    return 'overview';
  };

  const [activeSubView, setActiveSubView] = useState<ProfileSubView>(
    mapInitialTabToView(initialTab)
  );

  // Profile data from backend
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Enrollments data for Skill Forge
  const [enrollments, setEnrollments] = useState<UserEnrollmentRecord[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Inline Full Edit Mode on the same /profile route
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals for image upload and public profile preview
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);

  const fetchProfileData = async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err: any) {
      console.warn('Failed to load user career profile:', err);
      setProfileError('Unable to load career profile data. Please check your connection and retry.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchEnrollmentsData = async () => {
    setLoadingEnrollments(true);
    try {
      const data = await getMyEnrollments();
      setEnrollments(data || []);
    } catch (err) {
      console.warn('Failed to load user enrollments in ProfilePage:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchEnrollmentsData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveSubView(mapInitialTabToView(initialTab));
    }
  }, [initialTab]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserThunk()).unwrap();
      if (onShowToast) {
        onShowToast('Logged out successfully.', 'info');
      }
      onNavigate('/');
    } catch {
      onNavigate('/');
    }
  };

  const subViews: Array<{ id: ProfileSubView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'overview', label: 'Profile Overview', icon: LayoutDashboard },
    { id: 'compass', label: 'Career Compass', icon: Compass },
    { id: 'learning', label: 'Skill Forge', icon: BookOpen },
    { id: 'credentials', label: 'Credential Edge', icon: Award },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full bg-[#f8fafc] min-h-[calc(100vh-4.5rem)] pb-16">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-8 space-y-6 max-w-7xl mx-auto">
        {/* Global Error Banner */}
        {profileError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
            <button
              onClick={() => {
                fetchProfileData();
                fetchEnrollmentsData();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-800 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Top Profile Header (Section 1 in requirements) */}
        {!isEditMode && (
          <ProfileHeader
            user={activeUser}
            profile={profile}
            onEditProfile={() => setIsEditMode(true)}
            onChangePhoto={() => setIsPhotoModalOpen(true)}
            onViewPublicProfile={() => setIsPublicModalOpen(true)}
          />
        )}

        {/* Top Summary Metric Cards (Section 9 in requirements) */}
        {!isEditMode && (
          <ProfileSummaryCards
            summary={profile?.summary}
            onNavigateTab={(tab) => {
              if (tab === 'credentials' || tab === 'certificates') setActiveSubView('credentials');
              else if (tab === 'learning') setActiveSubView('learning');
              else if (tab === 'projects') setActiveSubView('projects');
              else if (tab === 'compass') setActiveSubView('compass');
              else setActiveSubView('overview');
            }}
          />
        )}

        {/* INLINE FULL EDIT MODE (Section 2 & 3 in requirements) */}
        {isEditMode ? (
          <FullEditProfileForm
            user={activeUser}
            profile={profile}
            onSaveSuccess={(updated) => {
              setProfile(updated);
              setIsEditMode(false);
            }}
            onCancel={() => setIsEditMode(false)}
            onShowToast={onShowToast}
            onChangePhoto={() => setIsPhotoModalOpen(true)}
          />
        ) : (
          /* DEFAULT STATE — PROFILE OVERVIEW */
          <div className="space-y-6">
            {/* Sub-view Navigation Bar */}
            <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
              {subViews.map((view) => {
                const Icon = view.icon;
                const isActive = activeSubView === view.id;
                return (
                  <button
                    key={view.id}
                    id={`profile-subview-${view.id}`}
                    onClick={() => setActiveSubView(view.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-[#8DB600] text-gray-950 font-bold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{view.label}</span>
                  </button>
                );
              })}
            </div>

            {loadingProfile ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-[#8DB600] mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">Loading your profile data...</p>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW VIEW — Contains Top Dashboard Layout + Profile Completion + Core Sections */}
                {activeSubView === 'overview' && (
                  <div className="space-y-6 sm:space-y-8">
                    {/* TOP DASHBOARD LAYOUT: Two columns (Left ~40%: Set Your Target Career Role, Right ~60%: Skill Forge Enrolled Courses) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Target Career Role (~40%) */}
                      <div className="lg:col-span-5 w-full">
                        <CareerCompassProfileSection
                          compass={profile?.careerCompass || null}
                          onNavigate={onNavigate}
                          onNavigateTab={(tab) => {
                            if (tab === 'compass') setActiveSubView('compass');
                            else if (tab === 'career') setActiveSubView('overview');
                          }}
                          compactPreview={true}
                        />
                      </div>

                      {/* Right Column: Skill Forge — My Enrolled Courses (~60%) */}
                      <div className="lg:col-span-7 w-full">
                        <EnrolledCourses
                          enrollments={enrollments}
                          onNavigate={onNavigate}
                          loading={loadingEnrollments}
                        />
                      </div>
                    </div>

                    {/* Dynamic Profile Completion Checklist Card (Section 6 in requirements) */}
                    <ProfileCompletionCard
                      profile={profile}
                      onNavigateTab={() => setIsEditMode(true)}
                    />

                    {/* Section A: Personal Information & Professional Links (with ✏️ edit icons) */}
                    <PersonalInformation
                      user={activeUser}
                      profile={profile}
                      onRefresh={fetchProfileData}
                      onShowToast={onShowToast}
                    />

                    {/* Section B: Education Section (with ✏️ edit icon, multiple degrees, CGPA) */}
                    <EducationSection
                      educationList={profile?.education || []}
                      onRefresh={fetchProfileData}
                      onShowToast={onShowToast}
                    />

                    {/* Section C: Career Information & Goal (with ✏️ edit icon, Target Role, Experience, Location, Industry, Open to Work) */}
                    <CareerGoalSection
                      careerGoal={profile?.careerGoal || null}
                      onRefresh={fetchProfileData}
                      onNavigateToCompass={() => setActiveSubView('compass')}
                      onShowToast={onShowToast}
                    />

                    {/* Section D: Skills Section (with ✏️ edit icon, proficiency badges, add/remove) */}
                    <SkillsSection
                      skillsList={profile?.skills || []}
                      onRefresh={fetchProfileData}
                      onShowToast={onShowToast}
                    />

                    {/* Section E: Resume Section (with ✏️ edit icon, upload, download/view, remove) */}
                    <ResumeSection
                      resume={profile?.resume || null}
                      onRefresh={fetchProfileData}
                      onShowToast={onShowToast}
                    />
                  </div>
                )}

                {/* 2. CAREER COMPASS VIEW */}
                {activeSubView === 'compass' && (
                  <CareerCompassProfileSection
                    compass={profile?.careerCompass || null}
                    onNavigate={onNavigate}
                    onNavigateTab={() => setActiveSubView('overview')}
                  />
                )}

                {/* 3. SKILL FORGE (ENROLLED COURSES) VIEW */}
                {activeSubView === 'learning' && (
                  <EnrolledCourses
                    enrollments={enrollments}
                    onNavigate={onNavigate}
                    loading={loadingEnrollments}
                  />
                )}

                {/* 4. CREDENTIAL EDGE VIEW */}
                {activeSubView === 'credentials' && (
                  <div className="space-y-8">
                    <CredentialEdgeProfileSection onNavigate={onNavigate} />
                    <StudentCertificatesSection onNavigate={onNavigate} onShowToast={onShowToast} />
                  </div>
                )}

                {/* 5. PROJECTS VIEW */}
                {activeSubView === 'projects' && (
                  <StudentProjectsSection
                    projectsList={profile?.projects || []}
                    onRefresh={fetchProfileData}
                    onShowToast={onShowToast}
                  />
                )}

                {/* 6. SETTINGS VIEW */}
                {activeSubView === 'settings' && (
                  <AccountSettings
                    user={activeUser}
                    onLogout={handleLogout}
                    onNavigate={onNavigate}
                    onShowToast={onShowToast}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentUser={activeUser}
        onSuccessToast={onShowToast}
        onProfileUpdated={fetchProfileData}
      />

      {/* Public Profile Preview Modal */}
      <PublicProfileModal
        isOpen={isPublicModalOpen}
        onClose={() => setIsPublicModalOpen(false)}
        profile={profile}
      />
    </div>
  );
};

export default ProfilePage;
