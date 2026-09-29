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
  RefreshCw,
  Clock,
} from 'lucide-react';
import { AuthMode, UserProfile } from '../types';
import {
  getAuthErrorMessage,
  loginUser,
  signupUser,
  verifySignupOtp,
  resendSignupOtp,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
} from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

// ---------------------------------------------------------------------------
// Step Type Definitions
// ---------------------------------------------------------------------------
type SignupStep = 'SIGNUP_FORM' | 'VERIFY_SIGNUP_OTP' | 'SIGNUP_SUCCESS';
type LoginStep = 'LOGIN_FORM' | 'FORGOT_PASSWORD' | 'VERIFY_RESET_OTP' | 'NEW_PASSWORD' | 'RESET_SUCCESS';

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
  // Top-level mode: 'signup' stays at /signup, 'login' stays at /login
  const [mode, setMode] = useState<'signup' | 'login'>(() => {
    return initialMode === 'login' || initialMode === 'forgot-password' ? 'login' : 'signup';
  });

  // State Machines
  const [signupStep, setSignupStep] = useState<SignupStep>('SIGNUP_FORM');
  const [loginStep, setLoginStep] = useState<LoginStep>('LOGIN_FORM');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Reset Password State
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // OTP State
  const [signupOtpDigits, setSignupOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); // 5 minutes
  const [otpResendCooldown, setOtpResendCooldown] = useState(60); // 60 seconds
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

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

  const dispatch = useAppDispatch();

  // Reset or initialize state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'forgot-password') {
        setMode('login');
        setLoginStep('FORGOT_PASSWORD');
      } else if (initialMode === 'login') {
        setMode('login');
        setLoginStep('LOGIN_FORM');
      } else {
        setMode('signup');
        setSignupStep('SIGNUP_FORM');
      }
      setError(null);
      setSuccessBanner(null);
      setSignupOtpDigits(['', '', '', '', '', '']);
      setResetOtpDigits(['', '', '', '', '', '']);
      setResetToken('');
      setOtpTimeLeft(300);
      setOtpResendCooldown(0);
      setIsOtpExpired(false);
    }
  }, [isOpen, initialMode]);

  // 5-minute OTP countdown timer
  useEffect(() => {
    if (signupStep !== 'VERIFY_SIGNUP_OTP' && loginStep !== 'VERIFY_RESET_OTP') return;

    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          setIsOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [signupStep, loginStep]);

  // Resend cooldown timer
  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

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

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // OTP input handlers
  const handleDigitChange = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    prefix: string,
    index: number,
    value: string
  ) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }
    // If user pasted a 6-digit code
    if (cleanValue.length === 6) {
      setDigits(cleanValue.split(''));
      const lastInput = document.getElementById(`${prefix}-input-5`);
      lastInput?.focus();
      return;
    }
    const singleChar = cleanValue.slice(-1);
    const updated = [...digits];
    updated[index] = singleChar;
    setDigits(updated);

    if (index < 5 && singleChar) {
      const nextInput = document.getElementById(`${prefix}-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    digits: string[],
    prefix: string,
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`${prefix}-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Password rules validation for Reset Password
  const pwdValidation = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };
  const isResetPasswordValid = Object.values(pwdValidation).every(Boolean);

  // ---------------------------------------------------------------------------
  // 1. SIGNUP STEP 1: Validate info and send OTP via SMTP
  // ---------------------------------------------------------------------------
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
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
    setLoadingText('Sending verification code...');

    try {
      const res = await signupUser({
        name: fullName.trim(),
        email: email.trim(),
        password,
      });

      setSignupStep('VERIFY_SIGNUP_OTP');
      setSignupOtpDigits(['', '', '', '', '', '']);
      setOtpTimeLeft(300);
      setOtpResendCooldown(60);
      setIsOtpExpired(false);
      setSuccessBanner(res.message || 'Verification code sent to your email.');
      setTimeout(() => {
        document.getElementById('signup-otp-input-0')?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'Unable to start signup. Please try again.');
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
  // 1. SIGNUP STEP 2: Verify 6-digit OTP and complete account creation
  // ---------------------------------------------------------------------------
  const handleVerifySignupOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    const otpCode = signupOtpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying code & activating account...');

    try {
      const res = await verifySignupOtp({
        email: email.trim(),
        otp: otpCode,
      });

      if (res.token) {
        const user: UserProfile = {
          id: res.userId || '',
          name: res.name || fullName.trim(),
          email: res.email || email.trim(),
          role: res.role || 'STUDENT',
          enrolledPaths: [],
        };

        localStorage.setItem('ingage_token', res.token);
        localStorage.setItem('ingage_user', JSON.stringify(user));
        dispatch(setCredentials({ token: res.token, user }));

        onSuccess(user);
        onClose();
      } else {
        setSignupStep('SIGNUP_SUCCESS');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Invalid or expired verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. SIGNUP RESEND OTP
  // ---------------------------------------------------------------------------
  const handleResendSignupOtp = async () => {
    if (otpResendCooldown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    setError(null);
    setSuccessBanner(null);

    try {
      const res = await resendSignupOtp(email.trim());
      setOtpTimeLeft(300);
      setIsOtpExpired(false);
      setSignupOtpDigits(['', '', '', '', '', '']);
      setOtpResendCooldown(60);
      setSuccessBanner(res.message || 'A new verification code has been sent to your email.');
      document.getElementById('signup-otp-input-0')?.focus();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Failed to resend code. Please wait before trying again.'));
    } finally {
      setIsResendingOtp(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. LOGIN: Normal User Login
  // ---------------------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Logging in...');

    try {
      const response = await loginUser({ email: email.trim(), password });

      if (response.token) {
        const user: UserProfile = {
          id: response.userId || '',
          name: response.name || '',
          email: response.email || email.trim(),
          role: response.role || 'STUDENT',
          enrolledPaths: [],
        };

        localStorage.setItem('ingage_token', response.token);
        localStorage.setItem('ingage_user', JSON.stringify(user));
        dispatch(setCredentials({ token: response.token, user }));

        onSuccess(user);
        onClose();
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 1: Send OTP to registered email
  // ---------------------------------------------------------------------------
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Sending verification code...');

    try {
      const res = await forgotPassword(email.trim());
      setLoginStep('VERIFY_RESET_OTP');
      setResetOtpDigits(['', '', '', '', '', '']);
      setOtpTimeLeft(300);
      setOtpResendCooldown(60);
      setIsOtpExpired(false);
      setSuccessBanner(res.message || 'If an account exists with this email, a verification code has been sent.');
      setTimeout(() => {
        document.getElementById('reset-otp-input-0')?.focus();
      }, 100);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Unable to send verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 2: Verify OTP and get single-use reset token
  // ---------------------------------------------------------------------------
  const handleVerifyResetOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    const otpCode = resetOtpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying code...');

    try {
      const res = await verifyForgotPasswordOtp({
        email: email.trim(),
        otp: otpCode,
      });

      if (res.resetToken) {
        setResetToken(res.resetToken);
        setLoginStep('NEW_PASSWORD');
        setSuccessBanner('Code verified. Please set your new password.');
      } else {
        setError('Verification succeeded, but no reset token was returned.');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Invalid or expired verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 3: Set new password using reset token
  // ---------------------------------------------------------------------------
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isResetPasswordValid) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and numbers.');
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
        resetToken: resetToken || 'direct_reset',
        newPassword,
        confirmPassword: confirmNewPassword,
      });

      setLoginStep('RESET_SUCCESS');
      setPassword('');
      setConfirmPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetToken('');
      setError(null);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Unable to reset password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Social Auth Handlers
  const handleSocialAuth = (provider: 'Google' | 'LinkedIn') => {
    setIsLoading(true);
    setLoadingText(`Connecting to ${provider}...`);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api' || 'http://localhost:8080/api';
    window.location.assign(`${apiBaseUrl}/oauth2/authorization/${provider.toLowerCase()}`);
  };

  // Quick Demo Autofill
  const handleQuickDemo = (roleType: 'learner' | 'pro') => {
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

  // Dynamic Header based on active state
  const getHeaderInfo = () => {
    if (mode === 'signup') {
      if (signupStep === 'VERIFY_SIGNUP_OTP') {
        return {
          title: 'Verify Your Email',
          subtitle: 'Enter the 6-digit verification code sent to your email',
        };
      }
      if (signupStep === 'SIGNUP_SUCCESS') {
        return {
          title: 'Welcome to InGage LMS',
          subtitle: 'Your learning journey starts now',
        };
      }
      return {
        title: 'Create Account',
        subtitle: 'Start your learning journey today',
      };
    } else {
      switch (loginStep) {
        case 'FORGOT_PASSWORD':
          return {
            title: 'Forgot Password',
            subtitle: 'Enter your email to receive a verification code',
          };
        case 'VERIFY_RESET_OTP':
          return {
            title: 'Verify Reset Code',
            subtitle: 'Enter the 6-digit code sent to your email',
          };
        case 'NEW_PASSWORD':
          return {
            title: 'Set New Password',
            subtitle: 'Create a new secure password for your account',
          };
        case 'RESET_SUCCESS':
          return {
            title: 'Password Updated',
            subtitle: 'Account secured successfully',
          };
        case 'LOGIN_FORM':
        default:
          return {
            title: 'Welcome Back',
            subtitle: 'Log in to continue your learning journey',
          };
      }
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Container */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row z-10 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Brand & Visual Context */}
        <div className="hidden md:flex md:w-5/12 bg-linear-to-br from-lime-900 via-lime-950 to-black p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          {/* Top: Logo & Platform Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-lime-500 to-lime-400 flex items-center justify-center text-gray-950 font-black text-xl shadow-lg shadow-lime-500/30">
                iG
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-xl text-white">InGage</span>
                <span className="text-lime-400 font-semibold text-xs ml-1.5 px-2 py-0.5 rounded-full bg-lime-950/80 border border-lime-800">
                  LMS
                </span>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-lime-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <span>Enterprise Learning Ecosystem</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Master in-demand skills with interactive courses &amp; real-world projects.
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Join thousands of engineers, designers, and business leaders advancing their careers.
              </p>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="relative z-10 space-y-3.5 py-6">
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <div className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Accredited certificate pathways</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <div className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Hands-on sandbox coding labs</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <div className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Secure email OTP verification</span>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full md:w-7/12 flex flex-col justify-between bg-white overflow-y-auto max-h-[92vh]">
          {/* Top Modal Controls */}
          <div className="p-6 pb-0 flex items-center justify-between">
            {/* Top Switcher Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignupStep('SIGNUP_FORM');
                  setError(null);
                  setSuccessBanner(null);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginStep('LOGIN_FORM');
                  setError(null);
                  setSuccessBanner(null);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-4 md:px-8 space-y-4">
            {/* Header Content */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                {header.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {header.subtitle}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successBanner && (
              <div className="p-3 rounded-xl bg-lime-50 border border-lime-200 text-lime-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-lime-600" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* SIGNUP FLOW */}
            {/* ============================================================= */}
            {mode === 'signup' && (
              <>
                {signupStep === 'SIGNUP_FORM' && (
                  <>
                    {/* Social Auth */}
                    <div className="space-y-3 pt-1">
                      <button
                        id="signup-social-google-btn"
                        type="button"
                        onClick={() => handleSocialAuth('Google')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                        <span>Continue with Google</span>
                      </button>

                      <button
                        id="signup-social-linkedin-btn"
                        type="button"
                        onClick={() => handleSocialAuth('LinkedIn')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#0A66C2"
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z"
                          />
                        </svg>
                        <span>Continue with LinkedIn</span>
                      </button>

                      <div className="relative my-3 flex items-center justify-center">
                        <div className="w-full border-t border-gray-200"></div>
                        <span className="absolute bg-white px-3 text-xs text-gray-500 font-medium tracking-wide">
                          Or sign up with email
                        </span>
                      </div>
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="Alex Morgan"
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="alex.morgan@company.com"
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
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
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
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
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
                          id="signup-agree-terms"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 text-lime-600 rounded-md border-gray-300 focus:ring-lime-500 cursor-pointer"
                        />
                        <label htmlFor="signup-agree-terms" className="text-xs text-gray-600 select-none">
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-lime-700 font-semibold hover:underline"
                          >
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-lime-700 font-semibold hover:underline"
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
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 active:bg-lime-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{loadingText}</span>
                          </>
                        ) : (
                          <>
                            <span>Continue to Verification</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {/* SIGNUP STEP 2: VERIFY OTP */}
                {signupStep === 'VERIFY_SIGNUP_OTP' && (
                  <form onSubmit={handleVerifySignupOtpSubmit} className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-gray-500">
                        We sent a 6-digit verification code to
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-800">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        <span>{email}</span>
                      </div>
                    </div>

                    {/* Expiration countdown badge */}
                    <div className="flex items-center justify-center my-2">
                      {isOtpExpired ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Code expired. Please request a new code.
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Code expires in: <strong className="font-mono text-gray-900 ml-1">{formatTime(otpTimeLeft)}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5 text-center">
                        Enter 6-Digit Code
                      </label>
                      <div className="flex justify-center gap-2">
                        {signupOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`signup-otp-input-${idx}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleDigitChange(signupOtpDigits, setSignupOtpDigits, 'signup-otp', idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(signupOtpDigits, 'signup-otp', idx, e)}
                            disabled={isLoading || isOtpExpired}
                            className="w-10 sm:w-11 h-12 text-center text-xl font-bold rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-100 text-gray-900 outline-none transition-all disabled:bg-gray-100 font-mono shadow-2xs"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      id="verify-signup-otp-btn"
                      type="submit"
                      disabled={isLoading || isOtpExpired || signupOtpDigits.join('').length !== 6}
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 active:bg-lime-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify &amp; Activate Account</span>
                        </>
                      )}
                    </button>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('SIGNUP_FORM');
                          setError(null);
                        }}
                        className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Email</span>
                      </button>

                      <button
                        id="resend-signup-otp-btn"
                        type="button"
                        onClick={handleResendSignupOtp}
                        disabled={isResendingOtp || otpResendCooldown > 0}
                        className="font-semibold text-lime-700 hover:text-lime-800 hover:underline disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? 'animate-spin' : ''}`} />
                        {isResendingOtp
                          ? 'Sending...'
                          : otpResendCooldown > 0
                          ? `Resend in ${otpResendCooldown}s`
                          : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}

                {signupStep === 'SIGNUP_SUCCESS' && (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Account Activated Successfully!</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Your email has been verified and your account is ready. You can now log in to start learning.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setMode('login');
                        setLoginStep('LOGIN_FORM');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
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
                    <div className="space-y-3 pt-1">
                      <button
                        id="login-social-google-btn"
                        type="button"
                        onClick={() => handleSocialAuth('Google')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                        <span>Continue with Google</span>
                      </button>

                      <button
                        id="login-social-linkedin-btn"
                        type="button"
                        onClick={() => handleSocialAuth('LinkedIn')}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/90 active:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 shadow-2xs group cursor-pointer"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#0A66C2"
                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z"
                          />
                        </svg>
                        <span>Continue with LinkedIn</span>
                      </button>

                      <div className="relative my-3 flex items-center justify-center">
                        <div className="w-full border-t border-gray-200"></div>
                        <span className="absolute bg-white px-3 text-xs text-gray-500 font-medium tracking-wide">
                          Or log in with email
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="login-email">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            id="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
                            placeholder="alex.morgan@company.com"
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
                            className="text-xs text-lime-700 font-semibold hover:underline cursor-pointer"
                          >
                            Forgot Password?
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
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
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

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-lime-600 rounded-md border-gray-300 focus:ring-lime-500"
                          />
                          <span className="text-xs text-gray-600">Remember me for 30 days</span>
                        </label>
                      </div>

                      <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 active:bg-lime-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{loadingText}</span>
                          </>
                        ) : (
                          <>
                            <span>Log In to Account</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {/* FORGOT PASSWORD STEP 1: Enter Email & Send OTP */}
                {loginStep === 'FORGOT_PASSWORD' && (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-1 animate-in fade-in duration-200">
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
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        We'll send a 6-digit verification code to reset your password.
                      </p>
                    </div>

                    <button
                      id="forgot-send-otp-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('LOGIN_FORM');
                        setError(null);
                        setSuccessBanner(null);
                      }}
                      className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Log In</span>
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD STEP 2: Verify OTP */}
                {loginStep === 'VERIFY_RESET_OTP' && (
                  <form onSubmit={handleVerifyResetOtpSubmit} className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="text-center space-y-1">
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit reset code sent to
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-800">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        <span>{email}</span>
                      </div>
                    </div>

                    {/* Expiration countdown badge */}
                    <div className="flex items-center justify-center my-2">
                      {isOtpExpired ? (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Code expired. Please request a new code.
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Code expires in: <strong className="font-mono text-gray-900 ml-1">{formatTime(otpTimeLeft)}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2.5 text-center">
                        Enter 6-Digit Code
                      </label>
                      <div className="flex justify-center gap-2">
                        {resetOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`reset-otp-input-${idx}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleDigitChange(resetOtpDigits, setResetOtpDigits, 'reset-otp', idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(resetOtpDigits, 'reset-otp', idx, e)}
                            disabled={isLoading || isOtpExpired}
                            className="w-10 sm:w-11 h-12 text-center text-xl font-bold rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-100 text-gray-900 outline-none transition-all disabled:bg-gray-100 font-mono shadow-2xs"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      id="verify-reset-otp-btn"
                      type="submit"
                      disabled={isLoading || isOtpExpired || resetOtpDigits.join('').length !== 6}
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify Code</span>
                        </>
                      )}
                    </button>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('FORGOT_PASSWORD');
                          setError(null);
                        }}
                        className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Email</span>
                      </button>

                      <button
                        id="resend-reset-otp-btn"
                        type="button"
                        onClick={handleForgotPasswordSubmit}
                        disabled={isLoading || otpResendCooldown > 0}
                        className="font-semibold text-lime-700 hover:text-lime-800 hover:underline disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading
                          ? 'Sending...'
                          : otpResendCooldown > 0
                          ? `Resend in ${otpResendCooldown}s`
                          : 'Resend Code'}
                      </button>
                    </div>
                  </form>
                )}

                {/* FORGOT PASSWORD STEP 3: Set New Password */}
                {loginStep === 'NEW_PASSWORD' && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1 animate-in fade-in duration-200">
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
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
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
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-lime-600 focus:ring-4 focus:ring-lime-100 text-sm text-gray-900 transition-all outline-none"
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

                    {/* Password criteria checklist */}
                    <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${pwdValidation.length ? 'bg-lime-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${pwdValidation.hasUpper ? 'bg-lime-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>At least 1 uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${pwdValidation.hasNumber ? 'bg-lime-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>At least 1 number</span>
                      </div>
                    </div>

                    <button
                      id="reset-submit-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{loadingText}</span>
                        </>
                      ) : (
                        <>
                          <span>Update Password</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* RESET SUCCESS */}
                {loginStep === 'RESET_SUCCESS' && (
                  <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-lime-100 text-lime-700 rounded-full flex items-center justify-center mx-auto">
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
                      className="w-full py-3 px-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Log In Now
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Quick Demo Credentials */}
            <div className="pt-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Quick Demo Autofill:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('learner')}
                    className="px-2.5 py-1 bg-white hover:bg-lime-50 text-gray-700 hover:text-lime-700 border border-gray-200 hover:border-lime-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('pro')}
                    className="px-2.5 py-1 bg-white hover:bg-lime-50 text-gray-700 hover:text-lime-700 border border-gray-200 hover:border-lime-200 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Pro Student
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="p-6 pt-3 border-t border-gray-100 bg-gray-50/60 rounded-b-3xl">
            <p className="text-xs text-center text-gray-500">
              Need assistance?{' '}
              <a
                href="mailto:support@ingagelms.com"
                className="text-lime-700 font-semibold hover:underline"
              >
                Contact Academic Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Privacy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-gray-900">InGage LMS Terms &amp; Privacy</h4>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
              <p>
                Welcome to InGage LMS. By creating an account or using our platform, you agree to
                comply with all learning integrity standards and platform acceptable use guidelines.
              </p>
              <p>
                <strong>Account Security:</strong> You are responsible for safeguarding your login
                credentials. InGage LMS employs 6-digit OTP verification and industry-standard encryption.
              </p>
              <p>
                <strong>Academic Integrity:</strong> Course completion certificates are awarded based
                on authentic assessment results. Sharing solutions or plagiarizing project work may
                result in credential revocation.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-xl text-xs font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthModal;
