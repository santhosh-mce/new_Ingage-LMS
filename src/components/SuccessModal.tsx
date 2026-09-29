"use client";
import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

export interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  successTitle: string;
  message: string;
  onClose: () => void;
  redirectPath?: string;
  onNavigate?: (path: string) => void;
}

export function SuccessModal({
  isOpen,
  title,
  subtitle,
  successTitle,
  message,
  onClose,
}: SuccessModalProps) {
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

  // Lock body scroll when modal is open
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

  if (!isOpen) return null;

  return (
    <div
      id="success-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div
        id="success-modal-card"
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all transform scale-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header with Close Button */}
        <div className="pt-6 px-5 sm:px-8 pb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="success-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p id="success-modal-subtitle" className="text-xs sm:text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          </div>

          <button
            id="success-modal-close-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full-width Divider below Header */}
        <div className="w-full border-b border-gray-100" />

        {/* Centered Success Content */}
        <div className="py-12 sm:py-16 px-6 sm:px-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          {/* Circular Light Green Badge with Green Checkmark */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#E1F9EB] flex items-center justify-center mb-6 shadow-xs animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-11 h-11 sm:w-12 sm:h-12 text-[#10B981] stroke-[2.25] transition-transform duration-300 hover:scale-105" />
          </div>

          {/* Heading */}
          <h3 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
            {successTitle}
          </h3>

          {/* Subtitle / Message */}
          <p className="text-sm sm:text-base text-gray-500 max-w-xs sm:max-w-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
