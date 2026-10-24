"use client";

import React from "react";
import Link from "next/link";
import { Target, CheckCircle2, Circle } from "lucide-react";

export interface LearningGoalItem {
  title: string;
  isCompleted: boolean;
}

export interface LearningGoalsData {
  completed: number;
  total: number;
  message: string;
  checklist: LearningGoalItem[];
}

interface LearningGoalsCardProps {
  data: LearningGoalsData;
}

export function LearningGoalsCard({ data }: LearningGoalsCardProps) {
  const defaultChecklist: LearningGoalItem[] = [
    { title: "Finish Web Development Basics", isCompleted: true },
    { title: "Complete Python Programming", isCompleted: false },
    { title: "Complete AWS Cloud Computing", isCompleted: false },
  ];

  const checklist = React.useMemo(() => {
    if (data.checklist && data.checklist.length >= 3) {
      return data.checklist;
    }
    const combined = [...(data.checklist || [])];
    for (const d of defaultChecklist) {
      if (combined.length >= 3) break;
      if (!combined.some((c) => c.title.toLowerCase() === d.title.toLowerCase())) {
        combined.push(d);
      }
    }
    return combined.slice(0, 3);
  }, [data.checklist]);

  const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 33;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Learning Goals</h2>
        </div>
        <Link
          href="/my-learning"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Subtitle Message */}
      <p className="text-xs text-slate-500">{data.message}</p>

      {/* Progress Bar & Ratio */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#00C975] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 shrink-0">
            {data.completed} / {data.total}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2.5 pt-1">
        {checklist.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs">
            {item.isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-[#00C975] shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span
              className={`line-clamp-1 ${
                item.isCompleted ? "text-slate-800 font-medium" : "text-slate-500"
              }`}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
