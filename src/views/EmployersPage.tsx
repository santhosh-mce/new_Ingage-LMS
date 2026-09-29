"use client";
import React, { useState } from 'react';
import { Building2, Users, Award, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';

interface EmployersPageProps {
  onNavigate: (path: string) => void;
}

export function EmployersPage({ onNavigate }: EmployersPageProps) {
  const [demoRequested, setDemoRequested] = useState(false);

  return (
    <div className="w-full bg-white pt-10 pb-6">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-100/80 text-lime-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 className="w-3.5 h-3.5" />
            <span>FOR ENTERPRISE &amp; TEAMS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Build Teams. Find Talent.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Whether you&apos;re upskilling your existing workforce or hiring new talent, Ingage connects you with role-ready professionals who meet validated criteria.
          </p>
        </div>

        {/* 2 Primary Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
          <div className="bg-white rounded-3xl p-8 border border-lime-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upskill Your Employees</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Transform your workforce with role-based training programs designed to close skill gaps and drive measurable performance.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Custom learning paths mapped to your internal ladder</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Skills assessment &amp; diagnostic gap analysis</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Executive progress tracking &amp; cohort analytics</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setDemoRequested(true)}
              className="w-full py-3 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm transition-colors"
            >
              Request Upskilling Demo
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-lime-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Hire Role-Ready Candidates</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Access an exclusive pool of skilled professionals who have completed rigorous job-role training and are ready to contribute from day one.
              </p>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Pre-vetted, role-ready talent with verified portfolios</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Competency-verified candidates (&ge;70% pass marks)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-600" />
                  <span>Faster hiring cycles &amp; reduced ramp-up time</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('/jobs')}
              className="w-full py-3 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-bold text-sm transition-colors"
            >
              Browse Talent Directory
            </button>
          </div>
        </div>

        {/* Demo Request Modal / Banner */}
        {demoRequested && (
          <div className="max-w-2xl mx-auto p-6 bg-lime-50 border border-lime-200 rounded-2xl text-center mb-12">
            <h4 className="text-base font-bold text-lime-900">Thank you for your interest!</h4>
            <p className="text-xs text-lime-700 mt-1">
              Our enterprise workforce development team will reach out within 1 business day with a customized curriculum demo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployersPage;
