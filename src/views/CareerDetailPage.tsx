"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Home,
  Clock,
  TrendingUp,
  Briefcase,
  PlayCircle,
  Share2,
  Star,
  Target,
  BookOpen,
  Lock,
  CheckCircle2,
  BarChart3,
  Users,
  Award,
  Download,
  Bookmark,
  Layers,
  Sparkles,
  CreditCard,
  Loader2,
  ChevronRight,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { CareerDetailDto, CareerCourseDto, downloadCareerCurriculum } from '../api/careerApi';
import {
  createPaymentOrder,
  verifyPayment,
  createCareerPaymentOrder,
  getCareerAccessStatus,
  claimCareerCertificate,
  CareerAccessDetail
} from '../api/paymentApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCareerBySlug } from '../store/slices/careerSlice';
import { getCredentialCoursesByCareer, CredentialCourseDto } from '../api/credentialApi';

interface CareerDetailPageProps {
  roleId: string;
  onNavigate: (path: string, param?: string) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string) => void;
}

export function CareerDetailPage({
  roleId,
  onNavigate,
  currentUser: propUser,
  onOpenAuth,
  onShowToast
}: CareerDetailPageProps) {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const { selectedCareer: career, detailLoading: loading, error } = useAppSelector(
    (state) => state.career
  );
  const [purchasingCourseId, setPurchasingCourseId] = useState<number | null>(null);
  const [isPurchasingCareer, setIsPurchasingCareer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false);
  const [careerAccess, setCareerAccess] = useState<CareerAccessDetail | null>(null);
  const [claimingCert, setClaimingCert] = useState(false);
  const [careerCert, setCareerCert] = useState<{ certificateNumber: string; verificationCode?: string } | null>(null);
  const [recCredentials, setRecCredentials] = useState<CredentialCourseDto[]>([]);

  useEffect(() => {
    dispatch(fetchCareerBySlug(roleId));
    getCredentialCoursesByCareer(roleId)
      .then((data) => setRecCredentials(data))
      .catch(() => {});
    if (currentUser) {
      getCareerAccessStatus(roleId)
        .then((res) => setCareerAccess(res))
        .catch(() => {});
    }
  }, [roleId, currentUser, dispatch]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCourseAction = async (c: CareerCourseDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. If enrolled, active, or completed -> Start Learning / View Certificate
    if (c.courseAccess || c.enrollmentStatus === 'ENROLLED' || c.enrollmentStatus === 'COMPLETED') {
      onNavigate(`/courses/${c.courseId}`);
      return;
    }

    // 2. If not logged in -> Prompt signup
    if (!currentUser) {
      if (onShowToast) onShowToast('Please create an account or log in to enroll.');
      if (onOpenAuth) onOpenAuth('signup', `/roles/${career?.slug || roleId}`);
      return;
    }

    // 3. If logged in + not enrolled -> Trigger Razorpay checkout
    try {
      setPurchasingCourseId(c.courseId);
      if (onShowToast) onShowToast(`Initiating checkout for ${c.courseTitle}...`);

      const orderRes = await createPaymentOrder(c.courseId);

      // Free Course
      if (orderRes.free) {
        if (onShowToast) onShowToast('Congratulations! You are enrolled in this free course.');
        dispatch(fetchCareerBySlug(roleId));
        setPurchasingCourseId(null);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPurchasingCourseId(null);
        if (onShowToast) onShowToast('Failed to load Razorpay payment gateway. Please check your connection.');
        return;
      }

      const options = {
        key: (orderRes.keyId || 'rzp_test_TccoJ6A0ra1dCg').trim(),
        amount: orderRes.amountInPaise,
        currency: orderRes.currency || 'INR',
        name: 'Ingage LMS',
        description: `Enrollment: ${c.courseTitle}`,
        order_id: (orderRes.razorpayOrderId || '').trim(),
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#65a30d',
        },
        modal: {
          ondismiss: () => {
            setPurchasingCourseId(null);
            if (onShowToast) onShowToast('Payment was cancelled.');
          },
        },
        handler: async (response: any) => {
          try {
            if (onShowToast) onShowToast('Verifying payment signature with backend...');
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: c.courseId,
            });

            if (verifyRes.success) {
              if (onShowToast) onShowToast(`Payment Successful! You are now enrolled in ${c.courseTitle}.`);
              dispatch(fetchCareerBySlug(roleId));
            } else {
              if (onShowToast) onShowToast(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            if (onShowToast) onShowToast('Verification failed. Please contact support.');
          } finally {
            setPurchasingCourseId(null);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        setPurchasingCourseId(null);
        if (onShowToast) onShowToast(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      razorpayInstance.open();
    } catch (err: any) {
      setPurchasingCourseId(null);
      console.error('Failed to initiate course checkout:', err);
      const msg = err.response?.data?.message || err.message || 'Could not initiate purchase.';
      if (onShowToast) onShowToast(msg);
    }
  };

  const isCurrentCareer = career && (career.slug === roleId || String(career.id) === roleId);

  if (loading || (!isCurrentCareer && !error)) {
    return (
      <div className="w-full bg-white flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-lime-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className="w-full bg-white flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-medium">{error || 'Career path not found.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => dispatch(fetchCareerBySlug(roleId))}
              className="px-6 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 font-medium transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={() => onNavigate('/careers')}
              className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-colors cursor-pointer"
            >
              Back to Careers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derived or dynamic skills list
  const skillsList =
    career.skills && career.skills.length > 0
      ? career.skills.map((s) => s.skillName)
      : ['Problem Solving', 'Data Structures', 'System Architecture', 'Version Control'];

  // Derived or dynamic roadmaps / modules
  const modulesList =
    career.roadmap && career.roadmap.length > 0
      ? career.roadmap.map((rm, idx) => ({
          id: `${career.slug}-m${idx + 1}`,
          number: idx + 1,
          title: rm.title,
          description: rm.description,
          duration: rm.duration || '3 weeks',
          isUnlocked: idx === 0,
          hasPreview: idx === 0,
          lessonsCount: 8 + (idx % 4) * 2
        }))
      : [
          {
            id: `${career.slug}-m1`,
            number: 1,
            title: `Foundations of ${career.title}`,
            description: 'Core fundamentals, prerequisite tools, and industry standards.',
            duration: '3 weeks',
            isUnlocked: true,
            hasPreview: true,
            lessonsCount: 12
          },
          {
            id: `${career.slug}-m2`,
            number: 2,
            title: 'Applied Skills & Workflows',
            description: 'Hands-on practice using modern professional toolchains.',
            duration: '4 weeks',
            isUnlocked: false,
            hasPreview: false,
            lessonsCount: 16
          },
          {
            id: `${career.slug}-m3`,
            number: 3,
            title: 'Enterprise Architecture & Projects',
            description: 'Building production-ready systems from design to deployment.',
            duration: '4 weeks',
            isUnlocked: false,
            hasPreview: false,
            lessonsCount: 14
          },
          {
            id: `${career.slug}-m4`,
            number: 4,
            title: 'Capstone & Certification Defense',
            description: 'Comprehensive capstone project evaluated by industry leaders.',
            duration: '3 weeks',
            isUnlocked: false,
            hasPreview: false,
            lessonsCount: 10
          }
        ];

  // Career-level enrollment and completion status
  const isEnrolledInCareer = Boolean(
    currentUser && (
      careerAccess?.enrolled ||
      currentUser.enrolledPaths?.includes(career.slug) ||
      career.courses?.some(
        (c) => c.courseAccess || c.enrollmentStatus === 'ENROLLED' || c.enrollmentStatus === 'COMPLETED'
      )
    )
  );

  const isCareerCompleted = Boolean(
    currentUser && (
      careerAccess?.completed ||
      (career.courses && career.courses.length > 0 && career.courses.every((c) => c.completed || c.enrollmentStatus === 'COMPLETED'))
    )
  );

  // What You'll Learn / Responsibilities
  const whatYoullLearn =
    career.responsibilities && career.responsibilities.length > 0
      ? career.responsibilities.map((r) => r.responsibility)
      : [
          'Master core fundamentals and advanced industry concepts',
          'Build real-world projects for your professional portfolio',
          'Learn industry best practices and architectural standards',
          'Gain hands-on experience with modern frameworks and toolsets',
          'Prepare for career transitions and technical interview loops',
          'Connect with industry mentors and peer study circles'
        ];

  // Job Opportunities roles
  const jobOpportunities =
    career.jobOpportunities && career.jobOpportunities.length > 0
      ? career.jobOpportunities.map((o) => o.title)
      : [
          career.title,
          `Junior ${career.title}`,
          `Senior ${career.title}`,
          `${career.title} Specialist`
        ];

  // Handle Share Course link
  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      if (onShowToast) {
        onShowToast('Career link copied to clipboard!');
      }
    } catch {
      if (onShowToast) {
        onShowToast('Link copied!');
      }
    }
  };

  // Handle Curriculum Download with verified 3-step access control
  const handleDownloadCurriculum = async () => {
    // 1. User is NOT logged in
    if (!currentUser) {
      if (onShowToast) {
        onShowToast('Sign Up to Continue: Create a free account to get started.');
      }
      if (onOpenAuth) {
        onOpenAuth('signup', `/roles/${career.slug || roleId}`);
      }
      return;
    }

    // 2. User is logged in but has NOT purchased the required course
    if (!isEnrolledInCareer && !isCareerCompleted) {
      if (onShowToast) {
        onShowToast('Purchase the course to download the curriculum.');
      }
      setShowPurchasePrompt(true);
      const coursesSection = document.getElementById('recommended-courses-section');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // 3. User is logged in AND has purchased the course -> call protected backend API
    try {
      setIsDownloading(true);
      if (onShowToast) {
        onShowToast('Preparing curriculum download...');
      }
      const blob = await downloadCareerCurriculum(career.slug || roleId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${career.slug}-curriculum.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast(`Curriculum for ${career.title} downloaded!`);
      }
    } catch (err: any) {
      console.error('Failed to download curriculum:', err);
      if (err.response?.status === 401) {
        if (onShowToast) {
          onShowToast('Sign Up to Continue: Please log in to download curriculum.');
        }
        if (onOpenAuth) {
          onOpenAuth('login', `/roles/${career.slug || roleId}`);
        }
      } else if (err.response?.status === 403) {
        let msg = 'Purchase the course to download the curriculum.';
        if (err.response?.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed.message) msg = parsed.message;
          } catch {
            // ignore
          }
        }
        if (onShowToast) {
          onShowToast(msg);
        }
        setShowPurchasePrompt(true);
      } else {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to download curriculum. Please try again.';
        if (onShowToast) {
          onShowToast(errorMsg);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Main Career Path Purchase (Option B) or Resume Learning
  const handleEnrollClick = async () => {
    if (!currentUser) {
      if (onShowToast) {
        onShowToast(`Please sign in or create an account to enroll in ${career.title}.`);
      }
      if (onOpenAuth) {
        onOpenAuth('signup', `/roles/${career.slug || roleId}`);
      }
      return;
    }

    if (isEnrolledInCareer || isCareerCompleted) {
      const firstCourseId = career.courses?.[0]?.courseId;
      if (firstCourseId) {
        onNavigate(`/courses/${firstCourseId}`);
      } else {
        handlePreviewCurriculum();
      }
      return;
    }

    try {
      setIsPurchasingCareer(true);
      if (onShowToast) onShowToast(`Initiating checkout for ${career.title} Career Path...`);

      const orderRes = await createCareerPaymentOrder(career.id);

      if (orderRes.free) {
        if (onShowToast) onShowToast('Congratulations! You are enrolled in this Career Path.');
        dispatch(fetchCareerBySlug(roleId));
        if (currentUser) {
          getCareerAccessStatus(roleId).then(setCareerAccess).catch(() => {});
        }
        setIsPurchasingCareer(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsPurchasingCareer(false);
        if (onShowToast) onShowToast('Failed to load Razorpay payment gateway. Please check your connection.');
        return;
      }

      const options = {
        key: (orderRes.keyId || 'rzp_test_TccoJ6A0ra1dCg').trim(),
        amount: orderRes.amountInPaise,
        currency: orderRes.currency || 'INR',
        name: 'InGage LMS',
        description: `Enrollment: ${career.title} Career Path`,
        order_id: (orderRes.razorpayOrderId || '').trim(),
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#65a30d',
        },
        modal: {
          ondismiss: () => {
            setIsPurchasingCareer(false);
            if (onShowToast) onShowToast('Payment was cancelled.');
          },
        },
        handler: async (response: any) => {
          try {
            if (onShowToast) onShowToast('Verifying payment signature with backend...');
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              careerId: career.id,
            });

            if (verifyRes.success) {
              if (onShowToast) onShowToast(`Payment Successful! You are now enrolled in ${career.title}. All modules and courses are unlocked!`);
              dispatch(fetchCareerBySlug(roleId));
              if (currentUser) {
                getCareerAccessStatus(roleId).then(setCareerAccess).catch(() => {});
              }
            } else {
              if (onShowToast) onShowToast(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            if (onShowToast) onShowToast('Verification failed. Please contact support.');
          } finally {
            setIsPurchasingCareer(false);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        setIsPurchasingCareer(false);
        if (onShowToast) onShowToast(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      razorpayInstance.open();
    } catch (err: any) {
      setIsPurchasingCareer(false);
      console.error('Failed to initiate career checkout:', err);
      const msg = err.response?.data?.message || err.message || 'Could not initiate purchase.';
      if (onShowToast) onShowToast(msg);
    }
  };

  const handleClaimCertificate = async () => {
    try {
      setClaimingCert(true);
      const res = await claimCareerCertificate(career.id);
      setCareerCert(res);
      if (onShowToast) onShowToast(`Certificate ${res.certificateNumber} generated successfully!`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Could not claim certificate.';
      if (onShowToast) onShowToast(msg);
    } finally {
      setClaimingCert(false);
    }
  };

  // Smooth scroll to existing Curriculum & Roadmap section
  const handlePreviewCurriculum = () => {
    const curriculumElement = document.getElementById('curriculum');
    if (curriculumElement) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 90;
      const elementTop = curriculumElement.getBoundingClientRect().top;
      const offsetPosition = elementTop + window.pageYOffset - (headerHeight + 20);

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior,
      });
    }
  };

  return (
    <div className="w-full bg-white">
      {/* 1. Sub-Navbar / Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-200/80 py-3.5 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 font-medium">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-gray-900 flex items-center gap-1 cursor-pointer transition-colors"
              title="Home"
            >
              <Home className="w-4 h-4 text-gray-600 hover:text-gray-900" />
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => onNavigate('/careers')}
              className="hover:text-gray-900 cursor-pointer transition-colors"
            >
              Career Paths
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold truncate max-w-[150px] sm:max-w-none">{career.title}</span>
          </nav>

          <button
            onClick={() => onNavigate('/careers')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="bg-[#FAF9F5] border-b border-gray-200/60 py-8 sm:py-14 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Details */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#EAF8E6] text-emerald-700">
                  {career.level}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-white border border-gray-900 text-gray-900 shadow-2xs">
                  {career.category}
                </span>
                {career.featured && (
                  <span className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                {career.title}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl font-normal">
                {career.description}
              </p>

              {/* Meta Stats Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2 text-xs sm:text-sm text-gray-700 font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>{career.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>{career.salary?.formatted || 'Competitive'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>{career.jobOpenings} jobs</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 pt-4">
                <button
                  id="career-detail-enroll-btn"
                  onClick={handleEnrollClick}
                  disabled={isPurchasingCareer}
                  className="w-full sm:w-auto bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3 rounded-lg shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isPurchasingCareer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Checkout...</span>
                    </>
                  ) : !currentUser ? (
                    'Sign Up to Continue'
                  ) : isCareerCompleted ? (
                    'Program Completed'
                  ) : isEnrolledInCareer ? (
                    'Continue Learning'
                  ) : (
                    `Enroll Now (₹${(career.price || 14999).toLocaleString('en-IN')})`
                  )}
                </button>

                <button
                  id="career-detail-preview-btn"
                  onClick={handlePreviewCurriculum}
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm sm:text-base px-6 py-3 rounded-lg border border-gray-300 shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 text-gray-700" />
                  <span>Preview Curriculum</span>
                </button>

                <button
                  id="career-detail-share-btn"
                  onClick={handleShare}
                  title="Share course"
                  className="w-full sm:w-auto p-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="sm:hidden text-sm font-semibold ml-2">Share Career Path</span>
                </button>
              </div>
            </div>

            {/* Right Hero Image with 3 Stats Overlay */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 bg-gray-100 aspect-4/3 w-full">
                <img
                  src={career.imageUrl}
                  alt={career.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Dark gradient bottom banner */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-5 sm:p-6 text-white">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        4.8
                      </div>
                      <div className="text-xs text-gray-300 font-medium flex items-center justify-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Rating</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">12K+</div>
                      <div className="text-xs text-gray-300 font-medium mt-0.5">Students</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">95%</div>
                      <div className="text-xs text-gray-300 font-medium mt-0.5">Placement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Section (2 Columns) */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (8 cols): Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Skills You'll Gain */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-full border-2 border-lime-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skills You'll Gain</h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {skillsList.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Learning Path / Roadmaps */}
            <div id="curriculum" className="scroll-mt-28">
              <div className="flex items-center gap-2.5 mb-2">
                <BookOpen className="w-6 h-6 text-lime-600" />
                <h2 className="text-2xl font-bold text-gray-900">Curriculum & Roadmap</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                A structured {career.duration} program with {modulesList.length} milestones designed to take you from beginner to job-ready professional.
              </p>

              {/* Module Cards List */}
              <div className="space-y-4">
                {modulesList.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 transition-all hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-full bg-lime-600 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                          {mod.number}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">
                            {mod.title}
                          </h3>
                          {mod.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                              {mod.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{mod.lessonsCount} lessons</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{mod.duration}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {mod.isUnlocked ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-lime-50 text-lime-700 border border-lime-200 shrink-0">
                          Unlocked
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Responsibilities / What You'll Learn */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Target className="w-6 h-6 text-lime-600" />
                <h2 className="text-2xl font-bold text-gray-900">Key Responsibilities & Outcomes</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                What you will practice and deliver as a working {career.title}:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whatYoullLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-5 h-5 text-lime-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-800 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hands-on Projects (if any) */}
            {career.projects && career.projects.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Layers className="w-6 h-6 text-lime-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Portfolio Projects</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Build and defend real-world projects that showcase your skills to hiring managers:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {career.projects.map((proj) => (
                    <div key={proj.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          {proj.difficulty}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">Cap Project</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">{proj.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{proj.description}</p>
                      {proj.technologies && (
                        <div className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block">
                          {proj.technologies}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Courses (if linked) */}
            {career.courses && career.courses.length > 0 && (
              <div id="recommended-courses-section">
                <div className="flex items-center gap-2.5 mb-2">
                  <Sparkles className="w-6 h-6 text-lime-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Courses</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Courses mapped directly to this career path curriculum. Enroll or start learning:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {career.courses.map((c) => {
                    const isPurchasing = purchasingCourseId === c.courseId;
                    const isIncludedInCareer = Boolean(isEnrolledInCareer && (c.included !== false));
                    const isDirectEnrolled = c.enrollmentStatus === 'ENROLLED' || (c.courseAccess && !isIncludedInCareer);
                    const isEnrolled = isIncludedInCareer || isDirectEnrolled;
                    const isCompleted = c.completed || c.enrollmentStatus === 'COMPLETED';
                    const isPending = c.paymentStatus === 'PENDING';
                    const isFailed = c.paymentStatus === 'FAILED';
                    const notLoggedIn = !currentUser;

                    return (
                      <div
                        key={c.id || c.courseId}
                        className={`bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${
                          isEnrolled ? 'border-lime-400 ring-1 ring-lime-200/80' : 'border-gray-200'
                        }`}
                      >
                        <div>
                          {/* Card Header: Category badge & Price / Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-lime-700 bg-lime-50 px-2.5 py-1 rounded-md">
                              {c.courseCategory || c.category || 'Course Track'}
                            </span>
                            <div className="text-right">
                              {isCompleted ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Completed</span>
                                </span>
                              ) : isIncludedInCareer ? (
                                <span className="text-xs font-bold text-lime-700 bg-lime-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                                  <span>Included with Career Path</span>
                                </span>
                              ) : isDirectEnrolled ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Enrolled</span>
                                </span>
                              ) : isPending ? (
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                  Pending
                                </span>
                              ) : (
                                <span className="text-base font-extrabold text-gray-900">
                                  ₹{(c.coursePrice || c.price || 0).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Thumbnail & Title */}
                          <div
                            onClick={() => onNavigate(`/courses/${c.courseId}`)}
                            className="flex items-start gap-3.5 mb-3.5 cursor-pointer group"
                          >
                            <img
                              src={c.courseThumbnail || c.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80'}
                              alt={c.courseTitle || c.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 ring-1 ring-gray-100 group-hover:opacity-95 transition-opacity"
                            />
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-lime-700 transition-colors">
                                {c.courseTitle || c.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                {(c.courseLevel || c.level) && <span>{c.courseLevel || c.level}</span>}
                                {(c.courseLevel || c.level) && <span>•</span>}
                                <span>{isIncludedInCareer ? 'Included in Program' : 'Standalone Course'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar if enrolled */}
                          {isEnrolled && (
                            <div className="mb-3.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-gray-500 font-medium">Your Progress</span>
                                <span className="font-bold text-lime-700">{c.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-lime-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(5, c.progress || 0)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons with Real Backend Status */}
                        <div className="pt-3 border-t border-gray-100 mt-2">
                          {isCompleted ? (
                            <button
                              id={`course-view-cert-btn-${c.courseId}`}
                              onClick={(e) => handleCourseAction(c, e)}
                              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Award className="w-4 h-4 text-emerald-100" />
                              <span>View Certificate</span>
                            </button>
                          ) : isEnrolled ? (
                            <button
                              id={`course-start-learning-btn-${c.courseId}`}
                              onClick={(e) => handleCourseAction(c, e)}
                              className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4 text-lime-400" />
                              <span>Start Learning</span>
                            </button>
                          ) : isPending ? (
                            <button
                              disabled
                              className="w-full py-2.5 px-4 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Payment Pending</span>
                            </button>
                          ) : isFailed ? (
                            <button
                              id={`course-buy-again-btn-${c.courseId}`}
                              disabled={isPurchasing}
                              onClick={(e) => handleCourseAction(c, e)}
                              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isPurchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                              <span>Buy Again (₹{c.coursePrice || c.price})</span>
                            </button>
                          ) : notLoggedIn ? (
                            <button
                              id={`course-enroll-now-btn-${c.courseId}`}
                              onClick={(e) => handleCourseAction(c, e)}
                              className="w-full py-2.5 px-4 bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <span>Sign Up to Continue</span>
                            </button>
                          ) : (
                            <button
                              id={`course-buy-now-btn-${c.courseId}`}
                              disabled={isPurchasing}
                              onClick={(e) => handleCourseAction(c, e)}
                              className="w-full py-2.5 px-4 bg-[#8DB600] hover:bg-[#7ba000] text-gray-900 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              {isPurchasing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Opening Checkout...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4" />
                                  <span>Buy Course (₹{(c.coursePrice || c.price || 0).toLocaleString('en-IN')})</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 11: Credential Edge Integration */}
            <div id="credential-edge-section" className="p-6 sm:p-8 bg-gradient-to-br from-amber-50/50 via-white to-lime-50/30 rounded-3xl border border-amber-200/70 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                    Credential Edge
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Recommended Credentials for this Career
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                Elevate your resume and demonstrate verified industry competencies through Google certified credential pathways:
              </p>

              {recCredentials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recCredentials.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-amber-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {c.category}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-500">
                            {isEnrolledInCareer ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                Included in your Career Path
                              </span>
                            ) : (
                              <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                Purchase Separately
                              </span>
                            )}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base mb-1">{c.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                          {c.credentialName || c.shortDescription}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">
                          {c.free ? 'Free' : `₹${c.price}`}
                        </span>
                        <button
                          onClick={() => onNavigate(`/credential-edge/${c.slug}`)}
                          className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Explore Credential</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-white border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Google Professional Certificates</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Explore industry-recognized Google credentials to complement your {career.title} pathway.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/credential-edge')}
                    className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Browse All Google Courses
                  </button>
                </div>
              )}
            </div>

            {/* Section 12: Complete Your Career Flow */}
            <div className="p-6 sm:p-8 bg-gray-900 text-white rounded-3xl border border-gray-800 shadow-lg">
              <span className="text-[10px] font-extrabold text-lime-400 uppercase tracking-wider block mb-1">
                Complete Your Career Flow
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
                Your 3-Stage Learning Journey
              </h3>
              <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                Seamlessly progress from your career role goal to hands-on skill building with InGage, and finish with globally recognized Google credentials.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-lime-400 font-bold block mb-0.5">1. Career Goal</span>
                  <p className="text-xs font-bold text-white">{career.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Career Compass</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-lime-400 font-bold block mb-0.5">2. Build Skills</span>
                  <p className="text-xs font-bold text-white">InGage {career.title} Syllabus</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Skill Forge</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-lime-400 font-bold block mb-0.5">3. Earn Credentials</span>
                  <p className="text-xs font-bold text-white">Google Certified Course</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Credential Edge</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('/credential-edge')}
                className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-950 font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue Your Journey</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Career Opportunities Grid */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Briefcase className="w-6 h-6 text-lime-600" />
                <h2 className="text-2xl font-bold text-gray-900">Target Career Opportunities</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Upon completion, you'll be qualified for these in-demand roles:
              </p>

              {/* 2x2 Grid of Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {jobOpportunities.map((title, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-3.5 hover:border-gray-300 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{title}</span>
                  </div>
                ))}
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#EAF8E6]/60 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900">{career.jobOpenings}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Open Positions</div>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900">{career.salary?.formatted || 'Competitive'}</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Median Salary</div>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2 text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900">85%</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Placement Rate</div>
                </div>
              </div>
            </div>

            {/* Top Hiring Companies */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Award className="w-6 h-6 text-lime-600" />
                <h2 className="text-2xl font-bold text-gray-900">Top Hiring Companies</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Our graduates are working at leading companies worldwide
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Amazon', 'Infosys', 'TCS', 'Wipro'].map((company, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-white border border-gray-200 text-center font-bold text-gray-800 shadow-2xs hover:border-lime-500 transition-colors flex items-center justify-center min-h-[72px]"
                  >
                    <span>{company}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Sticky Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Program Pricing Card */}
            <div className="bg-[#F8FAF4] border border-lime-200 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                <span className="text-lime-700 font-bold text-lg">₹</span>
                <span>Program Pricing</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  ₹ {(career.price || 14999).toLocaleString('en-IN')}
                </span>
                <span className="text-gray-400 line-through text-lg font-medium">
                  ₹ {(career.originalPrice || 24999).toLocaleString('en-IN')}
                </span>
              </div>

              <span className="inline-block mt-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
                {career.discountPercent || 40}% OFF - Limited Time Offer
              </span>

              <div className="mt-6 space-y-3 pt-4 border-t border-lime-200/70 text-sm text-gray-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Full access to all {modulesList.length} modules</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>{career.certificationName || 'Industry-recognized certification'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Lifetime access to curriculum updates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>1-on-1 mentor support & review</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0" />
                  <span>Placement assistance & interview prep</span>
                </div>
              </div>

              {/* Certificate Claim Banner if Completed */}
              {(careerAccess?.certificateAvailable || isCareerCompleted) && (
                <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Career Certification Ready!</span>
                  </div>
                  <p className="text-xs text-emerald-700 mb-3">
                    {careerCert
                      ? `Your verified Certificate (${careerCert.certificateNumber}) is issued.`
                      : 'You have completed all requirements for this Career Path.'}
                  </p>
                  {!careerCert ? (
                    <button
                      onClick={handleClaimCertificate}
                      disabled={claimingCert}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {claimingCert ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                      <span>Claim Career Certificate</span>
                    </button>
                  ) : (
                    <div className="text-xs font-mono font-bold bg-white text-emerald-800 p-2 rounded border border-emerald-200 text-center">
                      ID: {careerCert.certificateNumber}
                    </div>
                  )}
                </div>
              )}

              {!currentUser ? (
                <>
                  <button
                    id="pricing-sidebar-signup-btn"
                    onClick={handleEnrollClick}
                    className="w-full mt-6 py-3.5 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-base shadow-xs transition-colors text-center cursor-pointer"
                  >
                    Sign Up to Continue
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                    Create a free account to get started
                  </p>
                </>
              ) : isCareerCompleted ? (
                <>
                  <button
                    id="pricing-sidebar-completed-btn"
                    onClick={handleEnrollClick}
                    className="w-full mt-6 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5" />
                    <span>View Program</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                    You have completed this program
                  </p>
                </>
              ) : isEnrolledInCareer ? (
                <>
                  <button
                    id="pricing-sidebar-continue-btn"
                    onClick={handleEnrollClick}
                    className="w-full mt-6 py-3.5 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-base shadow-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-5 h-5 text-lime-400" />
                    <span>Continue Learning</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                    Resume your {career.title} curriculum
                  </p>
                </>
              ) : (
                <>
                  <button
                    id="pricing-sidebar-enroll-btn"
                    onClick={handleEnrollClick}
                    disabled={isPurchasingCareer}
                    className="w-full mt-6 py-3.5 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-base shadow-xs transition-colors text-center cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isPurchasingCareer ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Opening Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Enroll Now (₹{(career.price || 14999).toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2 font-medium">
                    Start your {career.title} learning journey
                  </p>
                </>
              )}
            </div>

            {/* Course Materials Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
              <h4 className="font-bold text-gray-900 text-sm mb-3">Curriculum Materials</h4>
              <button
                id="download-syllabus-btn"
                onClick={handleDownloadCurriculum}
                disabled={isDownloading}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-lime-600" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloading ? 'Downloading...' : 'Download Curriculum'}</span>
              </button>
            </div>

            {/* Share this course Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
              <h4 className="font-bold text-gray-900 text-sm mb-3">Share this career path</h4>
              <div className="flex items-center gap-3">
                <button
                  id="share-course-btn"
                  onClick={handleShare}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Share link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  id="save-course-btn"
                  onClick={handleDownloadCurriculum}
                  disabled={isDownloading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  title="Download overview"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-lime-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Requirement Modal */}
      {showPurchasePrompt && (
        <div
          id="curriculum-purchase-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPurchasePrompt(false);
          }}
        >
          <div
            id="curriculum-purchase-modal-card"
            className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-7 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Purchase Required
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Curriculum download is reserved for enrolled students
                  </p>
                </div>
              </div>
              <button
                id="close-purchase-prompt-btn"
                onClick={() => setShowPurchasePrompt(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                Purchase the course to download the curriculum.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Gain instant lifetime access to all learning roadmaps, sequential milestone lessons, and project source files.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {(() => {
                const targetCourse =
                  career.courses?.find(
                    (c) => !c.courseAccess && c.enrollmentStatus !== 'ENROLLED' && c.enrollmentStatus !== 'COMPLETED'
                  ) || career.courses?.[0];

                if (targetCourse) {
                  return (
                    <button
                      id="prompt-buy-course-btn"
                      onClick={() => {
                        setShowPurchasePrompt(false);
                        handleCourseAction(targetCourse);
                      }}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm tracking-wide transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Enroll Now (₹{(targetCourse.coursePrice || targetCourse.price || 14999).toLocaleString('en-IN')})
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    id="prompt-view-courses-btn"
                    onClick={() => {
                      setShowPurchasePrompt(false);
                      document.getElementById('recommended-courses-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm tracking-wide transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Courses to Enroll</span>
                  </button>
                );
              })()}

              <button
                id="prompt-cancel-btn"
                onClick={() => setShowPurchasePrompt(false)}
                className="w-full sm:w-auto py-3 px-5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CareerDetailPage;
