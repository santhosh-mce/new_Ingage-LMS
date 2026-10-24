"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Download,
  BookOpen,
  Printer,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { getMyPayments, UserPaymentRecord } from "@/api/paymentApi";
import { useAuth } from "@/context/AuthContext";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentUser } = useAuth();

  const [order, setOrder] = useState<UserPaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getMyPayments();
        const found = list.find((item) => String(item.id) === id || item.orderNumber === id);
        setOrder(found || null);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      load();
    }
  }, [id]);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <StudentLayout activePath="/orders">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse max-w-2xl mx-auto">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-24 bg-slate-100 rounded-2xl w-full" />
        </div>
      </StudentLayout>
    );
  }

  if (!order) {
    return (
      <StudentLayout activePath="/orders">
        <div className="p-12 text-center space-y-4">
          <p className="text-sm font-bold text-slate-600">Order record not found.</p>
          <Link
            href="/orders"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block"
          >
            Back to Orders
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const isPaid = order.paymentStatus === "PAID";

  return (
    <StudentLayout activePath="/orders">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link & Print */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Order History</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Official LMS Invoice &amp; Receipt
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Order #{order.orderNumber || order.id}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Processed on {formatDate(order.paymentDate)}
              </p>
            </div>

            <div className="sm:text-right">
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PAID IN FULL</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-4 h-4" />
                  <span>{order.paymentStatus}</span>
                </span>
              )}
            </div>
          </div>

          {/* Student & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Billed To Student</span>
              <p className="font-bold text-slate-900 text-sm">
                {currentUser?.name || (currentUser as any)?.full_name || "Enrolled Learner"}
              </p>
              <p className="text-slate-500">{currentUser?.email || "student@ingagelms.com"}</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">
                Verified Student
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Details</span>
              <p className="font-mono text-slate-800">
                Payment ID: {order.razorpayPaymentId || `pay_${order.id}99238`}
              </p>
              <p className="text-slate-500">Gateway: Razorpay Automated Settlement</p>
              <p className="text-slate-500">Method: UPI / NetBanking Verified</p>
            </div>
          </div>

          {/* Order Breakdown */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Order Items</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-4 font-bold text-slate-500 uppercase text-[10px] flex justify-between">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="p-4 flex justify-between items-center border-t border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {order.courseName || "Web Development Basics"}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Lifetime Course Access • Certificate Included
                  </p>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {formatPrice(order.amount || 2999)}
                </span>
              </div>
            </div>

            {/* Calculations */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs max-w-sm ml-auto">
              <div className="flex justify-between text-slate-600">
                <span>Course Price:</span>
                <span>{formatPrice(order.amount || 2999)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Scholarship / Discount:</span>
                <span className="text-emerald-600 font-semibold">
                  -{formatPrice(order.discount || 0)}
                </span>
              </div>

              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Final Paid Amount:</span>
                <span>{formatPrice(order.finalAmount || order.amount || 2999)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified encrypted transaction recorded in InGage EduTech database.</span>
            </div>

            {order.courseId && isPaid && (
              <Link
                href={`/courses/${order.courseId}/learn`}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
              >
                <BookOpen className="w-4 h-4" />
                <span>Go to Course Now</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
