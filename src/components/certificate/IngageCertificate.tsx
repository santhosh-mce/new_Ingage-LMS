"use client";
import React from 'react';

export interface SkillBadgeItem {
  name: string;
  category: string;
  type: 'react' | 'node' | 'postgres' | 'typescript' | 'code' | 'database';
}

export interface IngageCertificateProps {
  id?: string;
  studentName?: string;
  courseTitle?: string;
  certificateNumber?: string;
  formattedDate?: string;
  instructorName?: string;
  skills?: SkillBadgeItem[];
  className?: string;
}

const defaultSkills: SkillBadgeItem[] = [
  { name: 'React', category: 'Frontend', type: 'react' },
  { name: 'Node.js', category: 'Backend', type: 'node' },
  { name: 'PostgreSQL', category: 'Database', type: 'postgres' },
  { name: 'TypeScript', category: 'Language', type: 'typescript' },
];

export const IngageCertificate: React.FC<IngageCertificateProps> = ({
  id = 'certificate-canvas',
  studentName = 'Santhosh Kumar D',
  courseTitle = 'Full Stack Development',
  certificateNumber = 'ING-2026-7842',
  formattedDate = 'Sep 18, 2026',
  instructorName = 'Alex Rivera',
  skills = defaultSkills,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`relative bg-white text-slate-900 w-full aspect-[1.414/1] max-w-[1000px] mx-auto rounded-xl p-8 sm:p-12 md:p-14 shadow-2xl overflow-hidden border border-slate-200 select-none flex flex-col justify-between ${className}`}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. TOP RIGHT GEOMETRIC ACCENT SHAPES */}
      <div className="absolute top-0 right-0 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="cornerGreen1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="cornerGreen2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="cornerLime" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Layered diagonal polygons */}
          <polygon points="120,0 200,0 200,80" fill="url(#cornerGreen2)" />
          <polygon points="80,0 200,0 200,120" fill="url(#cornerGreen1)" opacity="0.85" />
          <polygon points="140,0 200,0 200,60" fill="url(#cornerGreen2)" />
          <polygon points="50,0 120,0 200,80 200,150" fill="url(#cornerLime)" opacity="0.6" />
        </svg>
      </div>

      {/* 2. BOTTOM LEFT GEOMETRIC ACCENT SHAPES */}
      <div className="absolute bottom-0 left-0 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none overflow-hidden z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="cornerBottom1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="cornerBottom2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#166534" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <polygon points="0,80 0,200 120,200" fill="url(#cornerBottom1)" />
          <polygon points="0,120 0,200 80,200" fill="url(#cornerBottom2)" opacity="0.9" />
          <polygon points="0,50 0,110 90,200 150,200" fill="#84cc16" opacity="0.5" />
        </svg>
      </div>

      {/* 3. BACKGROUND SOFT BOTANICAL WATERMARK (BOTTOM RIGHT) */}
      <div className="absolute bottom-4 right-16 w-56 h-56 pointer-events-none opacity-[0.06] z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-800">
          <path d="M50 0 C65 25 80 40 100 50 C75 65 60 80 50 100 C35 75 20 60 0 50 C25 35 40 20 50 0 Z" />
        </svg>
      </div>

      {/* 4. TOP BAR: LOGO + SLOGAN (LEFT) | CERTIFICATE ID + DATE (RIGHT) */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        {/* Ingage Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="flex items-center text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-slate-900 font-extrabold">in</span>
            <span className="text-[#16a34a] font-extrabold">gage</span>
          </div>
          <div className="h-5 w-[1.5px] bg-slate-300" />
          <span className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide">
            Learn &bull; Build &bull; Grow
          </span>
        </div>

        {/* Certificate Metadata */}
        <div className="text-right space-y-0.5 pr-2 sm:pr-4">
          <div className="text-[11px] sm:text-xs font-semibold text-slate-600">
            Certificate ID: <span className="font-mono text-slate-700">{certificateNumber}</span>
          </div>
          <div className="text-[11px] sm:text-xs font-semibold text-slate-600">
            Issued on: <span className="font-medium text-slate-700">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* 5. MAIN CONTENT & GOLD ROSETTE BADGE */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto pt-4 pb-2">
        {/* Left Column: Titles & Student Information (8 cols) */}
        <div className="md:col-span-8 space-y-3 sm:space-y-4">
          <div className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-[#16a34a] uppercase">
            CERTIFICATE OF COMPLETION
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
            {courseTitle}
          </h1>

          <div className="text-xs sm:text-sm text-slate-500 font-medium pt-1">
            This certifies that
          </div>

          <div className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight pb-1">
            {studentName}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-normal">
            has successfully completed the <strong className="text-slate-900 font-semibold">{courseTitle}</strong> course
            offered by Ingage LMS and demonstrated the required skills and knowledge in modern web technologies.
          </p>
        </div>

        {/* Right Column: GOLD MEDAL ROSETTE BADGE (4 cols) */}
        <div className="md:col-span-4 flex justify-center md:justify-end items-center pr-2">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* Green Ribbon Tails Behind Medal */}
            <div
              className="absolute -bottom-5 left-8 w-8 h-16 bg-[#166534] shadow-md z-0"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
                transform: 'rotate(18deg)',
              }}
            />
            <div
              className="absolute -bottom-5 right-8 w-8 h-16 bg-[#15803d] shadow-md z-0"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
                transform: 'rotate(-18deg)',
              }}
            />

            {/* Gold Scalloped Rosette Outer Medal */}
            <div
              className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full p-2 flex items-center justify-center shadow-lg"
              style={{
                background: 'radial-gradient(circle, #fef08a 0%, #eab308 60%, #ca8a04 100%)',
                boxShadow: '0 8px 24px rgba(202, 138, 4, 0.35)',
              }}
            >
              {/* Inner Circle with Stitching/Laurel Border */}
              <div
                className="w-full h-full rounded-full border-2 border-dashed border-[#a16207]/60 flex flex-col items-center justify-center text-center p-2"
                style={{
                  background: 'radial-gradient(circle, #fffbeb 0%, #fef3c7 70%, #fde68a 100%)',
                }}
              >
                {/* Graduation Mortarboard Icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 sm:w-8 sm:h-8 text-slate-900 fill-current mb-1"
                >
                  <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" />
                </svg>

                {/* Badge Title */}
                <span className="text-[9px] sm:text-[11px] font-black tracking-wider text-slate-900 uppercase leading-tight px-1">
                  COURSE COMPLETED
                </span>

                {/* Stars */}
                <div className="flex items-center gap-1 text-[#ca8a04] text-[10px] mt-1">
                  <span>★</span>
                  <span className="text-xs">★</span>
                  <span>★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SKILL BADGES HORIZONTAL ROW */}
      <div className="relative z-10 py-3 border-t border-b border-slate-150">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
          {skills.map((skill, idx) => (
            <div key={skill.name} className="flex items-center gap-2.5">
              {idx > 0 && <div className="hidden sm:block h-7 w-[1px] bg-slate-200 -ml-1.5 mr-1" />}
              {/* Green Circular Icon */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16a34a] shrink-0">
                {skill.type === 'react' && (
                  <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                )}
                {skill.type === 'node' && (
                  <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                )}
                {skill.type === 'postgres' && (
                  <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                )}
                {(skill.type === 'typescript' || skill.type === 'code' || skill.type === 'database') && (
                  <svg className="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  </svg>
                )}
              </div>

              {/* Text */}
              <div className="leading-tight">
                <div className="text-xs sm:text-sm font-bold text-slate-900">{skill.name}</div>
                <div className="text-[10px] sm:text-[11px] font-medium text-slate-500">{skill.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. FOOTER: MOTIVATIONAL LINE (LEFT) | INSTRUCTOR SIGNATURE (RIGHT) */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-3">
        {/* Motivational Line */}
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            Keep building, keep growing.
          </p>
          <p className="text-xs sm:text-sm font-medium text-slate-700">
            Your next chapter is just the beginning!
          </p>
        </div>

        {/* Instructor Handwritten Signature */}
        <div className="text-right self-end sm:self-auto space-y-1">
          {/* Authentic Handwritten Signature SVG */}
          <div className="flex justify-end pr-2">
            <svg viewBox="0 0 160 45" className="w-32 h-9 sm:w-40 sm:h-11">
              <path
                d="M 10 32 C 25 10, 32 8, 40 28 C 45 38, 52 32, 60 18 C 65 8, 70 30, 80 25 C 90 20, 95 32, 110 22 C 120 15, 130 35, 150 18"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="text-sm sm:text-base font-bold text-slate-900 leading-none">
            {instructorName}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Instructor, Ingage LMS
          </div>
        </div>
      </div>
    </div>
  );
};
