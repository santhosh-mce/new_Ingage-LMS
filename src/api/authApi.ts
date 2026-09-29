import axios from 'axios';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RequestLoginOtpRequest {
  email: string;
}

export interface VerifyLoginOtpRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  message: string;
  token?: string | null;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  otp?: string;
}

export interface CurrentUserResponse {
  message: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  avatar?: string;
  avatarUrl?: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

const authClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ingage_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface VerifySignupOtpRequest {
  email: string;
  otp: string;
}

export interface ResendSignupOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export async function signupUser(payload: SignupRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export async function verifySignupOtp(payload: VerifySignupOtpRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/verify-signup-otp', payload);
  return response.data;
}

export async function resendSignupOtp(email: string): Promise<{ success: boolean; message: string; email: string }> {
  const response = await authClient.post<{ success: boolean; message: string; email: string }>('/auth/resend-signup-otp', { email });
  return response.data;
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string; email: string }> {
  const response = await authClient.post<{ success: boolean; message: string; email: string }>('/auth/forgot-password', { email });
  return response.data;
}

export async function verifyForgotPasswordOtp(payload: VerifyForgotPasswordOtpRequest): Promise<VerifyOtpResponse> {
  const response = await authClient.post<VerifyOtpResponse>('/auth/verify-forgot-password-otp', payload);
  return response.data;
}

export async function resetPassword(payload: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await authClient.post<{ success: boolean; message: string }>('/auth/reset-password', payload);
  return response.data;
}

export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function requestLoginOtp(email: string): Promise<{ message: string; email: string; otp?: string }> {
  const response = await authClient.post<{ message: string; email: string; otp?: string }>('/auth/login/request-otp', { email });
  return response.data;
}

export async function verifyLoginOtp(payload: VerifyLoginOtpRequest): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/auth/login/verify-otp', payload);
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await authClient.get<CurrentUserResponse>('/users/me');
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await authClient.post('/auth/logout');
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export async function updateUserProfileApi(payload: UpdateProfileRequest): Promise<CurrentUserResponse> {
  const response = await authClient.put<CurrentUserResponse>('/users/me', payload);
  return response.data;
}

export interface ProfileImageResponse {
  success: boolean;
  message: string;
  profileImage: string;
  avatarUrl?: string;
  user?: CurrentUserResponse;
}

export async function uploadProfileImageApi(file: File): Promise<ProfileImageResponse> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('file', file);
  const response = await authClient.post<ProfileImageResponse>('/users/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function removeProfileImageApi(): Promise<{ success: boolean; message: string }> {
  const response = await authClient.delete<{ success: boolean; message: string }>('/users/profile/image');
  return response.data;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback;
  }
  return fallback;
}

/**
 * Resolves any avatar / profile image path to a fully qualified, accessible URL.
 * Handles relative paths, /uploads/, /api/uploads/, and maps legacy localhost:8080 URLs to local app.
 */
export function getAccessibleImageUrl(path?: string | null): string {
  if (!path || typeof path !== 'string' || !path.trim()) return '';
  const clean = path.trim();

  // If already absolute with protocol
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
    try {
      const url = new URL(clean);
      // Fix cases where backend port 8080/8000 URL was created: map to local relative path
      if (url.port === '8080' || url.port === '8000' || url.hostname === 'localhost') {
        let p = url.pathname;
        if (!p.startsWith('/api/') && !p.startsWith('/uploads/')) {
          p = '/uploads/' + p.replace(/^\/+/, '');
        }
        return p;
      }
    } catch {
      // ignore
    }
    return clean;
  }

  // Base API configuration (e.g., http://localhost:8080/api)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');

  if (clean.startsWith('/api/uploads/')) {
    return clean;
  }
  if (clean.startsWith('/uploads/')) {
    return clean;
  }
  if (clean.startsWith('/api/')) {
    return clean;
  }
  if (clean.startsWith('/')) {
    return clean;
  }

  // Pure filename: e.g. user-07fc075e-8d46b1fe7eef443f8ea6a1ab1fc7ceaf.jpg
  return `/uploads/profile-images/${clean}`;
}
