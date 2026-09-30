"use client";
import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Briefcase,
  Star,
  CheckCircle,
} from 'lucide-react';
import { AuthMode, UserProfile } from '../types';
import {
  getAuthErrorMessage,
  loginUser,
  signupUser,
  resetPassword,
} from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { SuccessModal } from './SuccessModal';

// ---------------------------------------------------------------------------
// Step Type Definitions
// ---------------------------------------------------------------------------
type SignupStep = 'SIGNUP_FORM' | 'SIGNUP_SUCCESS';
type LoginStep = 'LOGIN_FORM' | 'FORGOT_PASSWORD' | 'RESET_SUCCESS';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onNavigate?: (path: string) => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccess,
  onNavigate,
}: AuthModalProps) {
  // Mode & Step
  const [mode, setMode] = useState<'login' | 'signup'>(
    initialMode === 'login' ? 'login' : 'signup'
  );
  const [loginStep, setLoginStep] = useState<LoginStep>('LOGIN_FORM');
  const [signupStep, setSignupStep] = useState<SignupStep>('SIGNUP_FORM');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Forgot / Reset Password Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    successTitle: string;
    message: string;
    user: UserProfile;
  } | null>(null);
  const successTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      setSuccessInfo(null);
    }
  }, [isOpen]);

  const dispatch = useAppDispatch();

  // Reset or initialize state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'login') {
        setMode('login');
        setLoginStep('LOGIN_FORM');
      } else if (initialMode === 'forgot-password' || initialMode === 'reset-password') {
        setMode('login');
        setLoginStep('FORGOT_PASSWORD');
      } else {
        setMode('signup');
        setSignupStep('SIGNUP_FORM');
      }
      setError(null);
      setSuccessBanner(null);
    }
  }, [isOpen, initialMode]);

  // Lock body scroll while modal is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Password rules validation for Reset Password
  const pwdValidation = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };
  const isResetPasswordValid = Object.values(pwdValidation).every(Boolean);

  // ---------------------------------------------------------------------------
  // 1. SIGNUP: Immediate direct account creation (No OTP)
  // ---------------------------------------------------------------------------
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Creating your account...');

    try {
      const res: any = await signupUser({
        name: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (res.token) {
        const user: UserProfile = {
          id: res.userId || res.user?.id || '',
          name: res.name || res.user?.name || fullName.trim(),
          email: res.email || res.user?.email || email.trim(),
          role: res.role || res.user?.role || 'STUDENT',
          enrolledPaths: [],
        };

        localStorage.setItem('ingage_token', res.token);
        localStorage.setItem('ingage_user', JSON.stringify(user));
        dispatch(setCredentials({ token: res.token, user }));

        setSuccessInfo({
          isOpen: true,
          title: 'Create Account',
          subtitle: 'Account created successfully',
          successTitle: 'Account Created!',
          message: 'Welcome to Ingage LMS. Setting up your dashboard...',
          user,
        });

        successTimerRef.current = setTimeout(() => {
          setSuccessInfo(null);
          onSuccess(user);
          onClose();
        }, 1800);
      } else {
        setSignupStep('SIGNUP_SUCCESS');
      }
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'Unable to create account. Please try again.');
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('registered')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. LOGIN: Normal User Login
  // ---------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying credentials...');

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      if (response && response.token) {
        const user: UserProfile = {
          id: response.userId || '',
          name: response.name || email.split('@')[0],
          email: response.email || email.trim(),
          role: response.role || 'STUDENT',
          enrolledPaths: [],
        };

        localStorage.setItem('ingage_token', response.token);
        localStorage.setItem('ingage_user', JSON.stringify(user));
        dispatch(setCredentials({ token: response.token, user }));

        setSuccessInfo({
          isOpen: true,
          title: 'Welcome Back!',
          subtitle: 'Great to see you again',
          successTitle: 'Login Successful!',
          message: 'Welcome back to Ingage LMS. Setting up your dashboard...',
          user,
        });

        successTimerRef.current = setTimeout(() => {
          setSuccessInfo(null);
          onSuccess(user);
          onClose();
        }, 1800);
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. RESET PASSWORD
  // ---------------------------------------------------------------------------
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!isResetPasswordValid) {
      setError('New password must be at least 8 chars with an uppercase letter, lowercase letter, and a number.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Updating password...');

    try {
      await resetPassword({
        email: email.trim(),
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setSuccessBanner('Password updated successfully! You can now log in.');
      setLoginStep('RESET_SUCCESS');
      setPassword(newPassword);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Social Auth
  // ---------------------------------------------------------------------------
  const handleSocialAuth = (provider: 'Google' | 'LinkedIn') => {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    if (provider === 'Google') {
      window.location.href = `${backendBase}/oauth2/authorization/google`;
    } else {
      window.location.href = `${backendBase}/oauth2/authorization/linkedin`;
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Quick Demo Credentials Helper
  // ---------------------------------------------------------------------------
  const handleQuickDemo = (roleType: 'learner' | 'pro') => {
    setError(null);
    if (roleType === 'learner') {
      setFullName('Jordan Vance');
      setEmail('jordan.vance@example.com');
      setPassword('P@ssword2026!');
      setConfirmPassword('P@ssword2026!');
      setAgreeTerms(true);
    } else {
      setFullName('Elena Rostova');
      setEmail('elena.rostova@techcorp.io');
      setPassword('IngageElite2026!');
      setConfirmPassword('IngageElite2026!');
      setAgreeTerms(true);
    }
  };

  if (successInfo?.isOpen) {
    return (
      <SuccessModal
        isOpen={true}
        title={successInfo.title}
        subtitle={successInfo.subtitle}
        successTitle={successInfo.successTitle}
        message={successInfo.message}
        onClose={() => {
          if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
          }
          const u = successInfo.user;
          setSuccessInfo(null);
          onSuccess(u);
          onClose();
        }}
      />
    );
  }

  return (
    <>
      <div
        id="auth-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Split-Screen Modern Authentication Card */}
        <div
          id="auth-modal-card"
          className="relative w-full max-w-[960px] bg-white rounded-[20px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row my-auto transition-all transform scale-100"
        >
          {/* Universal Close Button */}
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 p-2 rounded-full text-gray-500 hover:text-gray-800 bg-gray-100/90 hover:bg-gray-200 md:text-white/80 md:hover:text-white md:bg-white/10 md:hover:bg-white/20 backdrop-blur-md transition-colors cursor-pointer shadow-xs"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* ================================================================= */}
          {/* LEFT SECTION: AUTHENTICATION FORM */}
          {/* ================================================================= */}
          <div className="w-full md:w-[54%] lg:w-[55%] flex flex-col bg-white p-6 sm:p-8 lg:p-10 overflow-y-auto max-h-[92vh] md:max-h-[88vh]">
            {/* Header */}
            <div className="mb-5 sm:mb-6">
              <h1 id="auth-modal-title" className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {mode === 'signup'
                  ? 'Sign Up'
                  : loginStep === 'FORGOT_PASSWORD'
                  ? 'Reset Password'
                  : loginStep === 'RESET_SUCCESS'
                  ? 'Password Updated'
                  : 'Sign In'}
              </h1>
              <p id="auth-modal-subtitle" className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                {mode === 'signup'
                  ? 'Start your learning journey with InGage LMS today.'
                  : loginStep === 'FORGOT_PASSWORD'
                  ? 'Enter your registered email and choose a new password.'
                  : loginStep === 'RESET_SUCCESS'
                  ? 'Your account credentials have been updated.'
                  : 'Please enter your account details to access your dashboard.'}
              </p>
            </div>

            {/* Inline Error Banner */}
            {error && (
              <div
                id="auth-error-banner"
                className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Inline Success Banner */}
            {successBanner && (
              <div
                id="auth-success-banner"
                className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-200"
              >
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* SIGNUP FORM */}
            {/* ============================================================= */}
            {mode === 'signup' && (
              <>
                {signupStep === 'SIGNUP_FORM' && (
                  <>
                    {/* Social Auth */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        id="social-google-btn"
                        type="button"
                        onClick={() => handleSocialAuth('Google')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          />
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        id="social-linkedin-btn"
                        type="button"
                        onClick={() => handleSocialAuth('LinkedIn')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#0A66C2"
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z"
                          />
                        </svg>
                        <span>LinkedIn</span>
                      </button>
                    </div>

                    <div className="relative my-4 flex items-center justify-center">
                      <div className="w-full border-t border-gray-200"></div>
                      <span className="absolute bg-white px-3 text-[11px] sm:text-xs text-gray-400 font-medium tracking-wide uppercase">
                        Or sign up with email
                      </span>
                    </div>

                    <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="signup-name">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            id="signup-name"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="e.g. Alex Morgan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="signup-email">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="signup-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="signup-password">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="At least 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="signup-confirm-password">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="Re-enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pt-1">
                        <input
                          id="agree-terms"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="agree-terms" className="text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            Privacy Policy
                          </button>
                          .
                        </label>
                      </div>

                      <button
                        id="signup-submit-btn"
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{loadingText}</span>
                          </>
                        ) : (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {signupStep === 'SIGNUP_SUCCESS' && (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Account Created Successfully!</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Your account is ready. You can now log in to access all courses and learning paths.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setMode('login');
                        setLoginStep('LOGIN_FORM');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Continue to Log In
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ============================================================= */}
            {/* LOGIN FLOW */}
            {/* ============================================================= */}
            {mode === 'login' && (
              <>
                {loginStep === 'LOGIN_FORM' && (
                  <>
                    {/* Social Auth */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        id="login-social-google-btn"
                        type="button"
                        onClick={() => handleSocialAuth('Google')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          />
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        id="login-social-linkedin-btn"
                        type="button"
                        onClick={() => handleSocialAuth('LinkedIn')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#0A66C2"
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z"
                          />
                        </svg>
                        <span>LinkedIn</span>
                      </button>
                    </div>

                    <div className="relative my-4 flex items-center justify-center">
                      <div className="w-full border-t border-gray-200"></div>
                      <span className="absolute bg-white px-3 text-[11px] sm:text-xs text-gray-400 font-medium tracking-wide uppercase">
                        Or log in with email
                      </span>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="login-email">
                          Username / Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="login-email"
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="Enter your username or email"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-gray-700" htmlFor="login-password">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setSuccessBanner(null);
                              setLoginStep('FORGOT_PASSWORD');
                            }}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                          >
                            Forgot your password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Remember this device</span>
                        </label>
                      </div>

                      <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{loadingText}</span>
                          </>
                        ) : (
                          <>
                            <span>Login</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {/* FORGOT PASSWORD FORM (Direct reset) */}
                {loginStep === 'FORGOT_PASSWORD' && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="forgot-email">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="forgot-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="new-password">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                          placeholder="Min 8 chars, 1 uppercase, 1 number"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="confirm-new-password">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="confirm-new-password"
                          type={showConfirmNewPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-sm text-gray-900 transition-all outline-none"
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      id="forgot-submit-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLoginStep('LOGIN_FORM')}
                      className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Log In</span>
                    </button>
                  </form>
                )}

                {/* RESET SUCCESS */}
                {loginStep === 'RESET_SUCCESS' && (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Password Updated Successfully!</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Your account password has been updated. You can now log in with your new credentials.
                      </p>
                    </div>
                    <button
                      onClick={() => setLoginStep('LOGIN_FORM')}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Log In Now
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Quick Demo Credentials */}
            <div className="pt-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Quick Demo Autofill:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('learner')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('pro')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Pro Student
                  </button>
                </div>
              </div>
            </div>

            {/* Switch between Login & Signup */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-600">
              {mode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessBanner(null);
                      setMode('login');
                      setLoginStep('LOGIN_FORM');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessBanner(null);
                      setMode('signup');
                      setSignupStep('SIGNUP_FORM');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT SECTION: MODERN WELCOME PANEL */}
          {/* ================================================================= */}
          <div className="w-full md:w-[46%] lg:w-[45%] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

            {/* Top Branding Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>InGage LMS • Career Platform</span>
              </div>
            </div>

            {/* Middle Welcome Content */}
            <div className="relative z-10 my-8 sm:my-10 space-y-6">
              {mode === 'login' ? (
                <>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Welcome Back!
                    </h2>
                    <p className="text-sm text-emerald-100/90 leading-relaxed mt-3">
                      Continue your learning journey with InGage. Build skills, explore career paths, and grow your professional future.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">100+ Hands-on Programs</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Industry-aligned curriculums mapped to modern tech roles.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Verified Certifications</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Showcase accredited proof of skill to recruiters and peers.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Direct Career Pathways</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Fast-track interview pipelines with hiring partners.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : loginStep === 'FORGOT_PASSWORD' ? (
                <>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Secure Your Account
                    </h2>
                    <p className="text-sm text-emerald-100/90 leading-relaxed mt-3">
                      Keep your learning progress and career profile safe. Set a new password to regain access.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">End-to-End Encryption</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Your credentials and account history remain completely secure.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Instant Recovery</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Seamlessly resume all active modules right after resetting.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Start Learning
                    </h2>
                    <p className="text-sm text-emerald-100/90 leading-relaxed mt-3">
                      Build your skills with InGage LMS. Gain industry-recognized credentials and accelerate your tech career.
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Learn In-Demand Roles</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Full Stack, Cloud Architect, AI & DevOps career roadmaps.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Portfolio Proof of Work</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Build production-grade projects evaluated by industry mentors.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">Recognized Credentials</h4>
                        <p className="text-[11px] sm:text-xs text-emerald-100/70">Earn shareable certificates to highlight on your resume and LinkedIn.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Trust Endorsement */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-300">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-emerald-200/80 font-medium">
                10,000+ Learners Enrolled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Policy Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Terms & Privacy Policy</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <p>
                Welcome to InGage LMS. By creating an account or logging in, you agree to comply with our Terms of Service, Honor Code, and Privacy Policy.
              </p>
              <h4 className="font-bold text-gray-800 text-sm">1. Account Responsibility</h4>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <h4 className="font-bold text-gray-800 text-sm">2. Learning & Certifications</h4>
              <p>
                Course certifications require completion of assigned modules and projects according to our academic integrity guidelines.
              </p>
              <h4 className="font-bold text-gray-800 text-sm">3. Privacy</h4>
              <p>
                We value your privacy. Your personal information is encrypted and never sold to third-party advertisers.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              I Understand & Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
