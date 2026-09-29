"use client";
import React, { useState } from 'react';
import {
  ChevronLeft,
  Sparkles,
  Briefcase,
  Laptop,
  FileText,
  Users,
  Code2,
  Target,
  Flag,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  Star,
  Trophy,
  GraduationCap,
  Rocket,
  Award,
  ArrowRight,
  Check,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface InternshipProgramPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string) => void;
}

export function InternshipProgramPage({ onNavigate, onShowToast }: InternshipProgramPageProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartInternship = () => {
    setIsStarting(true);
    if (onShowToast) {
      onShowToast('Welcome to the Ingage Industry Internship Program! Opening your workspace...');
    }
    setTimeout(() => {
      onNavigate('/internship');
    }, 400);
  };

  return (
    <div className="w-full bg-[#fafbfa] text-gray-900 pb-6">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-6">
        
        {/* Back to Dashboard Navigation Link (Exact match to Screenshot 7) */}
        <button
          id="internship-program-back-btn"
          onClick={() => onNavigate('/my-projects')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8DB600] hover:text-[#7ca300] transition-colors cursor-pointer mb-5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Hero Banner: Ingage Industry Internship Program (Exact match to Screenshot 7) */}
        <div className="bg-gradient-to-r from-[#5a22d8] via-[#6929e0] to-[#7b35eb] rounded-3xl p-8 sm:p-12 text-white shadow-md mb-10 relative overflow-hidden text-center">
          {/* Subtle background ambient circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Badge: ADVANCED LEARNING TRACK */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-wider mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>ADVANCED LEARNING TRACK</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Ingage Industry Internship Program
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/90 mt-3.5 max-w-2xl mx-auto leading-relaxed font-medium">
            Experience professional project work in a simulated industry environment with structured mentorship
          </p>
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* SECTION 1: What This Internship Is (Exact match to Screenshots 6 & 7) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#6929e0] flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  What This Internship Is
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  An internal advanced learning program designed to simulate real-world work experience
                </p>
              </div>
            </div>

            {/* 3 Vertical Feature Cards */}
            <div className="space-y-3.5">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Simulates Working in a Professional Environment
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    Experience what it's like to work on industry-grade projects with professional standards, deadlines, and expectations—all within a supportive learning environment.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Structured Like an Office Assignment
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    Work follows a professional workflow with project briefs, milestone reviews, status updates, and final deliverables—mirroring how real companies operate.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Mentor Acts as Project Lead / Manager
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    Your mentor takes on the role of a project manager or team lead, providing guidance, reviewing your work, and helping you improve—just like in a real workplace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: What You Will Work On (Exact match to Screenshots 5 & 6) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#6929e0] flex items-center justify-center shrink-0">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  What You Will Work On
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  A comprehensive project broken down into achievable milestones
                </p>
              </div>
            </div>

            {/* 3 Lavender Feature Cards */}
            <div className="space-y-3.5">
              {/* Card 1 */}
              <div className="bg-purple-50/50 rounded-2xl border border-purple-200/70 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    One Primary Internship Project
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    You'll focus on a single, advanced industry-aligned project that demonstrates professional-level skills and deeper technical understanding.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-purple-50/50 rounded-2xl border border-purple-200/70 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <Flag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Multiple Milestones
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    The project is broken into structured milestones with clear deliverables. Each milestone must be reviewed and approved by your mentor before proceeding.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-purple-50/50 rounded-2xl border border-purple-200/70 p-5 sm:p-6 shadow-xs flex items-start gap-4">
                <div className="text-[#6929e0] p-1 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Final Delivery & Review
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    Complete the project with a final submission, code review, and mentor evaluation—ensuring your work meets professional quality standards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Program Duration (Exact match to Screenshots 4 & 5) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Program Duration
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Flexible timeline with consistent weekly commitment
                </p>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box 1: Fixed Duration */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-[#2563eb] mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Fixed Duration
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#2563eb] mt-2 mb-3 tracking-tight">
                    6–8 Weeks
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    The internship is designed to be completed within 6 to 8 weeks of focused work, though you can move at your own pace.
                  </p>
                </div>
              </div>

              {/* Box 2: Weekly Expectations */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs">
                <div className="text-[#2563eb] mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-gray-900 mb-3">
                  Weekly Expectations
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 font-bold">•</span>
                    <span><strong className="text-gray-900 font-semibold">8-12 hours per week</strong> of project work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 font-bold">•</span>
                    <span><strong className="text-gray-900 font-semibold">1 mentor check-in</strong> per week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400 font-bold">•</span>
                    <span><strong className="text-gray-900 font-semibold">Weekly milestone reviews</strong> to track progress</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Self-paced & Flexible Alert Callout */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
              <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                <strong className="font-bold text-gray-900">Self-paced & flexible:</strong> You can balance this internship with your studies or other commitments. However, consistent weekly engagement is recommended for the best learning outcomes.
              </p>
            </div>
          </div>

          {/* SECTION 4: What You'll Earn (Exact match to Screenshots 3 & 4) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  What You'll Earn
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Recognition and opportunities for completing the program
                </p>
              </div>
            </div>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Internship Certificate */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-purple-100 text-[#6929e0] flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Internship Certificate
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Official certificate recognizing your completion of the Ingage Industry Internship Program with mentor validation.
                </p>
              </div>

              {/* Card 2: Final Internship Project */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Final Internship Project
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  A professional-grade, portfolio-ready project that demonstrates advanced skills and real-world application.
                </p>
              </div>

              {/* Card 3: Advanced Program Access */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Advanced Program Access
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Unlock eligibility for hackathons, advanced learning tracks, and other exclusive Ingage programs.
                </p>
              </div>
            </div>
          </div>

          {/* BOTTOM CTA BANNER: Ready to Begin Your Internship Journey? (Exact match to Screenshots 2 & 3) */}
          <div className="bg-gradient-to-r from-[#5a22d8] via-[#6929e0] to-[#7b35eb] rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center space-y-6 relative overflow-hidden my-12">
            <div className="w-12 h-12 rounded-full bg-white/20 text-yellow-300 flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Ready to Begin Your Internship Journey?
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-white/90 mt-2 max-w-xl mx-auto leading-relaxed">
                Step into a professional learning experience and build skills that matter in the real world.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="start-internship-program-bottom-btn"
                onClick={handleStartInternship}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-gray-100 text-[#6929e0] font-bold text-sm sm:text-base shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 group"
              >
                <span>Start Internship Program</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default InternshipProgramPage;
