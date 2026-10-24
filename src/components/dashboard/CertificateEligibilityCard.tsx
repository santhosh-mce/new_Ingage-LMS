"use client";

import React from "react";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

export interface CertificateEligibilityData {
  percentage: number;
  message: string;
  isEligible: boolean;
}

interface CertificateEligibilityCardProps {
  data: CertificateEligibilityData;
}

export function CertificateEligibilityCard({ data }: CertificateEligibilityCardProps) {
  const percentage = Math.min(100, Math.max(0, data.percentage || 25));

  // Circular progress calculations for SVG ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
          <Award className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Certificate Eligibility
        </h2>
      </div>

      {/* Progress & Message Row */}
      <div className="flex items-center gap-4">
        {/* Circular Progress Ring */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 70 70">
            {/* Background ring */}
            <circle
              cx="35"
              cy="35"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="35"
              cy="35"
              r={radius}
              stroke="#00C975"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute text-xs font-bold text-slate-800">
            {percentage}%
          </span>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {data.message}
        </p>
      </div>

      {/* View Requirements CTA */}
      <Link
        href="/certificates"
        className="w-full py-2 px-3 rounded-xl border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>View Requirements</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
