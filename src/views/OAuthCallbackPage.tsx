"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, getAccessibleImageUrl } from '../api/authApi';
import { UserProfile } from '../types';
import { SuccessModal } from '../components/SuccessModal';
import { LandingPage } from './LandingPage';
import { AlertCircle } from 'lucide-react';

interface OAuthCallbackPageProps {
  onNavigate: (path: string) => void;
  onShowToast: (msg: string) => void;
}

export const OAuthCallbackPage: React.FC<OAuthCallbackPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetPath, setTargetPath] = useState<string>('/');
  const processedRef = useRef<boolean>(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      const decodedError = decodeURIComponent(error);
      setStatus('error');
      setErrorMessage(decodedError);
      onShowToast(`Social sign-in error: ${decodedError}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received from Google.');
      onShowToast('Social sign-in failed: missing authentication token.');
      return;
    }

    // Persist token in local storage immediately
    localStorage.setItem('ingage_token', token);

    // Fetch user profile
    getCurrentUser()
      .then((user) => {
        const rawAvatar = user.avatarUrl || user.profileImage || user.avatar;
        const resolvedAvatar = rawAvatar ? getAccessibleImageUrl(rawAvatar) : undefined;
        const profile: UserProfile = {
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: resolvedAvatar,
          enrolledPaths: [],
        };

        // Persist session & update Redux context
        localStorage.setItem('ingage_user', JSON.stringify(profile));
        login(token, profile);
        setStatus('success');

        // Check for saved post-auth redirect
        const savedRedirect = sessionStorage.getItem('ingage_redirect_after_auth');
        const resolvedTarget =
          savedRedirect &&
          savedRedirect !== '/login' &&
          savedRedirect !== '/signup' &&
          savedRedirect !== '/forgot-password' &&
          savedRedirect !== '/'
            ? savedRedirect
            : user.role === 'ADMIN'
            ? '/admin'
            : '/';

        setTargetPath(resolvedTarget);

        if (savedRedirect) {
          try {
            sessionStorage.removeItem('ingage_redirect_after_auth');
          } catch {
            // ignore
          }
        }

        onShowToast(`Welcome back, ${user.name}!`);

        // Display the setup success modal for ~2200ms before navigating, matching the manual signup flow
        redirectTimerRef.current = setTimeout(() => {
          onNavigate(resolvedTarget);
        }, 2200);
      })
      .catch((err) => {
        localStorage.removeItem('ingage_token');
        localStorage.removeItem('ingage_user');
        setStatus('error');
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to verify your identity. Please try signing in again.';
        setErrorMessage(msg);
        onShowToast('Social sign-in could not be completed.');
      });

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [login, onNavigate, onShowToast]);

  const handleCloseModal = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    onNavigate(targetPath);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Landing Page matching the modal overlay backdrop */}
      <LandingPage onNavigate={onNavigate} />

      {/* Account Created Setup Modal (Active during OAuth processing and success) */}
      {(status === 'loading' || status === 'success') && (
        <SuccessModal
          isOpen={true}
          title="Create Your Account"
          subtitle="Start your learning journey today"
          successTitle="Account Created!"
          message="Welcome to Ingage LMS. Setting up your profile..."
          onClose={handleCloseModal}
        />
      )}

      {/* Error state modal if OAuth verification fails */}
      {status === 'error' && (
        <div
          id="oauth-error-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="oauth-error-card"
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Sign-in Unsuccessful
            </h3>

            <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">
              {errorMessage || 'Unable to authenticate with Google. Please try signing in again.'}
            </p>

            <button
              onClick={() => onNavigate('/login')}
              className="w-full py-3 px-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-lime-500/20 cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthCallbackPage;
