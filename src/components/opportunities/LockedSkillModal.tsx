"use client";
import React from 'react';
import { X, Lock, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Award } from 'lucide-react';
import { Opportunity } from '../../data/opportunitiesData';

interface LockedSkillModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function LockedSkillModal({ opportunity, onClose, onNavigate }: LockedSkillModalProps) {
  if (!opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-amber-50/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Prerequisite Skills Required
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                {opportunity.title}
              </h2>
              <p className="text-xs text-gray-600">
                {opportunity.company} • {opportunity.salary}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Employers for this senior role require validated milestone completions in specific competencies before unlocking applications. Complete the following modules in Ingage to unlock:
          </p>

          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Skill Readiness Breakdown
            </div>
            <div className="space-y-2">
              {opportunity.requiredSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                    skill.matched
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/60 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {skill.matched ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold text-sm">{skill.name}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      skill.matched
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {skill.matched ? 'Completed ✓' : 'Required'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-lime-50/60 border border-lime-200 rounded-xl flex items-start gap-3 text-xs text-lime-950">
            <Award className="w-5 h-5 text-lime-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pro Tip: </span>
              Taking the Data Analyst Track modules will automatically validate Tableau, Statistics, and Machine Learning on your profile.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              if (opportunity.roleTrackId) {
                onNavigate(`/roles/${opportunity.roleTrackId}`);
              } else {
                onNavigate('/careers');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Learning Track</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
