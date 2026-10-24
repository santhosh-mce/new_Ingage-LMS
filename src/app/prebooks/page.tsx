"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  AlertCircle,
  Tag,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import {
  getPrebooksList,
  getPrebookedIds,
  togglePrebook,
  PrebookItem,
} from "@/api/prebooksApi";

export default function PrebooksListPage() {
  const [prebooks, setPrebooks] = useState<PrebookItem[]>([]);
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setPrebooks(getPrebooksList());
    setBookedIds(getPrebookedIds());
  }, []);

  const handleToggle = (id: string, title: string) => {
    const isNowBooked = togglePrebook(id);
    setBookedIds(getPrebookedIds());
    setToastMsg(
      isNowBooked
        ? `Successfully pre-booked "${title}"! Early access details will be emailed.`
        : `Cancelled pre-booking for "${title}".`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <StudentLayout activePath="/prebooks">
      <div className="space-y-8">
        {/* Toast */}
        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </span>
            <button onClick={() => setToastMsg(null)} className="text-emerald-600 hover:text-emerald-950">
              ✕
            </button>
          </div>
        )}

        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Upcoming Pre-Book Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reserve your seat for upcoming high-demand technology master courses before public launch.
            Enjoy locked-in early bird rates and exclusive preview workshops.
          </p>
        </div>

        {/* Prebooks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prebooks.map((item) => {
            const isBooked = bookedIds.includes(item.id);
            const remaining = item.totalSeats - item.bookedSeats;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-teal-400 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-teal-400 backdrop-blur-xs border border-teal-500/20">
                        {item.availability}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/90 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
                      <span className="text-teal-400">{formatPrice(item.price)}</span>
                      <span className="line-through text-slate-500 text-[10px]">
                        {formatPrice(item.originalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-teal-700 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Instructor</span>
                        <span className="font-bold text-slate-800">{item.instructor}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Launch Date</span>
                        <span className="font-bold text-teal-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.expectedLaunchDate}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Availability</span>
                        <span className="font-bold text-amber-600">
                          {remaining} seats remaining
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(item.id, item.title)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                        isBooked
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}
                    >
                      {isBooked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Prebooked</span>
                        </>
                      ) : (
                        <span>Prebook Now</span>
                      )}
                    </button>

                    <Link
                      href={`/prebooks/${item.id}`}
                      className="py-2.5 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center transition"
                      title="View Details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StudentLayout>
  );
}
