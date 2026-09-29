"use client";
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { verifyLoginOtp, requestLoginOtp, getAuthErrorMessage } from '../api/authApi';

interface VerifyOtpPageProps {
  initialEmail?: string;
  onNavigate: (path: string) => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onShowToast?: (message: string) => void;
}

export function VerifyOtpPage({ initialEmail, onNavigate, onOpenAuth, onShowToast }: VerifyOtpPageProps) {
  const [email, setEmail] = useState<string>(() => {
    if (initialEmail) return initialEmail;
    try {
      const stored = sessionStorage.getItem('ingage_pending_otp_email');
      if (stored) return stored;
    } catch {}
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email') || '';
  });

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const storedExpiry = sessionStorage.getItem('ingage_otp_expires_at');
      if (storedExpiry) {
        const remaining = Math.floor((parseInt(storedExpiry, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    } catch {}
    return 300; // 5 minutes default
  });

  const [isExpired, setIsExpired] = useState<boolean>(timeLeft <= 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Sync email to sessionStorage
  useEffect(() => {
    if (email) {
      try {
        sessionStorage.setItem('ingage_pending_otp_email', email);
      } catch {}
    }
  }, [email]);

  // Countdown timer (05:00 down to 00:00)
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split('');
      pasted.forEach((char, idx) => {
        if (idx < 6) newDigits[idx] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      const nextInput = document.getElementById(`otp-input-${nextFocus}`);
      nextInput?.focus();
      return;
    }

    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const fullOtp = otpDigits.join('').trim();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyLoginOtp({ email: email.trim(), otp: fullOtp });
      setSuccess(response.message || 'Login successful!');
      
      if (response.token) {
        localStorage.setItem('ingage_token', response.token);
        if (response.userId) {
          localStorage.setItem('ingage_user', JSON.stringify({
            id: response.userId,
            name: response.name || '',
            email: response.email || '',
            role: response.role || 'STUDENT',
          }));
        }
      }

      // Clean up session storage
      try {
        sessionStorage.removeItem('ingage_pending_otp_email');
        sessionStorage.removeItem('ingage_otp_expires_at');
      } catch {}

      if (onShowToast) {
        onShowToast('Logged in successfully!');
      }

      setTimeout(() => {
        onNavigate('/');
      }, 1000);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Invalid or expired verification code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Email address is missing.');
      return;
    }
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await requestLoginOtp(email.trim());
      const newExpiryTime = Date.now() + 5 * 60 * 1000;
      setTimeLeft(300);
      setIsExpired(false);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);

      try {
        sessionStorage.setItem('ingage_otp_expires_at', newExpiryTime.toString());
      } catch {}

      if (onShowToast) {
        onShowToast(res.message || 'New 6-digit code generated.');
      }
      const firstInput = document.getElementById('otp-input-0');
      firstInput?.focus();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Failed to generate verification code. Please wait before trying again.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    if (onOpenAuth) {
      onOpenAuth('login');
    } else {
      onNavigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-lime-50 text-lime-700 flex items-center justify-center mb-4 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              We've generated a 6-digit verification code for
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-800">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              <span>{email || 'your email'}</span>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-lime-50 border border-lime-200 text-lime-800 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-lime-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Expiration Timer Banner */}
          <div className="flex items-center justify-center mb-6">
            {isExpired ? (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Code expired. Please request a new code.
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3.5 py-1.5 rounded-full">
                Code expires in: <strong className="font-mono text-gray-900 ml-1">{formatTime(timeLeft)}</strong>
              </span>
            )}
          </div>

          {/* 6-Digit OTP Form */}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 text-center">
                Enter 6-Digit Code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isLoading || isExpired}
                    className="w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-2 focus:ring-lime-100 text-gray-900 outline-none transition-all disabled:bg-gray-100 font-mono shadow-2xs"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Verify & Login Button */}
            <button
              id="verify-otp-submit-btn"
              type="submit"
              disabled={isLoading || isExpired || otpDigits.join('').length !== 6}
              className="w-full py-3.5 px-4 bg-lime-600 hover:bg-lime-700 active:bg-lime-800 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Verify &amp; Log In</span>
                </>
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <span>Didn't receive the code?</span>
              <button
                id="resend-otp-btn"
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || resendCooldown > 0}
                className="font-semibold text-lime-700 hover:text-lime-800 hover:underline disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending
                  ? 'Generating...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'}
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Log In</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtpPage;
