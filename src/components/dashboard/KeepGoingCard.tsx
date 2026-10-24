"use client";

import React from "react";
import { Star } from "lucide-react";

export function KeepGoingCard() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#F0FDF4] via-[#F4FDF8] to-[#E6F9F0] border border-emerald-100/90 rounded-2xl p-5 shadow-2xs">
      <div className="relative z-10 flex flex-col justify-between max-w-[65%] space-y-1.5">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900">Keep Going!</h3>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Small steps every day lead to big achievements.
        </p>

        {/* Small horizontal progress line */}
        <div className="w-16 h-1 bg-[#00C975] rounded-full mt-2" />
      </div>

      {/* Mountain Illustration on right */}
      <div className="absolute right-0 bottom-0 w-36 h-24 pointer-events-none">
        <svg
          viewBox="0 0 160 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Back Mountain */}
          <path
            d="M50 100 L110 30 L160 100 Z"
            fill="#A7F3D0"
            fillOpacity="0.6"
          />
          {/* Main Mountain */}
          <path
            d="M80 100 L135 15 L180 100 Z"
            fill="#34D399"
            fillOpacity="0.7"
          />
          {/* Front Small Hill */}
          <path
            d="M30 100 L75 60 L120 100 Z"
            fill="#6EE7B7"
            fillOpacity="0.8"
          />
          {/* Flag on Peak */}
          <path d="M135 15 L135 6" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M135 6 L144 9 L135 12 Z" fill="#059669" />
        </svg>
      </div>
    </div>
  );
}
