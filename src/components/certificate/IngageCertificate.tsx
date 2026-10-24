"use client";
import React from "react";

export interface IngageCertificateProps {
  id?: string;
  studentName?: string;
  courseTitle?: string;
  projectName?: string;
  institutionName?: string;
  certificateNumber?: string;
  formattedDate?: string;
  instructorName?: string;
  className?: string;
}

export const IngageCertificate: React.FC<IngageCertificateProps> = ({
  id = "ingage-official-certificate",
  studentName = "ANDREA JOSEPH",
  courseTitle = "IoT and its Applications",
  projectName = "Smart Home IoT Monitoring System",
  institutionName = "Sathyabama Institute of Science and Technology",
  certificateNumber = "ING-2026-000123",
  formattedDate = "04 October 2026",
  instructorName = "Sri Harsha",
  className = "",
}) => {
  return (
    <div
      id={id}
      className={`relative w-full aspect-[1.414/1] max-w-[1000px] mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden select-none border border-slate-200 print:shadow-none print:border-none ${className}`}
      style={{
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. ELEGANT GOLD INNER BORDER */}
      <div className="absolute inset-3 sm:inset-4 border border-[#D4AF37]/70 rounded-xl pointer-events-none z-10" />

      {/* 2. TOP-LEFT CORNER LUXURY WAVE (Navy & Gold) */}
      <div className="absolute top-0 left-0 w-[42%] h-[42%] pointer-events-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 350 250"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goldGradTL" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8A6715" />
              <stop offset="50%" stopColor="#E5C06A" />
              <stop offset="100%" stopColor="#F9DF95" />
            </linearGradient>
            <linearGradient id="navyGradTL" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#041E42" />
              <stop offset="70%" stopColor="#0A2C59" />
              <stop offset="100%" stopColor="#0D3B73" />
            </linearGradient>
          </defs>

          {/* Gold Wave Layer */}
          <path
            d="M 0,0 L 220,0 C 170,90 90,170 0,230 Z"
            fill="url(#goldGradTL)"
          />
          {/* Deep Navy Blue Wave Layer */}
          <path
            d="M 0,0 L 160,0 C 130,75 65,145 0,195 Z"
            fill="url(#navyGradTL)"
          />
        </svg>
      </div>

      {/* 3. BOTTOM-RIGHT CORNER LUXURY WAVE (Navy & Gold) */}
      <div className="absolute bottom-0 right-0 w-[42%] h-[42%] pointer-events-none z-0 overflow-hidden rotate-180">
        <svg
          viewBox="0 0 350 250"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goldGradBR" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8A6715" />
              <stop offset="50%" stopColor="#E5C06A" />
              <stop offset="100%" stopColor="#F9DF95" />
            </linearGradient>
            <linearGradient id="navyGradBR" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#041E42" />
              <stop offset="70%" stopColor="#0A2C59" />
              <stop offset="100%" stopColor="#0D3B73" />
            </linearGradient>
          </defs>

          {/* Gold Wave Layer */}
          <path
            d="M 0,0 L 220,0 C 170,90 90,170 0,230 Z"
            fill="url(#goldGradBR)"
          />
          {/* Deep Navy Blue Wave Layer */}
          <path
            d="M 0,0 L 160,0 C 130,75 65,145 0,195 Z"
            fill="url(#navyGradBR)"
          />
        </svg>
      </div>

      {/* 4. MAIN CERTIFICATE CONTENT CONTAINER */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-8 sm:px-16 py-6 sm:py-9">
        
        {/* TOP SECTION: BRAND LOGO */}
        <div className="text-center pt-1 sm:pt-2">
          {/* Ingage Logo with Green Dot on the 'i' */}
          <div className="inline-flex items-center justify-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#222222] font-sans flex items-baseline">
              <span className="relative inline-block">
                {/* bright lime green dot */}
                <span className="absolute -top-1 left-[2px] w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#7CB342]" />
                i
              </span>
              ngage
            </span>
          </div>

          {/* Course Completion Certificate Gothic Title */}
          <h1
            className="text-2xl sm:text-3xl md:text-4xl text-slate-900 mt-2 sm:mt-3 font-serif tracking-tight"
            style={{
              fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
              fontWeight: 800,
            }}
          >
            Course Completion Certificate
          </h1>

          {/* Centered Three Dots + Certification Text */}
          <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3 text-slate-800 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">
            <span className="text-[#0B2545] tracking-widest text-sm">&bull;&bull;&bull;</span>
            <span>THIS IS TO CERTIFY THAT</span>
            <span className="text-[#0B2545] tracking-widest text-sm">&bull;&bull;&bull;</span>
          </div>
        </div>

        {/* MIDDLE SECTION: STUDENT NAME & COURSE/PROJECT DETAILS */}
        <div className="text-center space-y-1 sm:space-y-2 py-1">
          {/* Student Full Name in Large Bold Lime/Olive Green */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#749E10] tracking-wide uppercase font-sans">
            {studentName}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Student of
          </p>

          <p className="text-xs sm:text-sm md:text-base font-bold text-slate-900">
            {institutionName}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 font-medium pt-0.5">
            has successfully completed the
          </p>

          {/* Course Name in Deep Navy Quotes */}
          <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-[#002B49] px-4 max-w-3xl mx-auto leading-snug">
            &ldquo;{courseTitle.toUpperCase()}&rdquo;
          </h3>

          {/* Project & Practical Details */}
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed px-4">
            under the <strong className="text-slate-900 font-semibold">{projectName}</strong> Hands-on learning, virtual internship and project-based experience
          </p>

          <p className="text-[10px] sm:text-xs text-slate-500 max-w-xl mx-auto pt-0.5">
            conducted by InGage Technologies Pvt. Ltd. in association with {institutionName}
          </p>
        </div>

        {/* BOTTOM SECTION: SIGNATURES & VERIFICATION METADATA */}
        <div className="pt-2 sm:pt-4 border-t border-slate-200/80">
          <div className="flex items-end justify-between px-2 sm:px-6">
            
            {/* Left Signature: Sri Harsha */}
            <div className="text-center w-36 sm:w-48">
              {/* Handwritten Signature SVG */}
              <div className="flex justify-center mb-1">
                <svg viewBox="0 0 160 45" className="w-28 sm:w-36 h-7 sm:h-9">
                  <path
                    d="M 12 30 C 22 14, 28 10, 36 28 C 42 36, 48 30, 56 16 C 62 7, 68 28, 76 24 C 84 19, 90 32, 102 22 C 112 14, 122 30, 142 16"
                    fill="none"
                    stroke="#041E42"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="w-full h-[1.5px] bg-slate-800 mb-1" />
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider">
                SRI HARSHA
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
                VP Solutions
              </div>
            </div>

            {/* Center: Certificate ID & Date Stamp */}
            <div className="text-center pb-1 space-y-0.5">
              <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-700">
                Certificate ID: <span className="text-[#0B2545]">{certificateNumber}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                Issued Date: {formattedDate}
              </div>
              <div className="text-[8px] sm:text-[9px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Verified InGage Credential</span>
              </div>
            </div>

            {/* Right Signature: Vijay Karunakaran */}
            <div className="text-center w-36 sm:w-48">
              {/* Handwritten Signature SVG */}
              <div className="flex justify-center mb-1">
                <svg viewBox="0 0 160 45" className="w-28 sm:w-36 h-7 sm:h-9">
                  <path
                    d="M 10 24 C 20 8, 30 12, 38 28 C 48 34, 52 14, 64 26 C 72 32, 85 10, 96 28 C 108 36, 120 18, 145 22"
                    fill="none"
                    stroke="#041E42"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="w-full h-[1.5px] bg-slate-800 mb-1" />
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider">
                VIJAY KARUNAKARAN
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600 font-medium">
                Chief Executive Officer
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default IngageCertificate;
