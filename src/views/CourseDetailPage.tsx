"use client";
import { formatDurationHuman, formatDurationMMSS, parseDurationToSeconds } from "@/lib/duration";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  CheckCircle2,
  Lock,
  PlayCircle,
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

interface CourseDetailPageProps {
  courseId: number | string;
  onNavigate: (path: string, param?: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'signup', redirectUrl?: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  courseId,
  onNavigate,
  currentUser: propUser,
  onOpenAuth,
  onShowToast,
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

  // Accordion toggle for sections
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Unified Access detail state (Direct course purchase, Career path inclusion, or both)
  const [accessDetail, setAccessDetail] = useState<CourseAccessDetail | null>(null);

  const courseTotalVideoDuration = React.useMemo(() => {
    if (!course?.sections) return '';
    let totalSec = 0;
    course.sections.forEach((sec: any) => {
      (sec.lessons || []).forEach((les: any) => {
        totalSec += parseDurationToSeconds(les.duration, les.durationSeconds);
      });
    });
    return totalSec > 0 ? formatDurationHuman(totalSec) : '';
  }, [course?.sections]);

  const numericCourseId = Number(courseId);

  useEffect(() => {
    if (numericCourseId) {
      dispatch(fetchCourseContent(numericCourseId));
      if (currentUser) {
        getCourseAccessStatus(numericCourseId)
          .then((res) => setAccessDetail(res))
          .catch(() => {
            setAccessDetail({
              courseId: numericCourseId,
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
  }, [numericCourseId, currentUser, dispatch]);

  useEffect(() => {
    if (course?.sections && course.sections.length > 0) {
      setExpandedSections((prev) => {
        if (Object.keys(prev).length === 0) {
          return { [course.sections[0].id]: true };
        }
        return prev;
      });
    }
  }, [course]);

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
      onOpenAuth('login', `/courses/${numericCourseId}`);
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
        onOpenAuth('login', `/courses/${numericCourseId}`);
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

  const hasAccess = Boolean(course?.isEnrolled || accessDetail?.hasAccess);
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
      onOpenAuth('login', `/courses/${numericCourseId}`);
      return;
    }

    if (!course) return;

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
        if (onShowToast) onShowToast('Congratulations! You are enrolled in this free course.', 'success');
        setPaymentState('idle');
        dispatch(fetchCourseContent(numericCourseId));
        onNavigate('/payment/success', JSON.stringify({
          courseTitle: course.title,
          courseId: course.id,
          orderNumber: 'FREE-ENROLL',
          paymentNumber: 'FREE',
          amountPaid: 0,
        }));
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
        amount: orderRes.amountInPaise,
        currency: orderRes.currency || 'INR',
        name: 'Ingage LMS',
        description: `Enrollment: ${course.title}`,
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
              dispatch(fetchCourseContent(numericCourseId));
              dispatch(fetchMyEnrollments());
              if (onShowToast) onShowToast('Payment verified successfully! Access granted.', 'success');
              onNavigate(
                '/payment/success',
                JSON.stringify({
                  courseTitle: course.title,
                  courseId: course.id,
                  orderNumber: verifyRes.orderNumber,
                  paymentNumber: verifyRes.paymentNumber,
                  amountPaid: appliedCoupon ? appliedCoupon.finalAmount : (course.finalPrice ?? course.price),
                })
              );
            } else {
              setPaymentState('idle');
              onNavigate('/payment/failed');
            }
          } catch (err: any) {
            console.error(err);
            setPaymentState('idle');
            onNavigate('/payment/failed');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failRes: any) => {
        setPaymentState('idle');
        console.error('Razorpay Payment Failed:', failRes);
        if (onShowToast) onShowToast(failRes.error?.description || 'Payment failed.', 'error');
        onNavigate('/payment/failed');
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

  const isCurrentCourse = course && course.id === numericCourseId;
  const isStillLoading = !isNaN(numericCourseId) && (loading || (!isCurrentCourse && !error));

  if (isStillLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="w-8 h-8 text-lime-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading course syllabus and curriculum...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course Unavailable</h2>
        <p className="text-sm text-gray-600 max-w-md mb-6">{error || 'Could not locate the requested course.'}</p>
        <div className="flex items-center gap-3">
          {!isNaN(numericCourseId) && (
            <button
              onClick={() => dispatch(fetchCourseContent(numericCourseId))}
              className="px-5 py-2.5 bg-lime-600 text-white font-semibold rounded-xl hover:bg-lime-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onNavigate('/courses')}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const basePrice = course.finalPrice ?? course.price;
  const isFree = basePrice === 0;
  const currentPayable = appliedCoupon ? appliedCoupon.finalAmount : basePrice;

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/courses')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Courses</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Category:</span>
            <span className="text-xs font-bold text-lime-700 bg-lime-50 px-2.5 py-1 rounded-full border border-lime-200/60">
              {course.category}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
                  {courseTotalVideoDuration ? `Total Video Length: ${courseTotalVideoDuration}` : course.duration}
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-lime-600" />
                    <span>Curriculum & Lessons</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Structured modular path designed for comprehensive mastery
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200/60">
                  {course.sections?.length || 0} Modules{courseTotalVideoDuration ? ` • ${courseTotalVideoDuration}` : ''}
                </span>
              </div>

              {/* Sections Accordion */}
              <div className="space-y-4">
                {course.sections && course.sections.length > 0 ? (
                  course.sections.map((section, idx) => {
                    const isExpanded = expandedSections[section.id];
                    let moduleSec = 0;
                    (section.lessons || []).forEach((les: any) => {
                      moduleSec += parseDurationToSeconds(les.duration, les.durationSeconds);
                    });
                    const moduleVideoDuration = moduleSec > 0 ? formatDurationHuman(moduleSec) : '';

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
                              Module {idx + 1}
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
                              {section.lessons?.length || 0} {section.lessons?.length === 1 ? 'lesson' : 'lessons'}{moduleVideoDuration ? ` • ${moduleVideoDuration}` : ''}
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
                            {section.lessons && section.lessons.length > 0 ? (
                              section.lessons.map((lesson, lessonIdx) => (
                                <div
                                  key={lesson.id}
                                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {lesson.locked ? (
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                        <Lock className="w-4 h-4" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-lime-50 text-lime-700 flex items-center justify-center shrink-0">
                                        <PlayCircle className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                        <span>{lessonIdx + 1}. {lesson.title}</span>
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
                                      {lesson.duration || (lesson.durationSeconds ? formatDurationMMSS(lesson.durationSeconds) : '10:00')}
                                    </span>
                                    {!lesson.locked || hasAccess ? (
                                      <button
                                        onClick={() => onNavigate(`/learn/${course.slug || course.id}`)}
                                        className="text-xs font-bold text-lime-700 hover:text-lime-800 hover:underline cursor-pointer"
                                      >
                                        Play
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (!currentUser) {
                                            if (onShowToast) onShowToast('Please login to enroll and unlock lessons.', 'info');
                                            onOpenAuth('login', `/courses/${numericCourseId}`);
                                          } else {
                                            if (onShowToast) onShowToast('Enroll in this course to unlock all lessons and learning videos.', 'info');
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
                              ))
                            ) : (
                              <div className="p-4 text-xs text-gray-400 text-center">
                                Lessons being finalized by instructor.
                              </div>
                            )}
                            {moduleVideoDuration && (
                              <div className="px-5 py-3 bg-gray-50/70 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100">
                                <span className="font-semibold text-gray-700">Total:</span>
                                <span className="font-bold text-gray-900 font-mono">{moduleVideoDuration}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-2xl">
                    Full curriculum schedule will be posted shortly.
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

              {/* Coupon Input Box (Only for paid & not enrolled/included) */}
              {!isFree && !hasAccess && (
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
                            onOpenAuth('login', `/courses/${numericCourseId}`);
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

              {/* Action Button: Enroll Now / Buy Now / Start Learning */}
              <div className="pt-2">
                {hasAccess ? (
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
                    <span>{isCareerIncludedOnly ? 'Start Learning' : 'Continue Learning'}</span>
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
                        <span>{isFree ? 'Enroll Free Now' : `Buy Now • ${formatPrice(currentPayable)}`}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

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
