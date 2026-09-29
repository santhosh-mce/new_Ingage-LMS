"use client";
import React, { useState } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
  Target,
  Award,
  Flag,
  CheckCircle2,
  Circle,
  FileText,
  Code2,
  Video,
  Mail,
  MessageSquare,
  Send,
  Play,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Check
} from 'lucide-react';

interface InternshipPageProps {
  onNavigate: (path: string, param?: string) => void;
  onShowToast?: (msg: string) => void;
}

interface WorkItem {
  id: string;
  type: 'LEARNING' | 'IMPLEMENTATION' | 'REVIEW';
  title: string;
  hours: number;
  dueDate?: string;
  status: 'done' | 'in_progress' | 'locked';
}

interface Milestone {
  id: string;
  weekLabel: string;
  title: string;
  description: string;
  dueDate: string;
  workItemsCount: number;
  progress: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  workItems?: WorkItem[];
}

export function InternshipPage({ onNavigate, onShowToast }: InternshipPageProps) {
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string>('milestone-2');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeWorkItem, setActiveWorkItem] = useState<WorkItem | null>(null);

  // Milestones Data (Exact match to Screenshots 2, 3, 4, 5)
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'milestone-1',
      weekLabel: 'WEEK 1',
      title: 'Foundation: Health Data API Integration',
      description: 'Set up backend services and integrate external health data APIs',
      dueDate: 'Jan 22, 2026',
      workItemsCount: 3,
      progress: 100,
      status: 'completed',
      workItems: [
        {
          id: 'w1-1',
          type: 'LEARNING',
          title: 'FHIR & HL7 Healthcare Data Standards overview',
          hours: 4,
          status: 'done'
        },
        {
          id: 'w1-2',
          type: 'IMPLEMENTATION',
          title: 'Set up Express API proxy & token authentication',
          hours: 6,
          status: 'done'
        },
        {
          id: 'w1-3',
          type: 'REVIEW',
          title: 'API Security & data privacy compliance review',
          hours: 2,
          status: 'done'
        }
      ]
    },
    {
      id: 'milestone-2',
      weekLabel: 'WEEK 2',
      title: 'Development: Patient Analytics Dashboard',
      description: 'Build interactive data visualization dashboard with real-time updates',
      dueDate: 'Feb 8, 2026',
      workItemsCount: 4,
      progress: 60,
      status: 'in_progress',
      workItems: [
        {
          id: 'w2-1',
          type: 'LEARNING',
          title: 'Study data visualization best practices',
          hours: 3,
          status: 'done'
        },
        {
          id: 'w2-2',
          type: 'IMPLEMENTATION',
          title: 'Design and build chart components',
          hours: 8,
          status: 'done'
        },
        {
          id: 'w2-3',
          type: 'IMPLEMENTATION',
          title: 'Implement filtering and interactivity',
          hours: 6,
          status: 'in_progress'
        },
        {
          id: 'w2-4',
          type: 'REVIEW',
          title: 'Mentor review & refinement',
          hours: 3,
          dueDate: 'Feb 7, 2026',
          status: 'locked'
        }
      ]
    },
    {
      id: 'milestone-3',
      weekLabel: 'WEEK 3',
      title: 'Feature: Patient Alert System',
      description: 'Create automated alert system for critical health metrics',
      dueDate: 'Feb 22, 2026',
      workItemsCount: 4,
      progress: 0,
      status: 'upcoming',
      workItems: [
        {
          id: 'w3-1',
          type: 'LEARNING',
          title: 'Real-time telemetry & anomaly threshold detection',
          hours: 3,
          status: 'locked'
        },
        {
          id: 'w3-2',
          type: 'IMPLEMENTATION',
          title: 'Trigger engine for vitals threshold breaches',
          hours: 7,
          status: 'locked'
        },
        {
          id: 'w3-3',
          type: 'IMPLEMENTATION',
          title: 'Push notification & SMS dispatch service',
          hours: 5,
          status: 'locked'
        },
        {
          id: 'w3-4',
          type: 'REVIEW',
          title: 'Stress testing & mentor validation',
          hours: 3,
          status: 'locked'
        }
      ]
    },
    {
      id: 'milestone-4',
      weekLabel: 'WEEK 4',
      title: 'Final Deliverable: Complete Healthcare Platform',
      description: 'Integration, final testing, documentation, and presentation',
      dueDate: 'Mar 12, 2026',
      workItemsCount: 3,
      progress: 0,
      status: 'upcoming',
      workItems: [
        {
          id: 'w4-1',
          type: 'IMPLEMENTATION',
          title: 'End-to-end integration & performance audit',
          hours: 10,
          status: 'locked'
        },
        {
          id: 'w4-2',
          type: 'LEARNING',
          title: 'Executive pitch deck & system architecture documentation',
          hours: 6,
          status: 'locked'
        },
        {
          id: 'w4-3',
          type: 'REVIEW',
          title: 'Final presentation with healthcare committee',
          hours: 4,
          status: 'locked'
        }
      ]
    }
  ]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestoneId((prev) => (prev === id ? '' : id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsMessageModalOpen(false);
    setMessageText('');
    if (onShowToast) {
      onShowToast('Message sent to Dr. Sarah Chen! You will receive a reply in your portal.');
    }
  };

  const handleWorkItemClick = (item: WorkItem) => {
    if (item.status === 'locked') {
      if (onShowToast) {
        onShowToast('This item is locked until previous work items are completed.');
      }
      return;
    }
    setActiveWorkItem(item);
    setIsSubmitModalOpen(true);
  };

  const handleCompleteWorkItem = () => {
    if (!activeWorkItem) return;
    setMilestones((prev) =>
      prev.map((m) => {
        if (!m.workItems) return m;
        const updatedItems = m.workItems.map((wi) => {
          if (wi.id === activeWorkItem.id) {
            return { ...wi, status: 'done' as const };
          }
          return wi;
        });
        const doneCount = updatedItems.filter((wi) => wi.status === 'done').length;
        const newProgress = Math.round((doneCount / updatedItems.length) * 100);
        return {
          ...m,
          progress: newProgress,
          workItems: updatedItems
        };
      })
    );
    setIsSubmitModalOpen(false);
    if (onShowToast) {
      onShowToast(`Completed "${activeWorkItem.title}"! Progress updated.`);
    }
  };

  return (
    <div className="w-full bg-[#fafbfa] text-gray-900 pb-6">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 pt-6">
        
        {/* Back to Dashboard Navigation Link */}
        <button
          id="internship-back-btn"
          onClick={() => onNavigate('/my-projects')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8DB600] hover:text-[#7ca300] transition-colors cursor-pointer mb-5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Header: Purple Icon + Title & Subtitle */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#6929e0] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Healthcare Technology Internship
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Track your professional internship experience
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Internship Status, Role Card, Mentor Lead Card */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD 1: Internship Status */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-base">Internship Status</h3>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  In Progress
                </span>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Started: <strong className="text-gray-900 font-semibold">January 15, 2026</strong></span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-600">
                  <Target className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Target End: <strong className="text-gray-900 font-semibold">March 15, 2026</strong></span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Current Week: <strong className="text-gray-900 font-semibold">Week 4 of 8</strong></span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2 font-semibold">
                  <span className="text-gray-700">Overall Progress</span>
                  <span className="text-[#6929e0] font-bold text-sm">45%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6929e0] rounded-full transition-all duration-500"
                    style={{ width: '45%' }}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Your Role in This Internship (Solid Purple Banner) */}
            <div className="bg-gradient-to-br from-[#6025dc] via-[#6929e0] to-[#7b35eb] rounded-2xl p-6 text-white shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-base text-white">
                  Your Role in This Internship
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    POSITION
                  </div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    Intern – Software Developer
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    DEPARTMENT
                  </div>
                  <div className="text-sm font-semibold text-white/95 mt-0.5">
                    Healthcare Technology Division
                  </div>
                </div>

                <p className="text-xs text-white/85 pt-2 leading-relaxed border-t border-white/15">
                  You'll work on professional-grade healthcare technology projects under the guidance of your project lead.
                </p>
              </div>
            </div>

            {/* CARD 3: Mentor / Project Lead */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Mentor / Project Lead</h3>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                  👩‍⚕️
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-base leading-tight">
                    Dr. Sarah Chen
                  </div>
                  <div className="text-xs font-semibold text-[#6929e0] mt-0.5">
                    Project Lead & Senior Mentor
                  </div>
                  <div className="text-xs text-gray-500">
                    Healthcare Technology
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>sarah.chen@ingage.com</span>
              </div>

              {/* Light Green Check-in Box */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <Video className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Next Weekly Check-in</span>
                </div>
                <div className="text-gray-700 font-medium pl-5">
                  Feb 7, 2026 at 2:00 PM
                </div>
              </div>

              {/* Message Project Lead Button */}
              <button
                id="message-project-lead-btn"
                onClick={() => setIsMessageModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#6929e0] hover:bg-[#5b22c7] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Message Project Lead</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Project Timeline, Milestones, and Work Items */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Timeline Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Project Timeline
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Complete each milestone with weekly checkpoints to progress through your internship
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold shrink-0 self-start sm:self-auto">
                  <Flag className="w-3.5 h-3.5 text-gray-500" />
                  <span>4 Major Milestones</span>
                </div>
              </div>
            </div>

            {/* MILESTONE LIST */}
            <div className="space-y-4">
              {milestones.map((milestone) => {
                const isExpanded = expandedMilestoneId === milestone.id;
                const isCompleted = milestone.status === 'completed';
                const isInProgress = milestone.status === 'in_progress';

                return (
                  <div
                    key={milestone.id}
                    className={`rounded-2xl border transition-all bg-white shadow-xs overflow-hidden ${
                      isInProgress
                        ? 'border-blue-300 ring-1 ring-blue-100'
                        : isCompleted
                        ? 'border-gray-200/90'
                        : 'border-gray-200/70'
                    }`}
                  >
                    {/* Milestone Summary Header (Click to toggle) */}
                    <div
                      onClick={() => toggleMilestone(milestone.id)}
                      className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {/* Status Icon */}
                          {isCompleted ? (
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : isInProgress ? (
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-200" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                              <Circle className="w-5 h-5" />
                            </div>
                          )}

                          <div>
                            {/* Week Label Pill */}
                            <div className="inline-block">
                              <span
                                className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                  isInProgress
                                    ? 'bg-purple-100 text-purple-800'
                                    : isCompleted
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {milestone.weekLabel}
                              </span>
                            </div>

                            {/* Milestone Title */}
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1 leading-snug">
                              {milestone.title}
                            </h3>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-relaxed">
                              {milestone.description}
                            </p>

                            {/* Meta items */}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>Due: {milestone.dueDate}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                                <span>{milestone.workItemsCount} work items</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse Chevron */}
                        <div className="text-gray-400 p-1 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar (Visible in summary) */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-gray-500">
                          <span>Progress</span>
                          <span
                            className={
                              isCompleted
                                ? 'text-emerald-600 font-bold'
                                : isInProgress
                                ? 'text-blue-600 font-bold'
                                : 'text-gray-400'
                            }
                          >
                            {milestone.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-gradient-to-r from-blue-600 to-[#6929e0]'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED SECTION: Work Items (Exact match to Screenshots 3, 4, 5) */}
                    {isExpanded && milestone.workItems && (
                      <div className="bg-gray-50/60 p-5 sm:p-6 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <h4 className="text-sm font-bold text-gray-900">Work Items</h4>
                          <button
                            onClick={() => {
                              if (onShowToast) {
                                onShowToast(`Viewing all technical rubric specifications for ${milestone.title}`);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6929e0] hover:text-[#5521be] transition-colors cursor-pointer"
                          >
                            <span>View Full Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Items list */}
                        <div className="space-y-3">
                          {milestone.workItems.map((item) => {
                            const isItemDone = item.status === 'done';
                            const isItemInProgress = item.status === 'in_progress';
                            const isItemLocked = item.status === 'locked';

                            return (
                              <div
                                key={item.id}
                                className={`rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                                  isItemDone
                                    ? 'bg-emerald-50/40 border border-emerald-200/70'
                                    : isItemInProgress
                                    ? 'bg-blue-50/50 border border-blue-200'
                                    : 'bg-white border border-gray-200/70 opacity-80'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Icon box */}
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      item.type === 'LEARNING'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : item.type === 'IMPLEMENTATION'
                                        ? isItemInProgress
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {item.type === 'LEARNING' ? (
                                      <FileText className="w-4 h-4" />
                                    ) : item.type === 'IMPLEMENTATION' ? (
                                      <Code2 className="w-4 h-4" />
                                    ) : (
                                      <Clock className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div>
                                    {/* Tag */}
                                    <span
                                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                        item.type === 'LEARNING'
                                          ? 'text-purple-600'
                                          : item.type === 'IMPLEMENTATION'
                                          ? 'text-blue-600'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {item.type}
                                    </span>

                                    {/* Title */}
                                    <div className="text-sm font-bold text-gray-900 leading-snug mt-0.5">
                                      {item.title}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span>{item.hours}h</span>
                                      </span>
                                      {item.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3 text-gray-400" />
                                          <span>Due: {item.dueDate}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Action Button */}
                                <div className="self-end sm:self-center shrink-0">
                                  {isItemDone ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Done</span>
                                    </div>
                                  ) : isItemInProgress ? (
                                    <button
                                      onClick={() => handleWorkItemClick(item)}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-white" />
                                      <span>Continue</span>
                                    </button>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold">
                                      <Lock className="w-3 h-3" />
                                      <span>Locked</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Need Help or Guidance Card (Exact match to Screenshots 4 & 6) */}
            <div className="bg-purple-50/50 rounded-2xl border border-purple-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#6929e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    Need Help or Guidance?
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl leading-relaxed">
                    Your project lead is here to support you. Don't hesitate to reach out for clarification, feedback, or guidance on any work item.
                  </p>
                </div>
              </div>

              <button
                id="contact-project-lead-cta"
                onClick={() => setIsMessageModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6929e0] hover:bg-[#5b22c7] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer shrink-0 self-stretch sm:self-auto"
              >
                <span>Contact Project Lead</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6929e0] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Message Dr. Sarah Chen
                  </h3>
                  <div className="text-xs text-gray-500">
                    Project Lead & Senior Mentor
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Subject or Milestone Context
                </label>
                <input
                  type="text"
                  defaultValue="Week 2: Patient Analytics Dashboard - Interactivity assistance"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6929e0]/30 focus:border-[#6929e0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Hi Dr. Chen, I'm working on the chart components filter logic and had a question regarding..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6929e0]/30 focus:border-[#6929e0]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#6929e0] hover:bg-[#5b22c7] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Work Item Modal */}
      {isSubmitModalOpen && activeWorkItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {activeWorkItem.type}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {activeWorkItem.title}
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-gray-600">
              <p>
                You are currently working on this milestone checkpoint. Provide your pull request link or code sandbox commit to submit for mentor validation.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GitHub Branch / PR Link or Workspace URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/ingage-tech/patient-analytics/pull/14"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes for Mentor Review
                </label>
                <textarea
                  rows={3}
                  placeholder="Implemented dynamic time-series charts using Recharts with multi-select date ranges..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                💡 Estimated effort: {activeWorkItem.hours} hours. This will update your internship progress.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleCompleteWorkItem}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default InternshipPage;
