"use client";
import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Briefcase,
  Rocket,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Database,
  Palette,
  Shield,
  Laptop,
  Target,
  Zap,
  Users,
  Award,
  Search,
  BookOpen,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { getJobRoles, JobRoleDto } from '../api/careerApi';

interface LandingPageProps {
  onNavigate: (path: string, param?: string) => void;
}

interface InteractivePathCardProps {
  id: string;
  theme: 'lime' | 'purple' | 'blue';
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
  badge?: string;
  description: string;
  items: string[];
  buttonText: string;
  buttonClass: string;
  onAction: () => void;
}

function InteractivePathCard({
  id,
  theme,
  icon,
  iconBg,
  title,
  subtitle,
  subtitleColor,
  badge,
  description,
  items,
  buttonText,
  buttonClass,
  onAction
}: InteractivePathCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Smooth 3D tilt calculation
    const rotateX = Number((((y - centerY) / centerY) * -5.5).toFixed(2));
    const rotateY = Number((((x - centerX) / centerX) * 5.5).toFixed(2));
    setMousePos({ x, y, active: true });
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0, active: false });
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const themeStyles = {
    lime: {
      border: 'border-lime-200/90 hover:border-lime-400',
      shadow: 'hover:shadow-[0_22px_45px_rgba(132,204,22,0.22)]',
      glowRgba: 'rgba(132, 204, 22, 0.18)',
      checkColor: 'text-lime-600',
      pillBg: 'bg-lime-50 text-lime-700 border-lime-200/80',
    },
    purple: {
      border: 'border-purple-200/90 hover:border-purple-400',
      shadow: 'hover:shadow-[0_22px_45px_rgba(147,51,234,0.22)]',
      glowRgba: 'rgba(147, 51, 234, 0.18)',
      checkColor: 'text-purple-600',
      pillBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    },
    blue: {
      border: 'border-blue-200/90 hover:border-blue-400',
      shadow: 'hover:shadow-[0_22px_45px_rgba(37,99,235,0.22)]',
      glowRgba: 'rgba(37, 99, 235, 0.18)',
      checkColor: 'text-blue-600',
      pillBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    }
  }[theme];

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onAction}
      style={{
        transform: mousePos.active
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-8px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: mousePos.active
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out'
          : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease-out'
      }}
      className={`group relative bg-white rounded-3xl p-8 border ${themeStyles.border} shadow-sm ${themeStyles.shadow} flex flex-col justify-between overflow-hidden cursor-pointer select-none`}
    >
      {/* Interactive cursor spotlight glow effect */}
      {mousePos.active && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, ${themeStyles.glowRgba}, transparent 70%)`
          }}
        />
      )}

      {/* Ambient decorative corner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50/80 to-transparent rounded-tr-3xl -z-10 pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-3.5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-2xl ${iconBg} text-white flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-950 transition-colors">
                {title}
              </h3>
              <p className={`text-sm font-semibold ${subtitleColor}`}>
                {subtitle}
              </p>
            </div>
          </div>
          {badge && (
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${themeStyles.pillBg}`}>
              {badge}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {description}
        </p>

        <ul className="space-y-3 mb-8">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
              <CheckCircle2 className={`w-5 h-5 ${themeStyles.checkColor} shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110`} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        id={id}
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        className={`w-full py-3.5 px-6 rounded-xl ${buttonClass} text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs group-hover:shadow-md cursor-pointer active:scale-[0.98]`}
      >
        <span>{buttonText}</span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
      </button>
    </div>
  );
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [roles, setRoles] = useState<JobRoleDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJobRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch job roles:', err);
      setError('Failed to load career paths. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getRoleIcon = (iconName?: string) => {
    switch (iconName) {
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-lime-600" />;
      case 'Database':
        return <Database className="w-5 h-5 text-lime-600" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-lime-600" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-lime-600" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-lime-600" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-lime-600" />;
      default:
        return <Laptop className="w-5 h-5 text-lime-600" />;
    }
  };

  return (
    <div className="w-full bg-white text-gray-900">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.18]">
                Job-Ready Training &amp; <br />
                Project-Based Learning
                <span className="block mt-2 text-lime-600">
                  One Platform, Two Powerful Paths
                </span>
              </h1>

              <p className="text-[15px] sm:text-[17px] text-gray-600 leading-relaxed max-w-2xl font-normal">
                Job-ready training programs or hands-on project learning—both backed by expert mentorship and validated skill development.
              </p>

              <div className="pt-2">
                <button
                  id="hero-start-learning-btn"
                  onClick={() => onNavigate('/careers')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-6 xl:col-span-6 relative w-full">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-100 h-[280px] min-[420px]:h-[360px] sm:h-[480px] lg:h-[540px] xl:h-[580px] w-full">
                <img
                  src="/hero-developer.jpg"
                  alt="Software engineer working on tech projects"
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Floating Skill Badge */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-100 flex items-center gap-3 sm:gap-3.5 max-w-[calc(100%-2rem)] sm:max-w-xs animate-in fade-in duration-300">
                  <div className="w-10 h-10 rounded-full bg-lime-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Career-Ready Skills</div>
                    <div className="text-xs text-gray-500">Industry-aligned curriculum</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHOOSE YOUR LEARNING PATH */}
      <section className="py-20 bg-gray-50/70 border-y border-gray-100 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Choose Your Learning Path
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-normal">
            Explore our 3 structured learning tracks designed to take you from foundational knowledge to job-ready credentials.
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto text-left">
            {/* Track 1: Career Compass */}
            <InteractivePathCard
              id="choose-path-job-roles-btn"
              theme="lime"
              icon={<Briefcase className="w-7 h-7" />}
              iconBg="bg-lime-600"
              title="Career Compass"
              subtitle="Job Role Pathways"
              subtitleColor="text-lime-600"
              badge="Career Track"
              description="Structured learning paths designed to prepare you for specific tech careers with placement support."
              items={[
                'Job-ready certification upon completion',
                'Career services & placement assistance',
                'Industry-recognized skill validation',
                'Interview prep & portfolio building'
              ]}
              buttonText="Explore Career Compass"
              buttonClass="bg-lime-600 hover:bg-lime-700"
              onAction={() => onNavigate('/careers')}
            />

            {/* Track 2: Skill Forge */}
            <InteractivePathCard
              id="choose-path-projects-btn"
              theme="purple"
              icon={<Rocket className="w-7 h-7" />}
              iconBg="bg-purple-600"
              title="Skill Forge"
              subtitle="InGage Courses & Projects"
              subtitleColor="text-purple-600"
              badge="Skill Track"
              description="Learn by building real-world projects at your own pace—perfect for deep skill mastery without job pressure."
              items={[
                'Hands-on project-based learning',
                'Learn at your own pace & schedule',
                'Build portfolio-worthy projects',
                'Practical code & architecture reviews'
              ]}
              buttonText="Explore Skill Forge"
              buttonClass="bg-purple-600 hover:bg-purple-700"
              onAction={() => onNavigate('/projects')}
            />

            {/* Track 3: Credential Edge */}
            <InteractivePathCard
              id="choose-path-credential-edge-btn"
              theme="blue"
              icon={<Award className="w-7 h-7" />}
              iconBg="bg-blue-600"
              title="Credential Edge"
              subtitle="Google Certified Courses"
              subtitleColor="text-blue-600"
              badge="Google Certified"
              description="Earn industry-recognised credentials through structured Google learning pathways."
              items={[
                'Industry-standard Google curricula',
                'Verified completion certificate',
                'Career portfolio enhancement',
                'Prepare for professional credentials'
              ]}
              buttonText="Explore Credential Edge"
              buttonClass="bg-blue-600 hover:bg-blue-700"
              onAction={() => onNavigate('/credential-edge')}
            />
          </div>
        </div>
      </section>

      {/* 3. EXPLORE JOB ROLES */}
      <section className="py-20 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Explore Job Roles
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-gray-600 font-normal">
              Choose from industry-leading programs designed to accelerate your career transition
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs flex flex-col h-[420px] animate-pulse">
                  <div className="h-48 bg-gray-200 w-full relative">
                    <div className="absolute bottom-3 left-4 w-11 h-11 rounded-xl bg-white/50 border border-gray-100"></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="mt-4 flex gap-2">
                        <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
                        <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error State
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-600 mb-4 font-medium">{error}</p>
                <button
                  onClick={fetchRoles}
                  className="px-6 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : roles.length === 0 ? (
              // Empty State
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-medium text-lg">No career paths available at the moment.</p>
              </div>
            ) : (
              // Success State
              roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => onNavigate(`/roles/${role.slug}`, role.slug)}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-lime-500 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col cursor-pointer"
                >
                  {/* Image + Top Badges */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={role.imageUrl}
                      alt={role.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {role.trending && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                        <TrendingUp className="w-3 h-3" />
                        <span>Trending</span>
                      </div>
                    )}
                    {/* Floating Category Icon */}
                    <div className="absolute bottom-3 left-4 w-11 h-11 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center z-10 group-hover:scale-105 transition-transform">
                      {getRoleIcon(role.iconName)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-lime-600 transition-colors">
                        {role.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>

                      {/* Tags: Level + Duration */}
                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            role.difficultyLevel === 'Beginner'
                              ? 'bg-emerald-50 text-emerald-700'
                              : role.difficultyLevel === 'Intermediate'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {role.difficultyLevel}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          ⏱ {role.durationMonths} months
                        </span>
                      </div>

                      {/* Stats Metrics: Avg. Salary + Job Openings */}
                      <div className="mt-5 pt-4 border-t border-gray-100 space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs">Avg. Salary</span>
                          <span className="font-bold text-lime-600">
                            {role.minimumSalary === role.maximumSalary 
                              ? `₹${role.minimumSalary} LPA` 
                              : `₹${role.minimumSalary}–${role.maximumSalary} LPA`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs">Job Openings</span>
                          <span className="font-semibold text-gray-900">{role.jobOpenings.toLocaleString()}+</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer link */}
                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>{role.moduleCount} modules</span>
                      <ArrowRight className="w-4 h-4 text-lime-600 group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <button
              id="view-all-career-paths-btn"
              onClick={() => onNavigate('/careers')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span>View All Career Paths</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE INGAGE LMS */}
      <section className="py-20 bg-gray-50/60 border-t border-gray-100 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Why Choose Ingage LMS
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-normal">
            Designed for professionals who want to advance their careers with targeted, practical learning
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: 'Role-Specific Learning',
                desc: 'Every course is tailored to your job role, ensuring you learn exactly what you need to excel in your position.',
                icon: Target
              },
              {
                title: 'Fast-Track Your Career',
                desc: 'Our accelerated learning paths help you master essential skills in weeks, not years, getting you job-ready faster.',
                icon: Zap
              },
              {
                title: 'Learn from Experts',
                desc: 'Get guidance from industry professionals who have walked the path and know what it takes to succeed.',
                icon: Users
              },
              {
                title: 'Recognized Certifications',
                desc: 'Earn industry-recognized certificates that validate your skills and boost your professional credibility.',
                icon: Award
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-lime-100/70 text-lime-700 flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-20 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            How It Works
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 font-normal">
            Your journey to career growth in four simple steps
          </p>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: 1,
                title: 'Choose Your Role',
                desc: 'Browse our catalog and select the career path that matches your goals and aspirations.',
                icon: Search
              },
              {
                step: 2,
                title: 'Follow Your Path',
                desc: 'Progress through curated modules designed specifically for your role at your own pace.',
                icon: BookOpen
              },
              {
                step: 3,
                title: 'Earn Certifications',
                desc: 'Complete assessments and projects to earn recognized certificates that validate your expertise.',
                icon: Trophy
              },
              {
                step: 4,
                title: 'Advance Your Career',
                desc: 'Apply your new skills immediately and unlock new opportunities in your professional journey.',
                icon: Rocket
              }
            ].map((stepItem, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  {/* Step number badge */}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-lime-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {stepItem.step}
                  </span>
                  {/* Circle icon */}
                  <div className="w-20 h-20 rounded-full bg-[#242424] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <stepItem.icon className="w-8 h-8 text-lime-400" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{stepItem.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs">{stepItem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHO IT'S FOR */}
      <section className="py-20 bg-gray-50/60 border-t border-gray-100 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Who It&apos;s For
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 font-normal">
            Whether you&apos;re starting out or leveling up, Ingage LMS has a path for you
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: 'Career Starters',
                desc: 'Launch your career with foundational skills and industry knowledge that employers value.',
                icon: GraduationCap
              },
              {
                title: 'Mid-Career Professionals',
                desc: 'Upskill to stay competitive and transition into more senior or specialized roles.',
                icon: Briefcase
              },
              {
                title: 'Career Changers',
                desc: 'Pivot to a new field with comprehensive training designed for successful transitions.',
                icon: TrendingUp
              },
              {
                title: 'Teams & Organizations',
                desc: 'Empower your workforce with role-based training that drives measurable business outcomes.',
                icon: Users
              }
            ].map((persona, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-lime-100/70 text-lime-700 flex items-center justify-center mb-5">
                  <persona.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{persona.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOR EMPLOYERS */}
      <section className="pt-14 pb-8 bg-white w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100/80 text-lime-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            <span>FOR EMPLOYERS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Build Teams. Find Talent.
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-normal">
            Whether you&apos;re upskilling your existing workforce or hiring new talent, Ingage connects you with role-ready professionals
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            {/* Upskill */}
            <div className="bg-white rounded-3xl p-8 border border-lime-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center mb-5">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upskill Your Employees</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Transform your workforce with role-based training programs designed to close skill gaps and drive performance.
                </p>
                <ul className="space-y-2.5 mb-8 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Custom learning paths for your teams</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Skills assessment &amp; gap analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Progress tracking &amp; analytics</span>
                  </li>
                </ul>
              </div>
              <button
                id="explore-upskilling-btn"
                onClick={() => onNavigate('/employers')}
                className="w-full py-3 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Explore Upskilling
              </button>
            </div>

            {/* Hire */}
            <div className="bg-white rounded-3xl p-8 border border-lime-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center mb-5">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Hire Role-Ready Candidates</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Access a pool of skilled professionals who have completed job-role training and are ready to contribute from day one.
                </p>
                <ul className="space-y-2.5 mb-8 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Pre-vetted, role-ready talent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Skills-verified candidates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-600"></span>
                    <span>Faster hiring &amp; onboarding</span>
                  </li>
                </ul>
              </div>
              <button
                id="browse-talent-btn"
                onClick={() => onNavigate('/employers')}
                className="w-full py-3 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Browse Talent
              </button>
            </div>
          </div>

          <div className="mt-14 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
            <Users className="w-4 h-4 text-lime-600" />
            <span>Trusted by organizations to build high-performing, role-ready teams</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
