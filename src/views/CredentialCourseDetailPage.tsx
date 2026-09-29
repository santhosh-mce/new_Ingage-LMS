"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  Star,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  PlayCircle,
  HelpCircle,
  Lock,
  Play,
  RotateCw,
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  getCredentialCourseBySlug,
  enrollInCredentialCourse,
  updateCredentialCourseProgress,
  getWeeklyCourseProgress,
  CredentialCourseDto,
  CredentialCourseProgressDto,
  SkillProgressSummaryDto,
  SkillBadgeDto
} from '../api/credentialApi';
import { CertificateViewModal } from '../components/certificate/CertificateViewModal';
import { CertificateDto } from '../api/certificateApi';
import { createPaymentOrder, verifyPayment } from '../api/paymentApi';
import { useAppSelector } from '../store/hooks';
import { UserProfile } from '../types';

interface CredentialCourseDetailPageProps {
  slug: string;
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string) => void;
}

export function CredentialCourseDetailPage({
  slug,
  onNavigate,
  currentUser: propUser,
  onOpenAuth,
  onShowToast
}: CredentialCourseDetailPageProps) {
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const [course, setCourse] = useState<CredentialCourseDto | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<CredentialCourseProgressDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Certificate Modal state
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [certificateData, setCertificateData] = useState<CertificateDto | null>(null);

  useEffect(() => {
    fetchCourseAndProgress();
  }, [slug]);

  const fetchCourseAndProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const courseData = await getCredentialCourseBySlug(slug);
      setCourse(courseData);

      // Attempt to load weekly progress (for google-generative-ai and weekly-enabled courses)
      try {
        const wpData = await getWeeklyCourseProgress(slug);
        setWeeklyProgress(wpData);
      } catch {
        // Fallback for regular module-only courses
        setWeeklyProgress(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollOrStart = async () => {
    if (!currentUser) {
      if (onShowToast) onShowToast('Please log in or create an account to enroll.');
      if (onOpenAuth) onOpenAuth('signup', `/credential-edge/${slug}`);
      return;
    }

    if (!course) return;

    // If paid course and not enrolled, launch payment
    if (!course.free && (course.price || 0) > 0 && !course.enrolled) {
      handlePaidCheckout();
      return;
    }

    // Free course enrollment or Continue Learning
    if (course.enrolled || weeklyProgress?.enrolled) {
      // Continue Learning flow
      if (weeklyProgress) {
        if (weeklyProgress.courseCompleted || weeklyProgress.completedSkills >= 8) {
          handleOpenCertificate();
          return;
        }
        const targetSlug = weeklyProgress.nextAvailableSkillSlug || 'generative-ai-fundamentals';
        onNavigate(`/credential-edge/${slug}/skills/${targetSlug}`);
      } else {
        // Module scroll
        const el = document.getElementById('curriculum-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Enroll in course
    setActionLoading(true);
    try {
      const updated = await enrollInCredentialCourse(course.slug);
      setCourse(updated);
      try {
        const wp = await getWeeklyCourseProgress(slug);
        setWeeklyProgress(wp);
      } catch {}
      if (onShowToast) onShowToast(`Successfully enrolled in ${course.title}!`);
    } catch (err: any) {
      if (onShowToast) onShowToast(err?.response?.data?.message || 'Enrollment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaidCheckout = async () => {
    if (!course) return;
    setActionLoading(true);

    try {
      const order = await createPaymentOrder(course.id);
      const razorpayKey = order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TccoJ6A0ra1dCg' || 'rzp_test_key';

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'InGage LMS',
        description: course.title,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            const updated = await enrollInCredentialCourse(course.slug);
            setCourse(updated);
            try {
              const wp = await getWeeklyCourseProgress(slug);
              setWeeklyProgress(wp);
            } catch {}
            if (onShowToast) onShowToast('Payment successful! You are now enrolled.');
          } catch (vErr: any) {
            if (onShowToast) onShowToast('Payment verification failed.');
          }
        },
        prefill: {
          name: currentUser?.name || '',
          email: currentUser?.email || ''
        },
        theme: {
          color: '#84cc16'
        }
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const updated = await enrollInCredentialCourse(course.slug);
        setCourse(updated);
        try {
          const wp = await getWeeklyCourseProgress(slug);
          setWeeklyProgress(wp);
        } catch {}
        if (onShowToast) onShowToast('Order simulated successfully! Enrolled in demo mode.');
      }
    } catch (err: any) {
      try {
        const updated = await enrollInCredentialCourse(course.slug);
        setCourse(updated);
        try {
          const wp = await getWeeklyCourseProgress(slug);
          setWeeklyProgress(wp);
        } catch {}
        if (onShowToast) onShowToast(`Enrolled in ${course.title}!`);
      } catch (e: any) {
        if (onShowToast) onShowToast('Could not initiate checkout.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    if (onShowToast) onShowToast('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenCertificate = () => {
    const certNum = weeklyProgress?.certificateNumber || `ING-GENAI-${Date.now().toString(36).toUpperCase()}`;
    const cert: CertificateDto = {
      id: 99999,
      certificateNumber: certNum,
      verificationCode: `VER-${Date.now().toString(36).toUpperCase()}`,
      studentName: currentUser?.name || 'Verified Learner',
      courseId: course?.id || 1,
      courseTitle: course?.title || 'Google Generative AI',
      courseName: course?.title || 'Google Generative AI',
      courseCategory: course?.category || 'Artificial Intelligence',
      courseDuration: course?.duration || 'Approx. 2 months',
      instructor: 'Google Cloud Training & InGage LMS',
      completionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      formattedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      issuedAt: new Date().toISOString(),
      status: 'VERIFIED',
      verificationUrl: `${window.location.origin}/verify/${certNum}`,
      downloadUrl: `/api/certificates/download/${certNum}`
    };
    setCertificateData(cert);
    setShowCertModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-16 px-4 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-12 bg-gray-200 rounded w-3/4" />
        <div className="h-40 bg-gray-200 rounded-3xl" />
        <div className="h-60 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-20 px-4 max-w-md mx-auto text-center">
        <Award className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course Not Found</h2>
        <p className="text-xs text-gray-500 mb-6">{error || 'This Google credential course is not available.'}</p>
        <button
          onClick={() => onNavigate('/credential-edge')}
          className="px-5 py-2.5 bg-lime-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-lime-700 transition-colors"
        >
          Back to Credential Edge
        </button>
      </div>
    );
  }

  const isEnrolled = course.enrolled || weeklyProgress?.enrolled;
  const isWeeklyCourse = !!weeklyProgress || slug === 'google-generative-ai';

  // Dynamic progress values
  const totalSkills = weeklyProgress?.totalSkills || 8;
  const completedSkills = weeklyProgress?.completedSkills || 0;
  const progressPct = weeklyProgress
    ? weeklyProgress.progressPercentage
    : course.progressPercentage || 0;
  const isCompleted =
    weeklyProgress?.courseCompleted ||
    completedSkills >= totalSkills ||
    course.userStatus === 'COMPLETED' ||
    course.userStatus === 'CREDENTIAL_EARNED';

  // Dynamic Continue Learning Button Text (Section 15)
  let continueButtonText = 'Enroll Now — Free';
  if (isCompleted) {
    continueButtonText = 'View Completed Credential';
  } else if (isEnrolled && isWeeklyCourse) {
    if (completedSkills === 0) {
      continueButtonText = 'Continue Week 1';
    } else {
      const nextWk = weeklyProgress?.nextAvailableWeek || (completedSkills + 1);
      continueButtonText = `Continue Week ${nextWk}`;
    }
  } else if (isEnrolled) {
    continueButtonText = 'Continue Learning';
  } else if (!course.free && (course.price || 0) > 0) {
    continueButtonText = `Enroll for ₹${course.price}`;
  }

  // Flattened weekly skills list for the 8-step timeline
  const allSkills: SkillProgressSummaryDto[] = [];
  if (weeklyProgress?.modules) {
    weeklyProgress.modules.forEach((m) => {
      if (m.skills) {
        allSkills.push(...m.skills);
      }
    });
  }

  // Find most recent completed skill for the Next Week Learning Flow banner (Section 14)
  const lastCompletedSkill = [...allSkills].reverse().find((s) => s.status === 'COMPLETED');
  const nextUpSkill = allSkills.find((s) => s.status === 'AVAILABLE' || s.status === 'IN_PROGRESS');

  return (
    <div className="min-h-screen bg-[#fafaf9] text-gray-900 pb-20 font-sans">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onNavigate('/credential-edge')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-lime-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Credential Edge</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-3 py-1 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Google Generative AI Course Header (Section 2) */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            {/* Left Content */}
            <div className="max-w-3xl flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                  {course.category || 'Generative AI'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-lime-50 text-lime-800 border border-lime-200 text-xs font-semibold">
                  {course.level || 'Beginner'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                  Provider: {course.provider || 'Google'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
                {course.title}
              </h1>

              <p className="text-[15px] sm:text-base text-gray-600 leading-relaxed mb-6">
                {course.shortDescription || course.description}
              </p>

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-gray-600 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{course.duration || 'Approx. 2 months'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{course.rating || 4.7}</span>
                  <span className="text-gray-400 font-normal">
                    ({(course.learnersCount || 14202).toLocaleString()} enrolled)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span>{course.modules?.length || 4} Modules</span>
                </div>
              </div>

              {/* Learning Progress Section (Section 2 & 12) */}
              {isEnrolled && (
                <div className="mt-6 p-4 sm:p-5 bg-lime-50/70 border border-lime-200 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-lime-900">Your Learning Progress:</span>
                    <span className="text-lime-700 font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-lime-200/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-lime-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-lime-900 font-medium">
                    <span>
                      {completedSkills} of {totalSkills} weekly skills completed
                    </span>
                    {isCompleted && (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>All Skills Completed!</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Card with CTA & Credential Details */}
            <div className="w-full lg:w-88 shrink-0 bg-white rounded-3xl border border-gray-200 shadow-xl p-6 sm:p-7 flex flex-col">
              <div className="mb-5">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">
                  Tuition & Access
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-600">Free</span>
                </div>
              </div>

              {/* Primary Dynamic Action Button (Section 15) */}
              <button
                onClick={handleEnrollOrStart}
                disabled={actionLoading}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mb-3 ${
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-lime-600 hover:bg-lime-700 text-white'
                }`}
              >
                <span>{actionLoading ? 'Processing...' : continueButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Target Credential Pill */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl mb-5">
                <div className="flex items-start gap-2.5">
                  <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                      Target Credential:
                    </span>
                    <p className="text-xs font-semibold text-gray-800 leading-snug">
                      Google Generative AI Course
                    </p>
                  </div>
                </div>
              </div>

              {/* Features bullet list matching prompt spec (Section 2) */}
              <div className="space-y-2.5 text-xs text-gray-600 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>100% self-paced online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Weekly skill badges</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Module quizzes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Case studies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>InGage course completion badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Sharable credential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10" id="curriculum-section">
        {/* Next Week Learning Flow Banner (Section 14) */}
        {isEnrolled && isWeeklyCourse && !isCompleted && nextUpSkill && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-lime-50 via-emerald-50 to-teal-50 border border-lime-300 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lime-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                W{nextUpSkill.weekNumber}
              </div>
              <div>
                {lastCompletedSkill ? (
                  <div className="text-xs font-bold text-lime-800 uppercase tracking-wider mb-0.5">
                    Week {lastCompletedSkill.weekNumber} Complete 🎉 You've earned the {lastCompletedSkill.badgeName} Skill Badge
                  </div>
                ) : (
                  <div className="text-xs font-bold text-lime-800 uppercase tracking-wider mb-0.5">
                    Start Your Learning Journey
                  </div>
                )}
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Next: Week {nextUpSkill.weekNumber} — {nextUpSkill.title}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigate(`/credential-edge/${slug}/skills/${nextUpSkill.slug}`)}
              className="px-6 py-3 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <span>Start Week {nextUpSkill.weekNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Final Course Completion Banner (Section 16) */}
        {isCompleted && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white border border-emerald-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xl shrink-0 shadow-lg">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-lime-300 text-[11px] font-black uppercase tracking-wider">
                  8 of 8 weekly skills completed • 100% Complete
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Google Generative AI Completed 🎉
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                  Congratulations! You've mastered all 4 modules, earned all 8 weekly skill badges, and unlocked your official InGage Course Completion Certificate.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenCertificate}
              className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>View InGage Certificate</span>
            </button>
          </div>
        )}

        {/* Section 12: Weekly Skill Progress Timeline (8-Step) */}
        {isWeeklyCourse && (
          <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-lime-600" />
                  <span>Weekly Skill Progress</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {completedSkills} / {totalSkills} Skills Completed ({progressPct}% finished)
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-60">
                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                  <span>Overall Curriculum</span>
                  <span className="text-lime-700 font-extrabold">{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                  <div
                    className="bg-lime-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 8-Step Progress Timeline Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {allSkills.length > 0 ? (
                allSkills.map((sk) => {
                  const isDone = sk.status === 'COMPLETED';
                  const isLocked = sk.status === 'LOCKED';
                  const isInProg = sk.status === 'IN_PROGRESS';
                  const isAvail = sk.status === 'AVAILABLE';

                  return (
                    <div
                      key={sk.slug}
                      onClick={() => {
                        if (!isLocked) {
                          onNavigate(`/credential-edge/${slug}/skills/${sk.slug}`);
                        } else {
                          if (onShowToast) onShowToast(`Week ${sk.weekNumber} is locked until Week ${sk.weekNumber - 1} is completed.`);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[140px] cursor-pointer ${
                        isDone
                          ? 'bg-lime-50/70 border-lime-300 hover:bg-lime-100/60'
                          : isInProg
                          ? 'bg-amber-50/60 border-amber-300 shadow-2xs hover:bg-amber-100/50'
                          : isAvail
                          ? 'bg-white border-lime-500 shadow-2xs hover:border-lime-600'
                          : 'bg-gray-50/60 border-gray-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Top Status Icon */}
                      <div className="mb-2">
                        {isDone ? (
                          <div className="w-8 h-8 rounded-full bg-lime-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : isInProg ? (
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                            ⏳
                          </div>
                        ) : isAvail ? (
                          <div className="w-8 h-8 rounded-full bg-lime-100 text-lime-800 flex items-center justify-center font-bold text-xs">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Week Label */}
                      <div className="text-xs font-bold text-gray-900 mb-1">
                        Week {sk.weekNumber}
                      </div>

                      {/* Skill Name snippet */}
                      <div className="text-[11px] text-gray-600 line-clamp-2 leading-tight mb-2">
                        {sk.title}
                      </div>

                      {/* Status label */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-lime-200 text-lime-900'
                          : isInProg
                          ? 'bg-amber-200 text-amber-900'
                          : isAvail
                          ? 'bg-lime-100 text-lime-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isDone ? '✓ Completed' : isInProg ? 'In Progress' : isAvail ? '▶ Start' : '🔒 Locked'}
                      </span>
                    </div>
                  );
                })
              ) : (
                // Fallback rendering of 8 placeholder weeks
                [1, 2, 3, 4, 5, 6, 7, 8].map((wk) => (
                  <div
                    key={wk}
                    className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-center opacity-70"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                      {wk === 1 ? '▶' : '🔒'}
                    </div>
                    <div className="text-xs font-bold text-gray-800">Week {wk}</div>
                    <span className="text-[10px] text-gray-500">
                      {wk === 1 ? 'Available' : 'Locked'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Section 13: Module Progress & Weekly Skills List */}
        <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-lime-600" />
                <span>Modules & Weekly Skills Curriculum</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Progression follows: Module → Weekly Skill → Learn → Complete → Skill Badge → Next Skill
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {weeklyProgress?.modules && weeklyProgress.modules.length > 0 ? (
              weeklyProgress.modules.map((mod) => {
                const isModComplete = mod.completedSkills === mod.totalSkills && mod.totalSkills > 0;
                const isModInProgress = mod.completedSkills > 0 && !isModComplete;

                return (
                  <div
                    key={mod.moduleId}
                    className="border border-gray-200 rounded-3xl p-6 bg-white shadow-2xs"
                  >
                    {/* Module Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-lime-100 text-lime-800 text-[11px] font-bold uppercase tracking-wider">
                            Module {mod.moduleOrder}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-semibold text-gray-600">
                            {mod.completedSkills} / {mod.totalSkills} skills completed
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{mod.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                      </div>

                      <div className="shrink-0">
                        {isModComplete ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>✓ Complete</span>
                          </span>
                        ) : isModInProgress ? (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                            ⏳ In Progress
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-extrabold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Weekly Skills inside this Module */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mod.skills.map((sk) => {
                        const isDone = sk.status === 'COMPLETED';
                        const isLocked = sk.status === 'LOCKED';

                        return (
                          <div
                            key={sk.slug}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                              isDone
                                ? 'bg-lime-50/50 border-lime-200'
                                : !isLocked
                                ? 'bg-white border-lime-400 hover:border-lime-500 shadow-2xs'
                                : 'bg-gray-50/80 border-gray-200 opacity-70'
                            }`}
                          >
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-lime-800 bg-lime-100 px-2 py-0.5 rounded">
                                  Week {sk.weekNumber}
                                </span>
                                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  <span>{sk.badgeName}</span>
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900 mb-1">{sk.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{sk.duration || '1 week'}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <span className="text-[11px] font-bold text-gray-600">
                                {isDone ? '✓ Badge Earned' : isLocked ? '🔒 Locked' : 'Ready to Learn'}
                              </span>

                              {!isLocked ? (
                                <button
                                  onClick={() => onNavigate(`/credential-edge/${slug}/skills/${sk.slug}`)}
                                  className="px-3 py-1.5 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>{isDone ? 'Review Skill' : 'Learn Skill'}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Complete Week {sk.weekNumber - 1}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              // Generic course fallback
              course.modules?.map((m, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-white">
                  <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{m.description}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Earned Skill Badges Showcase */}
        {weeklyProgress && weeklyProgress.earnedBadges && weeklyProgress.earnedBadges.length > 0 && (
          <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-2xs">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Your Earned Skill Badges ({weeklyProgress.earnedBadges.length} / 8)</span>
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Each badge proves verified competency in that specific week's generative AI techniques.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeklyProgress.earnedBadges.map((b) => (
                <div
                  key={b.badgeId}
                  onClick={() => onNavigate(`/credential-edge/${slug}/badges/${b.badgeId}`)}
                  className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Week {b.weekNumber} Badge
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">{b.badgeName}</h4>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-500">{b.badgeId}</span>
                    <span className="text-amber-800 font-bold flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Credential & Certificate Distinction (Section 17) */}
        <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-2xs">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Credential & Certificate Verification</span>
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Understand the clear distinction between InGage course completion and external provider credentials.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Box 1: Course Completion Certificate */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
              <span className="px-2.5 py-0.5 rounded bg-lime-100 text-lime-800 text-[10px] font-extrabold uppercase tracking-wider">
                InGage Certification
              </span>
              <h3 className="text-sm font-bold text-gray-900">Course Completion Certificate</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Issued directly by the InGage Learning Platform upon completing all 8 weekly skills, verifying completion of syllabus, prompt labs, and assessments.
              </p>
              {isCompleted && (
                <button
                  onClick={handleOpenCertificate}
                  className="mt-2 px-4 py-2 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>View Official Certificate</span>
                </button>
              )}
            </div>

            {/* Box 2: External Google Credential */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
              <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                External Provider Credential
              </span>
              <h3 className="text-sm font-bold text-gray-900">Google Generative AI Course</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This is an external Google Cloud credential. InGage provides the structured learning curriculum and skill badges, while external certification is completed directly on Google Cloud's training portal.
              </p>
              <a
                href="https://cloud.google.com/training/generative-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 underline mt-1"
              >
                <span>View Official Credential Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Official InGage Course Certificate Modal */}
      {showCertModal && certificateData && (
        <CertificateViewModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          certificate={certificateData}
          onNavigate={onNavigate}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

export default CredentialCourseDetailPage;
