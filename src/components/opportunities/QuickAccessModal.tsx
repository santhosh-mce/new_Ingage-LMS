"use client";
import React from 'react';
import {
  X,
  Code2,
  Users,
  UserCheck,
  Sparkles,
  MessageSquare,
  Lightbulb,
  ExternalLink,
  Calendar,
  Award,
  ArrowRight,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export type QuickAccessType =
  | 'hackathons'
  | 'mentorship'
  | 'funding'
  | 'alumni'
  | 'forum'
  | 'tips'
  | null;

interface QuickAccessModalProps {
  type: QuickAccessType;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function QuickAccessModal({ type, onClose, onNavigate }: QuickAccessModalProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Hackathons Modal */}
        {type === 'hackathons' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Exposure &amp; Skill Building
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    National Hackathons &amp; Challenges
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <p className="text-gray-600 text-xs sm:text-sm">
                Participate in verified industry sprints with cash prizes, mentor feedback, and fast-track hiring pipelines:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">Ingage FinTech Data Sprint 2026</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Prize Pool: ₹2,50,000
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Build a real-time risk classification pipeline on anonymized transaction streams.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-600" /> Starts Oct 15</span>
                    <span>•</span>
                    <span>Teams of 2-4</span>
                    <span>•</span>
                    <span className="font-semibold text-purple-700">Top 10 receive interviews</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">HealthAI Predictive Diagnostics Challenge</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Prize Pool: ₹1,80,000
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Predict patient readmissions using machine learning on open clinical datasets.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-purple-600" /> Starts Nov 01</span>
                    <span>•</span>
                    <span>Individual or Solo</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mentorship Modal */}
        {type === 'mentorship' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Startup &amp; Entrepreneurship
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    1-on-1 Industry Mentorship
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <p className="text-gray-600 text-xs sm:text-sm">
                Connect with verified staff engineers, analytics leads, and founders for portfolio critiques and mock interviews:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center">
                      AK
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">Ananya Kapoor</div>
                      <div className="text-xs text-gray-500">Lead BI Architect • Amazon</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Specializes in SQL performance tuning, executive Tableau dashboards, and resume polishing.</p>
                  <button className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer">
                    Book 30-min Slot
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                      RV
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">Rahul Verma</div>
                      <div className="text-xs text-gray-500">VP Analytics • Flipkart</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Expert in transition to Data Science, salary negotiation, and portfolio case studies.</p>
                  <button className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer">
                    Book 30-min Slot
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Funding Modal */}
        {type === 'funding' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-pink-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-pink-800 bg-pink-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Startup &amp; Entrepreneurship
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    Ingage Seed &amp; Prototype Grant
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-pink-950 text-xs sm:text-sm">
                <span className="font-bold">Grant Pool: ₹25,00,000 Equity-Free</span>
                <p className="mt-1 text-xs text-pink-800">
                  Building a data tool, SaaS prototype, or AI product out of your Ingage Projects track? Apply for prototype micro-grants up to ₹2.5 Lakhs with cloud credits.
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="font-bold text-gray-900 text-sm">Eligibility Criteria:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Completed at least 1 Hands-on Industry Project in Ingage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Functional working GitHub repository or hosted MVP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Short 3-minute video demo of problem and traction</span>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer">
                Submit Pitch Deck &amp; Demo
              </button>
            </div>
          </>
        )}

        {/* Alumni Modal */}
        {type === 'alumni' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Community &amp; Network
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    Ingage Alumni Network
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <p className="text-gray-600 text-xs sm:text-sm">
                Connect with 12,000+ graduates placed at top tech enterprises worldwide:
              </p>

              <div className="space-y-2.5">
                {[
                  { name: 'Pooja Iyer', role: 'BI Analyst at Swiggy', track: 'Data Analyst Grad 2024', location: 'Bangalore' },
                  { name: 'Karthik Nair', role: 'Data Engineer at Razorpay', track: 'Data Scientist Grad 2024', location: 'Remote' },
                  { name: 'Sneha Patel', role: 'Junior Analyst at Deloitte', track: 'BI Track Grad 2023', location: 'Hyderabad' }
                ].map((a, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{a.name}</div>
                      <div className="text-xs text-lime-700 font-semibold">{a.role}</div>
                      <div className="text-[11px] text-gray-400">{a.track} • {a.location}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold cursor-pointer">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Discussion Forum */}
        {type === 'forum' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Community &amp; Network
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    Placement &amp; Interview Forum
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="space-y-3">
                {[
                  { title: 'DataCorp Analytics interview rounds breakdown (Jan 2025)', author: 'Rohan M.', replies: 24, views: 340 },
                  { title: 'How to prepare for SQL window function queries on live assessments', author: 'Divya S.', replies: 42, views: 820 },
                  { title: 'Comparing ₹6-8 LPA offers in Bangalore vs Pune (Cost of Living breakdown)', author: 'Amit K.', replies: 19, views: 510 }
                ].map((post, i) => (
                  <div key={i} className="p-4 rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50/20 transition-colors cursor-pointer">
                    <h4 className="font-bold text-gray-900 text-sm hover:text-orange-600 transition-colors">{post.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span>Posted by {post.author}</span>
                      <span>•</span>
                      <span>{post.replies} replies</span>
                      <span>•</span>
                      <span>{post.views} views</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tips & Tricks Modal */}
        {type === 'tips' && (
          <>
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Platform Guidance
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                    Placement Tips &amp; Interview Tricks
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    How to trigger the "Employer Interested" badge
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Employers search talent using verified skill competencies. Scoring above 80% on milestone quizzes in Ingage immediately moves your candidate card to partner recruiters' featured feed.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-lime-600" />
                    Format your GitHub repository readme for hiring managers
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Always include a concise architecture diagram, dataset source citations, key queries/models, and clear setup instructions.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Leverage Ingage Verified Credentials on LinkedIn
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Add your Ingage certification credential ID under "Licenses &amp; Certifications" to receive up to 3.5x more recruiter outreach messages.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
