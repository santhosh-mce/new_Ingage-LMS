"use client";
import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export interface AdminUnauthorizedPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
}

export const AdminUnauthorizedPage: React.FC<AdminUnauthorizedPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-950 text-white select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold text-rose-400 tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
            403 Forbidden
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-2">
            Administrator Access Required
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            You do not have administrative privileges to access the Ingage Management Console. This area is strictly reserved for platform administrators.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          {onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 text-sm font-semibold transition-all shadow-lg shadow-lime-500/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUnauthorizedPage;
