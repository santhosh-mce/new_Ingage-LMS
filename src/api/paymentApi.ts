import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PaymentOrderResponse {
  orderId: number;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  courseTitle?: string;
  courseId?: number;
  careerTitle?: string;
  careerId?: number;
  itemType?: 'COURSE' | 'CAREER_PATH';
  free?: boolean;
  message?: string;
}

export interface PaymentVerifyRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  courseId?: number;
  careerId?: number;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  orderNumber: string;
  paymentNumber: string;
  courseId?: number;
  courseTitle?: string;
  careerId?: number;
  careerTitle?: string;
}

export interface UserPaymentRecord {
  id: number;
  paymentNumber: string;
  orderNumber: string;
  razorpayPaymentId: string;
  courseId: number;
  courseName: string;
  amount: number;
  discount: number;
  finalAmount: number;
  currency: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentDate: string;
}

export interface UserEnrollmentRecord {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug?: string;
  thumbnail?: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt?: string;
  accessType?: 'NONE' | 'DIRECT_COURSE' | 'CAREER_PATH_INCLUDED' | 'BOTH';
  careerPathId?: number | null;
  careerPathName?: string | null;
  careerPathSlug?: string | null;
}

export interface CourseAccessDetail {
  courseId: number;
  hasAccess: boolean;
  accessType: 'NONE' | 'DIRECT_COURSE' | 'CAREER_PATH_INCLUDED' | 'BOTH';
  careerPathId?: number | null;
  careerPathName?: string | null;
  careerPathSlug?: string | null;
  directEnrollmentId?: number | null;
  directStatus?: string | null;
  progressPercentage: number;
  completed: boolean;
  certificateAvailable: boolean;
}

export interface CareerAccessDetail {
  careerId: number;
  careerTitle: string;
  careerSlug: string;
  enrolled: boolean;
  status: string;
  progressPercentage: number;
  completed: boolean;
  certificateAvailable: boolean;
  requiredCoursesCount?: number;
  completedRequiredCoursesCount?: number;
  courses?: Array<{
    courseId: number;
    courseTitle: string;
    isIncluded: boolean;
    isRequiredForCompletion: boolean;
    progress: number;
    completed: boolean;
  }>;
}

export interface CareerEnrollmentRecord {
  id: number;
  careerId: number;
  title: string;
  slug: string;
  category: string;
  level: string;
  duration: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  enrolledAt: string;
  completedAt?: string;
}

export type EnrollmentItem = UserEnrollmentRecord;

export interface CourseContentDetail {
  id: number;
  title: string;
  slug?: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor?: string;
  price: number;
  finalPrice?: number;
  isEnrolled: boolean;
  progressPercentage?: number;
  completedLessonIds?: number[];
  sections: Array<{
    id: number;
    title: string;
    description?: string;
    displayOrder: number;
    lessons: Array<{
      id: number;
      title: string;
      description?: string;
      lessonType: string;
      contentUrl?: string | null;
      duration?: string;
      durationSeconds?: number;
      freePreview: boolean;
      locked: boolean;
      required: boolean;
      displayOrder: number;
      completed?: boolean;
      watchDurationSeconds?: number;
    }>;
  }>;
}

// 1. Create Razorpay Payment Order (or free course enrollment)
export const createPaymentOrder = async (
  courseId: number,
  couponCode?: string
): Promise<PaymentOrderResponse> => {
  const res = await apiClient.post<PaymentOrderResponse>('/payments/create-order', {
    courseId,
    couponCode: couponCode ? couponCode.trim() : undefined,
  });
  return res.data;
};

// 2. Verify Razorpay Payment Signature
export const verifyPayment = async (
  payload: PaymentVerifyRequest
): Promise<PaymentVerifyResponse> => {
  const res = await apiClient.post<PaymentVerifyResponse>('/payments/verify', payload);
  return res.data;
};

// 3. Validate Discount Coupon
export const validateCoupon = async (
  couponCode: string,
  amount: number
): Promise<{
  valid: boolean;
  couponCode?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}> => {
  const res = await apiClient.post('/discounts/validate', {
    couponCode,
    amount,
  });
  return res.data;
};

// 4. Get Logged-in User's Payments
export const getMyPayments = async (): Promise<UserPaymentRecord[]> => {
  const res = await apiClient.get<UserPaymentRecord[]>('/payments/my-payments');
  return res.data;
};

// 5. Get Logged-in User's Active Enrollments
export const getMyEnrollments = async (): Promise<UserEnrollmentRecord[]> => {
  const res = await apiClient.get<UserEnrollmentRecord[]>('/learning/my-enrollments');
  return res.data;
};

// 6. Get Course Curriculum & Content (Enforces secure access)
export const getCourseContent = async (courseId: number | string): Promise<CourseContentDetail> => {
  const res = await apiClient.get<CourseContentDetail>(`/courses/${courseId}/content`);
  return res.data;
};

// 7. Create Career Path Payment Order
export const createCareerPaymentOrder = async (
  careerId: number,
  couponCode?: string
): Promise<PaymentOrderResponse> => {
  const res = await apiClient.post<PaymentOrderResponse>('/orders/career/create', {
    careerId,
    couponCode: couponCode ? couponCode.trim() : undefined,
  });
  return res.data;
};

// 8. Get Course Unified Access Status
export const getCourseAccessStatus = async (
  courseId: number | string
): Promise<CourseAccessDetail> => {
  const res = await apiClient.get<CourseAccessDetail>(`/courses/${courseId}/access`);
  return res.data;
};

// 9. Get Career Path Access Status & Completion
export const getCareerAccessStatus = async (
  slugOrId: number | string
): Promise<CareerAccessDetail> => {
  const res = await apiClient.get<CareerAccessDetail>(`/careers/${slugOrId}/access`);
  return res.data;
};

// 10. Claim Career Certificate
export const claimCareerCertificate = async (
  careerId: number | string
): Promise<{
  success: boolean;
  certificateNumber: string;
  verificationCode?: string;
  courseName?: string;
  issueDate?: string;
}> => {
  const res = await apiClient.post(`/careers/${careerId}/claim-certificate`);
  return res.data;
};

// 11. Get User's Career Path Enrollments
export const getMyCareerEnrollments = async (): Promise<CareerEnrollmentRecord[]> => {
  const res = await apiClient.get<CareerEnrollmentRecord[]>('/careers/my-enrollments');
  return res.data;
};
