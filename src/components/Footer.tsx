"use client";
import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#242424] text-white pt-10 pb-8 mt-0 w-full border-t border-neutral-800">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 pb-12 border-b border-neutral-700/60">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="text-2xl font-bold tracking-tight flex items-center gap-1">
              <span>Ingage LMS</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              Empowering professionals with role-based learning paths designed for real career growth.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/careers')} className="hover:text-lime-400 transition-colors">
                  Learning Paths
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/careers')} className="hover:text-lime-400 transition-colors">
                  Certifications
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/employers')} className="hover:text-lime-400 transition-colors">
                  For Teams
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/projects')} className="hover:text-lime-400 transition-colors">
                  Projects Track
                </button>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/jobs')} className="hover:text-lime-400 transition-colors">
                  Careers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/employers')} className="hover:text-lime-400 transition-colors">
                  Enterprise Solutions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  Community
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  Privacy &amp; Security
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-lime-400 transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div>© 2026 Ingage LMS. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer">
              f
            </span>
            <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer">
              𝕏
            </span>
            <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer">
              in
            </span>
            <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer">
              ✉
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
