"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bookmark,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import {
  getPrebookById,
  getPrebookedIds,
  togglePrebook,
  PrebookItem,
} from "@/api/prebooksApi";

export default function PrebookDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<PrebookItem | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const found = getPrebookById(id);
      setItem(found);
      const booked = getPrebookedIds().includes(id);
      setIsBooked(booked);
    }
  }, [id]);

  const handleToggle = () => {
    if (!item) return;
    const nowBooked = togglePrebook(item.id);
    setIsBooked(nowBooked);
    setNotification(
      nowBooked
        ? `Seat reserved for "${item.title}". You will receive early preview instructions.`
        : `Pre-booking cancelled.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!item) {
    return (
      <StudentLayout activePath="/prebooks">
        <div className="p-12 text-center space-y-4">
          <p className="text-sm font-bold text-slate-600">Prebook course not found.</p>
          <Link
            href="/prebooks"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block"
          >
            Back to Prebooks
          </Link>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout activePath="/prebooks">
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/prebooks"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pre-Books</span>
        </Link>

        {notification && (
          <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>{notification}</span>
            </span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
              <Bookmark className="w-3.5 h-3.5" />
              <span>{item.availability}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {item.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.longDescription || item.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Launch Date</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>{item.expectedLaunchDate}</span>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Instructor</span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">{item.instructor}</p>
                <span className="text-[10px] text-slate-400 truncate block">{item.instructorRole}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Seats Reserved</span>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {item.bookedSeats} / {item.totalSeats}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & CTA Card */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 self-start w-full md:w-80 shrink-0">
            <div>
              <span className="text-xs font-semibold text-slate-500">Early-Bird Prebook Price</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900">{formatPrice(item.price)}</span>
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(item.originalPrice)}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                Save {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% Before Launch
              </span>
            </div>

            <button
              onClick={handleToggle}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                isBooked
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-teal-600 hover:bg-teal-700 text-white"
              }`}
            >
              {isBooked ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Prebooked (Seat Confirmed)</span>
                </>
              ) : (
                <span>Prebook Now</span>
              )}
            </button>

            <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>100% Refund Guarantee before course release</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Immediate access to closed discord channel</span>
              </li>
            </ul>
          </div>
        </div>

        {/* What You Will Learn Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">What You Will Learn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {item.learningOutcomes.map((outcome, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-700 font-medium">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
