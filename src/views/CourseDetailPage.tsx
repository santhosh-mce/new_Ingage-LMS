"use client";
import {
  formatDurationHuman, formatDurationMMSS, parseDurationToSeconds } from "@/lib/duration";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Clock,
  User,
  Shield,
  CheckCircle2,
  Lock,
  PlayCircle,
  HelpCircle,
  FolderKanban,
  Radio,
  Tag,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard
} from 'lucide-react';
import {
  getCourseContent,
  createPaymentOrder,
  verifyPayment,
  validateCoupon,
  getCourseAccessStatus,
  CourseContentDetail,
  CourseAccessDetail
} from '../api/paymentApi';
import { UserProfile } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCourseContent, markCourseAsEnrolled, fetchMyEnrollments } from '../store/slices/courseSlice';

declare global {
  interface Window {
    Razorpay: any;
  }
}


type CurriculumContentType = 'VIDEO' | 'QUIZ' | 'PROJECT' | 'LIVE_CLASS';

const normalizeLessonType = (type?: string): CurriculumContentType => {
  if (!type) return 'VIDEO';
  const clean = String(type).trim().toUpperCase().replace(/[\s-]/g, '_');
  if (clean.includes('QUIZ')) return 'QUIZ';
  if (clean.includes('PROJECT')) return 'PROJECT';
  if (clean.includes('LIVE') || clean.includes('CLASS')) return 'LIVE_CLASS';
  return 'VIDEO';
};

const curriculumTabs: Array<{
  id: CurriculumContentType;
  label: string;
  icon: React.ElementType;
  emptyMessage: string;
  actionText: string;
}> = [
  {
    id: 'VIDEO',
    label: 'Videos',
    icon: PlayCircle,
    emptyMessage: 'No videos available for this course.',
    actionText: 'Play',
  },
  {
    id: 'QUIZ',
    label: 'Quizzes',
    icon: HelpCircle,
    emptyMessage: 'No quizzes available for this course.',
    actionText: 'Start Quiz',
  },
  {
    id: 'PROJECT',
    label: 'Projects',
    icon: FolderKanban,
    emptyMessage: 'No projects available for this course.',
    actionText: 'View Project',
  },
  {
    id: 'LIVE_CLASS',
    label: 'Live Classes',
    icon: Radio,
    emptyMessage: 'No live classes available for this course.',
    actionText: 'Join Class',
  },
];

interface CourseDetailPageProps {
  courseId: number | string;
  onNavigate: (path: string, param?: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  embeddedInLayout?: boolean;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  courseId,
  onNavigate,
  currentUser: propUser,
  onOpenAuth,
  onShowToast,
  embeddedInLayout = false,
}) => {
  const dispatch = useAppDispatch();
  const { user: authUser } = useAppSelector((state) => state.auth);
  const currentUser = propUser || authUser;

  const { selectedCourseContent: course, contentLoading: loading, error } = useAppSelector(
    (state) => state.course
  );

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment process state: 'idle' | 'creating_order' | 'checkout_open' | 'verifying'
  const [paymentState, setPaymentState] = useState<'idle' | 'creating_order' | 'checkout_open' | 'verifying'>('idle');

  // Content type tab: VIDEO | QUIZ | PROJECT | LIVE_CLASS
  const [activeCurriculumTab, setActiveCurriculumTab] = useState<CurriculumContentType>('VIDEO');

  // Accordion toggle for sections
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Unified Access detail state (Direct course purchase, Career path inclusion, or both)
  const [accessDetail, setAccessDetail] = useState<CourseAccessDetail | null>(null);

  // Overall course duration across ALL lessons (e.g. 2 hr 28 min)
  // Optimized single-pass calculation for total duration, tab counts, and tab durations
  const { courseTotalAllDuration, tabCounts, tabDurations } = React.useMemo(() => {
    const counts: Record<CurriculumContentType, number> = {
      VIDEO: 0,
      QUIZ: 0,
      PROJECT: 0,
      LIVE_CLASS: 0,
    };
    const sums: Record<CurriculumContentType, number> = {
      VIDEO: 0,
      QUIZ: 0,
      PROJECT: 0,
      LIVE_CLASS: 0,
    };
    let totalSec = 0;

    if (course?.sections) {
      course.sections.forEach((sec: any) => {
        (sec.lessons || []).forEach((les: any) => {
          const type = normalizeLessonType(les.lessonType || les.lesson_type || les.type);
          counts[type] = (counts[type] || 0) + 1;
          const secDuration = parseDurationToSeconds(les.duration, les.durationSeconds);
          sums[type] += secDuration;
          totalSec += secDuration;
        });
      });
    }

    const durations: Record<CurriculumContentType, string> = {
      VIDEO: sums.VIDEO > 0 ? formatDurationHuman(sums.VIDEO) : '',
      QUIZ: sums.QUIZ > 0 ? formatDurationHuman(sums.QUIZ) : '',
      PROJECT: sums.PROJECT > 0 ? formatDurationHuman(sums.PROJECT) : '',
      LIVE_CLASS: sums.LIVE_CLASS > 0 ? formatDurationHuman(sums.LIVE_CLASS) : '',
    };

    return {
      courseTotalAllDuration: totalSec > 0 ? formatDurationHuman(totalSec) : '',
      tabCounts: counts,
      tabDurations: durations,
    };
  }, [course?.sections]);

  // Filtered sections for active tab only (preserving original Module 1, Module 2, Module 3... numbers)
  const filteredCurriculumSections = React.useMemo(() => {
    if (!course?.sections) return [];
    return course.sections
      .map((section: any, originalIndex: number) => {
        const lessons = (section.lessons || []).filter((les: any) => {
          const type = normalizeLessonType(les.lessonType || les.lesson_type || les.type);
          return type === activeCurriculumTab;
        });
        return {
          ...section,
          moduleNumber: originalIndex + 1,
          filteredLessons: lessons,
        };
      })
      .filter((sec: any) => sec.filteredLessons.length > 0);
  }, [course?.sections, activeCurriculumTab]);

  const activeTabMeta = React.useMemo(() => {
    return curriculumTabs.find((t) => t.id === activeCurriculumTab) || curriculumTabs[0];
  }, [activeCurriculumTab]);

  const activeTabTotalLessons = tabCounts[activeCurriculumTab] || 0;
  const activeTabTotalDuration = tabDurations[activeCurriculumTab] || '';

  const numericCourseId = !isNaN(Number(courseId)) ? Number(courseId) : (course?.id || 0);

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseContent(courseId));
      if (currentUser) {
        getCourseAccessStatus(courseId)
          .then((res) => setAccessDetail(res))
          .catch(() => {
            setAccessDetail({
              courseId: Number(course?.id || numericCourseId) || 0,
              hasAccess: false,
              accessType: 'NONE',
              progressPercentage: 0,
              completed: false,
              certificateAvailable: false,
            });
          });
      } else {
        setAccessDetail(null);
      }
    }
  }, [courseId, numericCourseId, course?.id, currentUser, dispatch]);

  // Auto-expand all sections in active tab so lessons are immediately visible
  useEffect(() => {
    if (filteredCurriculumSections && filteredCurriculumSections.length > 0) {
      setExpandedSections((prev) => {
        const next = { ...prev };
        filteredCurriculumSections.forEach((s: any) => {
          if (next[s.id] === undefined) {
            next[s.id] = true;
          }
        });
        return next;
      });
    }
  }, [filteredCurriculumSections]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !course) return;

    if (!currentUser) {
      try {
        sessionStorage.setItem('ingage_pending_coupon', couponCode.trim());
      } catch {}
      setCouponError('Please login to apply a coupon.');
      if (onShowToast) onShowToast('Please login to apply a coupon.', 'info');
      onOpenAuth('login', `/courses/${course?.slug || courseId}`);
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const baseAmount = course.finalPrice ?? course.price;
      const res = await validateCoupon(couponCode.trim(), baseAmount);
      if (res.valid && res.finalAmount !== undefined) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: res.discountAmount || 0,
          finalAmount: res.finalAmount,
        });
        try {
          sessionStorage.removeItem('ingage_pending_coupon');
        } catch {}
        if (onShowToast) onShowToast(`Coupon "${couponCode.trim()}" applied successfully!`, 'success');
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setCouponError('Please login to apply a coupon.');
        onOpenAuth('login', `/courses/${course?.slug || courseId}`);
      } else {
        setCouponError('Failed to validate coupon. Please try again.');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Load Razorpay Script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
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

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const hasAccess = Boolean(isAdmin || course?.isEnrolled || accessDetail?.hasAccess);
  const isCareerIncludedOnly = accessDetail?.hasAccess && accessDetail?.accessType === 'CAREER_PATH_INCLUDED';
  const careerName = accessDetail?.careerPathName || 'Career Path';

  const handleEnrollOrBuy = async () => {
    if (!currentUser) {
      if (couponCode.trim()) {
        try {
          sessionStorage.setItem('ingage_pending_coupon', couponCode.trim());
        } catch {}
      }
      if (onShowToast) onShowToast('Login required to purchase this course.', 'info');
      onOpenAuth('login', `/courses/${course?.slug || courseId}`);
      return;
    }

    if (!course) return;

    if (currentUser?.role?.toUpperCase() === 'ADMIN') {
      if (onShowToast) onShowToast('Administrators cannot purchase courses.', 'info');
      onNavigate(`/admin/courses/new?id=${course.id}`);
      return;
    }

    if (hasAccess || course.isEnrolled) {
      onNavigate(`/learn/${course.slug || course.id}`);
      return;
    }

    try {
      setPaymentState('creating_order');

      // Call backend to create order & calculate backend price
      const orderRes = await createPaymentOrder(
        course.id,
        appliedCoupon ? appliedCoupon.code : undefined
      );

      // Free Course: Enrolled immediately without Razorpay payment
      if (orderRes.free) {
        setPaymentState('idle');
        dispatch(markCourseAsEnrolled(course.id));
        dispatch(fetchCourseContent(course.slug || courseId));
        dispatch(fetchMyEnrollments());
        getCourseAccessStatus(course.slug || courseId)
          .then((res) => setAccessDetail(res))
          .catch(() => {});
        if (onShowToast) onShowToast('Congratulations! You are enrolled in this free course. Click Start Course to begin learning.', 'success');
        return;
      }

      // Paid Course: Open Razorpay Checkout
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setPaymentState('idle');
        if (onShowToast) onShowToast('Failed to load Razorpay payment gateway. Check your connection.', 'error');
        return;
      }

      setPaymentState('checkout_open');

      const options = {
        key: (orderRes.keyId || 'rzp_test_TccoJ6A0ra1dCg').trim(),
        amount: orderRes.amountInPaise || Math.round((orderRes.amount || 0) * 100),
        currency: orderRes.currency || 'INR',
        name: 'InGage EduTech',
        description: `Enrollment: ${course.title}`,
        order_id: (orderRes.razorpayOrderId || (orderRes as any).orderId || '').toString().trim(),
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
        },
        theme: {
          color: '#65a30d',
        },
        modal: {
          ondismiss: () => {
            setPaymentState('idle');
            if (onShowToast) onShowToast('Payment was cancelled.', 'info');
          },
        },
        handler: async (response: any) => {
          setPaymentState('verifying');
          try {
            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course.id,
            });

            if (verifyRes.success) {
              setPaymentState('idle');
              dispatch(markCourseAsEnrolled(course.id));
              dispatch(fetchCourseContent(course.slug || courseId));
              dispatch(fetchMyEnrollments());
              getCourseAccessStatus(course.slug || courseId)
                .then((res) => setAccessDetail(res))
                .catch(() => {});
              if (onShowToast) {
                onShowToast('Payment verified successfully! Access granted. Click Start Course to begin.', 'success');
              }
              // STRICT LMS REQUIREMENT: Remain on exact same course details page (/courses/slug)
            } else {
              setPaymentState('idle');
              if (onShowToast) onShowToast(verifyRes.message || 'Payment verification failed. Please try again.', 'error');
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            setPaymentState('idle');
            if (onShowToast) onShowToast(err.response?.data?.error || err.message || 'Payment verification could not be completed.', 'error');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failRes: any) => {
        setPaymentState('idle');
        console.error('Razorpay Payment Failed:', failRes);
        if (onShowToast) onShowToast(failRes.error?.description || 'Payment failed. Please try again.', 'error');
      });
      rzp.open();
    } catch (err: any) {
      setPaymentState('idle');
      const msg = err.response?.data?.error || err.message || 'Payment initiation failed.';
      if (onShowToast) onShowToast(msg, 'error');
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const isCurrentCourse = Boolean(
    course && (
      (course.slug && String(course.slug).toLowerCase() === String(courseId).toLowerCase()) ||
      (course.id && Number(course.id) === Number(courseId)) ||
      String(course.id) === String(courseId)
    )
  );
  const isStillLoading = loading || (!isCurrentCourse && !error);

  if (isStillLoading) {
    if (embeddedInLayout) {
      return (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Loading course syllabus and curriculum...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-lime-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading course syllabus and curriculum...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={`${embeddedInLayout ? 'py-16' : 'min-h-screen bg-[#FBFBFA]'} flex flex-col items-center justify-center p-8 text-center`}>
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course Unavailable</h2>
        <p className="text-sm text-gray-600 max-w-md mb-6">{error || 'Could not locate the requested course.'}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchCourseContent(courseId))}
            className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => onNavigate(embeddedInLayout ? '/my-courses' : '/courses')}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
          >
            {embeddedInLayout ? 'Back to My Courses' : 'Back to Courses'}
          </button>
        </div>
      </div>
    );
  }

  const basePrice = course.finalPrice ?? course.price;
  const isFree = basePrice === 0;
  const currentPayable = appliedCoupon ? appliedCoupon.finalAmount : basePrice;

  return (
    <div className={embeddedInLayout ? "space-y-6" : "min-h-screen bg-[#FBFBFA] pb-24"}>
      {/* Top Breadcrumb Bar */}
      <div className={embeddedInLayout ? "flex items-center justify-between pb-3 border-b border-gray-200/80" : "bg-white border-b border-gray-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90"}>
        <div className={embeddedInLayout ? "w-full flex items-center justify-between" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between"}>
          <button
            onClick={() => onNavigate(embeddedInLayout ? '/my-courses' : '/courses')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{embeddedInLayout ? 'Back to My Courses' : 'All Courses'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Category:</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              {course.category}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className={embeddedInLayout ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Course Information & Curriculum */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-lime-100 text-lime-800 rounded-full text-xs font-semibold tracking-wide uppercase">
                  {course.level} Level
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  {courseTotalAllDuration ? `Total Course Duration: ${courseTotalAllDuration}` : course.duration}
                </span>
                {hasAccess && (
                  <span className={`px-3 py-1 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs ${
                    isCareerIncludedOnly ? 'bg-indigo-600' : 'bg-emerald-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isCareerIncludedOnly
                      ? `Included with ${careerName}`
                      : (accessDetail?.accessType === 'BOTH' ? 'Enrolled & Career Included' : 'Enrolled')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-4">
                {course.title}
              </h1>

              <p className="text-gray-600 text-base leading-relaxed mb-6">
                {course.description}
              </p>

              {/* Instructor Card */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                  {course.instructor ? course.instructor.charAt(0) : 'I'}
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Course Instructor</div>
                  <div className="text-sm font-semibold text-gray-900">{course.instructor || 'Lead Technical Mentor'}</div>
                </div>
              </div>
            </div>

            {/* Course Curriculum & Syllabus */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
              {/* Header Title & Overall Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-lime-600" />
                    <span>Curriculum & Lessons</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Structured modular path designed for comprehensive mastery
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200/60 self-start sm:self-auto">
                  {course.sections?.length || 0} Modules{courseTotalAllDuration ? ` • ${courseTotalAllDuration}` : ''}
                </span>
              </div>

              {/* Lesson Type Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
                {curriculumTabs.map((tab) => {
                  const isActive = activeCurriculumTab === tab.id;
                  const count = tabCounts[tab.id] || 0;
                  const TabIcon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCurriculumTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-lime-600 text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Subheading / Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
                <div className="flex items-center gap-2">
                  <activeTabMeta.icon className="w-4 h-4 text-lime-600" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{activeTabMeta.label}</h3>
                </div>
                {activeTabTotalLessons > 0 && (
                  <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200/60 self-start sm:self-auto">
                    {activeTabTotalLessons} {activeTabTotalLessons === 1 ? 'lesson' : 'lessons'}{activeTabTotalDuration ? ` • ${activeTabTotalDuration}` : ''}
                  </span>
                )}
              </div>

              {/* Sections Accordion */}
              <div className="space-y-4">
                {filteredCurriculumSections && filteredCurriculumSections.length > 0 ? (
                  filteredCurriculumSections.map((section: any) => {
                    const isExpanded = expandedSections[section.id];
                    let moduleSec = 0;
                    (section.filteredLessons || []).forEach((les: any) => {
                      moduleSec += parseDurationToSeconds(les.duration, les.durationSeconds);
                    });
                    const moduleDuration = moduleSec > 0 ? formatDurationHuman(moduleSec) : '';
                    const LessonIcon = activeTabMeta.icon;

                    return (
                      <div
                        key={section.id}
                        className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200"
                      >
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full px-5 py-4 bg-gray-50/70 hover:bg-gray-100 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-semibold text-lime-700 uppercase tracking-wider mb-0.5">
                              Module {section.moduleNumber}
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                              {section.title}
                            </div>
                            {section.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {section.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                              {section.filteredLessons?.length || 0}{' '}
                              {section.filteredLessons?.length === 1 ? 'lesson' : 'lessons'}
                              {moduleDuration ? ` • ${moduleDuration}` : ''}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {/* Lessons List */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-100 bg-white">
                            {section.filteredLessons && section.filteredLessons.length > 0 ? (
                              section.filteredLessons.map((lesson: any, lessonIdx: number) => {
                                const isLocked = lesson.locked && !hasAccess;
                                const lessonDurationDisplay =
                                  lesson.duration && lesson.duration !== '0:00' && lesson.duration !== '0'
                                    ? lesson.duration
                                    : (lesson.durationSeconds && lesson.durationSeconds > 0
                                      ? (activeTabMeta.id === 'QUIZ' || activeTabMeta.id === 'PROJECT' || activeTabMeta.id === 'LIVE_CLASS'
                                        ? formatDurationHuman(lesson.durationSeconds)
                                        : formatDurationMMSS(lesson.durationSeconds))
                                      : '15 min');

                                return (
                                  <div
                                    key={lesson.id}
                                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      {isLocked ? (
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                          <Lock className="w-4 h-4" />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center shrink-0">
                                          <LessonIcon className="w-4 h-4" />
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                          <span>
                                            {lessonIdx + 1}. {lesson.title}
                                          </span>
                                          {lesson.freePreview && (
                                            <span className="text-[10px] uppercase font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full">
                                              Free Preview
                                            </span>
                                          )}
                                        </div>
                                        {lesson.description && (
                                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                            {lesson.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-gray-500 font-mono font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60">
                                        {lessonDurationDisplay}
                                      </span>
                                      {!isLocked ? (
                                        <button
                                          onClick={() => onNavigate(`/learn/${course.slug || course.id}`)}
                                          className="text-xs font-bold text-lime-700 hover:text-lime-800 hover:underline cursor-pointer"
                                        >
                                          {activeTabMeta.actionText}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            if (!currentUser) {
                                              if (onShowToast)
                                                onShowToast(
                                                  'Please login to enroll and unlock lessons.',
                                                  'info'
                                                );
                                              onOpenAuth('login', `/courses/${course?.slug || courseId}`);
                                            } else {
                                              if (onShowToast)
                                                onShowToast(
                                                  'Enroll in this course to unlock all lessons and learning materials.',
                                                  'info'
                                                );
                                            }
                                          }}
                                          className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1"
                                          title="Enroll in course to unlock"
                                        >
                                          <Lock className="w-3 h-3" />
                                          <span>Locked</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-4 text-xs text-gray-400 text-center">
                                Lessons being finalized by instructor.
                              </div>
                            )}
                            {moduleDuration && section.filteredLessons.length > 1 && (
                              <div className="px-5 py-3 bg-gray-50/70 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100">
                                <span className="font-semibold text-gray-700">Total:</span>
                                <span className="font-bold text-gray-900 font-mono">{moduleDuration}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 px-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <activeTabMeta.icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {activeTabMeta.emptyMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Explore other learning tabs or check back soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Purchase & Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md lg:sticky lg:top-20 space-y-6">
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-lime-600" />
                  <span>{isCareerIncludedOnly ? 'Career Curriculum' : 'Verified Certification'}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  isCareerIncludedOnly ? 'text-indigo-700 bg-indigo-50 border border-indigo-200/60' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  {isCareerIncludedOnly ? 'Career Path Access' : 'Lifetime Access'}
                </span>
              </div>

              {/* Career Path Included Alert */}
              {isCareerIncludedOnly && (
                <div className="p-4 bg-indigo-50/90 border border-indigo-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Included in Your Career Path</span>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    You have unlocked complete access to this course through your enrolled <strong>{careerName}</strong> program.
                  </p>
                </div>
              )}

              {/* Price Display */}
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">
                  Tuition & Course Fee
                </span>
                {isCareerIncludedOnly ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-indigo-600">INCLUDED</span>
                    <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                      with {careerName}
                    </span>
                  </div>
                ) : isFree ? (
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600">FREE</div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      {formatPrice(currentPayable)}
                    </span>
                    {(appliedCoupon || (course.finalPrice && course.finalPrice < course.price)) && (
                      <span className="text-base text-gray-400 line-through font-normal">
                        {formatPrice(course.price)}
                      </span>
                    )}
                  </div>
                )}
                {!isFree && !isCareerIncludedOnly && appliedCoupon && (
                  <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center justify-between border border-emerald-200/60">
                    <span>Discount Applied: -{formatPrice(appliedCoupon.discountAmount)}</span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Coupon Input Box (Only for paid & not enrolled/included, not admin) */}
              {!isAdmin && !isFree && !hasAccess && (
                <div className="pt-2">
                  <label htmlFor="course-coupon-input" className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-2">
                    <Tag className="w-3.5 h-3.5 text-lime-600" />
                    <span>Have a Coupon Code?</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="course-coupon-input"
                      data-testid="course-coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME20"
                      disabled={couponLoading || !!appliedCoupon}
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 focus:outline-hidden focus:border-lime-500 focus:bg-white transition-all disabled:opacity-50"
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={handleRemoveCoupon}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {couponLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <div className="text-xs text-red-600 font-medium mt-1.5 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                      {!currentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            if (couponCode.trim()) {
                              try {
                                sessionStorage.setItem('ingage_pending_coupon', couponCode.trim());
                              } catch {}
                            }
                            onOpenAuth('login', `/courses/${course?.slug || courseId}`);
                          }}
                          className="text-xs text-lime-700 font-bold hover:underline cursor-pointer ml-2 shrink-0"
                        >
                          Login
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button: Enroll Now / Buy Now / Start Learning / Manage Course */}
              <div className="pt-2">
                {isAdmin ? (
                  <div className="space-y-3">
                    <button
                      id="continue-learning-admin-btn"
                      onClick={() => onNavigate(`/learn/${course.slug || course.id}`)}
                      className="w-full py-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                      title="Continue learning this course as Administrator"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Continue Learning</span>
                    </button>
                    <button
                      id="manage-course-admin-btn"
                      onClick={() => onNavigate(`/admin/courses/new?id=${course.id}`)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm border border-slate-700"
                      title="Open course management studio"
                    >
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>Manage Course</span>
                    </button>
                  </div>
                ) : hasAccess ? (
                  <button
                    id="continue-learning-btn"
                    onClick={() => onNavigate(`/learn/${course.slug || course.id}`)}
                    className={`w-full py-4 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isCareerIncludedOnly
                        ? 'bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'
                        : 'bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                    }`}
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>
                      {isCareerIncludedOnly
                        ? 'Start Learning'
                        : (accessDetail?.progressPercentage || course?.progressPercentage || 0) > 0
                        ? 'Continue Learning'
                        : 'Start Course'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleEnrollOrBuy}
                    disabled={paymentState !== 'idle'}
                    className="w-full py-4 bg-linear-to-r from-[#8DB600] to-[#65a30d] hover:from-[#7a9f00] hover:to-[#558a0b] disabled:opacity-60 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                  >
                    {paymentState === 'creating_order' && (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating secure payment...</span>
                      </>
                    )}
                    {paymentState === 'checkout_open' && (
                      <>
                        <CreditCard className="w-4 h-4 animate-pulse" />
                        <span>Processing payment...</span>
                      </>
                    )}
                    {paymentState === 'verifying' && (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying payment...</span>
                      </>
                    )}
                    {paymentState === 'idle' && (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>{isFree ? 'Enroll Free' : `Buy Course • ${formatPrice(currentPayable)}`}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Logged in as an <strong>Administrator</strong>. Course purchasing is restricted for admin accounts.</span>
                </div>
              )}

              {/* Value Props Bullet Points */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                  <span>Full access to video lectures, code walkthroughs, & quizzes</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                  <span>Verifiable certificate of completion upon 100% progress</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 shrink-0 mt-0.5" />
                  <span>100% secure 256-bit encrypted checkout via Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
