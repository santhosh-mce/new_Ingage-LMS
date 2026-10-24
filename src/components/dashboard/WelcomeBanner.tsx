"use client";

import React from "react";
import { GraduationCap, Target, Star, Sparkles } from "lucide-react";

interface WelcomeBannerProps {
  userName?: string;
}

export function WelcomeBanner({ userName = "Santhosh Kumar" }: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EBFBF4] via-[#F2FCF7] to-[#E6F8EF] border border-emerald-100/80 p-6 sm:p-8 lg:p-10 shadow-sm">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Information */}
        <div className="max-w-xl space-y-4">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
              WELCOME BACK,
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {userName}!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
              Keep learning, keep growing. Your dedication today builds a better tomorrow.
            </p>
          </div>

          {/* 3 Pills */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-slate-800 text-xs font-medium shadow-2xs backdrop-blur-xs">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Learn New Skills</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-slate-800 text-xs font-medium shadow-2xs backdrop-blur-xs">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>Achieve Your Goals</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-emerald-200/60 text-slate-800 text-xs font-medium shadow-2xs backdrop-blur-xs">
              <Star className="w-3.5 h-3.5 text-emerald-600" />
              <span>Build Your Future</span>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="relative shrink-0 flex items-center justify-center self-center md:self-auto">
          {/* Badge: Better Learning Brighter Future */}
          <div className="absolute -top-3 right-2 sm:-top-2 sm:-left-6 bg-white/95 border border-emerald-200/80 rounded-2xl px-3 py-1.5 shadow-sm text-center z-20">
            <span className="text-[11px] font-bold text-emerald-700 block leading-tight">
              Better
            </span>
            <span className="text-[11px] font-bold text-emerald-600 block leading-tight">
              Learning
            </span>
            <span className="text-[10px] font-medium text-slate-500 block leading-tight">
              Brighter Future
            </span>
          </div>

          {/* Vector Student Illustration Graphic */}
          <div className="w-56 h-40 sm:w-64 sm:h-44 relative flex items-end justify-center">
            {/* Background Soft Glow Circle */}
            <div className="absolute w-44 h-44 rounded-full bg-emerald-200/40 -bottom-6 blur-lg" />

            {/* Desk Surface */}
            <div className="absolute bottom-0 w-full h-3 bg-emerald-800/10 rounded-full" />

            {/* SVG Character & Laptop */}
            <svg
              className="w-full h-full relative z-10"
              viewBox="0 0 240 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Plant in pot on right */}
              <circle cx="210" cy="115" r="16" fill="#10B981" fillOpacity="0.4" />
              <path d="M205 130 C205 110 215 110 215 130" stroke="#059669" strokeWidth="2.5" fill="none" />
              <path d="M210 130 C200 115 210 105 215 130" stroke="#059669" strokeWidth="2.5" fill="none" />
              <rect x="202" y="130" width="16" height="18" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* Books Stack */}
              <rect x="180" y="132" width="22" height="6" rx="1.5" fill="#3B82F6" />
              <rect x="182" y="126" width="20" height="6" rx="1.5" fill="#F59E0B" />
              <rect x="181" y="120" width="21" height="6" rx="1.5" fill="#10B981" />

              {/* Student Body (Green Hoodie) */}
              <ellipse cx="120" cy="148" rx="34" ry="24" fill="#059669" />
              <path
                d="M86 150 C86 115 154 115 154 150 Z"
                fill="#10B981"
              />
              <path
                d="M106 122 C115 132 125 132 134 122"
                stroke="#047857"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Student Neck & Face */}
              <rect x="114" y="98" width="12" height="12" rx="2" fill="#FBCFE8" />
              <ellipse cx="120" cy="85" rx="18" ry="20" fill="#FDE68A" />

              {/* Hair */}
              <path
                d="M101 80 C100 65 138 60 139 76 C139 80 137 84 135 84 C132 74 112 73 105 84 Z"
                fill="#1E293B"
              />

              {/* Eyes & Smile */}
              <circle cx="114" cy="84" r="2" fill="#0F172A" />
              <circle cx="126" cy="84" r="2" fill="#0F172A" />
              <path d="M117 92 Q120 95 123 92" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />

              {/* Laptop Screen & Base */}
              <rect x="90" y="112" width="56" height="34" rx="4" fill="#1E293B" />
              <rect x="94" y="115" width="48" height="26" rx="2" fill="#0F172A" />
              {/* Laptop Logo / Screen glow */}
              <circle cx="118" cy="128" r="4" fill="#10B981" />
              <path
                d="M82 146 L154 146 L150 152 L86 152 Z"
                fill="#94A3B8"
              />

              {/* Hands on Laptop */}
              <ellipse cx="100" cy="146" rx="6" ry="4" fill="#FDE68A" />
              <ellipse cx="138" cy="146" rx="6" ry="4" fill="#FDE68A" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
