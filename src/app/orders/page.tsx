"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  IndianRupee,
  ArrowRight,
  Download,
  BookOpen,
  FileText,
  Search,
} from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { getMyPayments, UserPaymentRecord } from "@/api/paymentApi";
import { useAuth } from "@/context/AuthContext";

export default function OrdersPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [orders, setOrders] = useState<UserPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPayments();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load orders", err);
      setError("Unable to load your orders and payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>PENDING</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <span>REFUNDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.paymentStatus === statusFilter;
    const matchesSearch =
      !searchQuery ||
      o.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <StudentLayout activePath="/orders">
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders &amp; Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your official payment receipts, course purchases, transaction identifiers, and
            enrollment confirmations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or course..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-10 bg-slate-100 rounded w-full" />
            <div className="h-10 bg-slate-100 rounded w-full" />
            <div className="h-10 bg-slate-100 rounded w-full" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {searchQuery ? "No matching orders found" : "No orders recorded yet"}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? "Check your search terms or filter selection."
                : "When you enroll in courses or bootcamps, your order confirmations and tax receipts will appear here."}
            </p>
            <Link
              href="/discover"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20"
            >
              Explore Course Catalog
            </Link>
          </div>
        )}

        {/* Orders Table */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Course / Product</th>
                    <th className="py-4 px-6">Order Date</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Payment Method</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Enrollment Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.map((order) => {
                    const isPaid = order.paymentStatus === "PAID";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">
                          {order.orderNumber || `ORD-${order.id}`}
                        </td>

                        <td className="py-4 px-6 font-bold text-slate-900 max-w-xs truncate">
                          {order.courseName || "Web Development Basics"}
                        </td>

                        <td className="py-4 px-6 text-slate-500">
                          {formatDate(order.paymentDate)}
                        </td>

                        <td className="py-4 px-6 font-extrabold text-slate-900">
                          {formatPrice(order.finalAmount || order.amount || 0)}
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-600">Razorpay / UPI</span>
                        </td>

                        <td className="py-4 px-6">{getStatusBadge(order.paymentStatus)}</td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isPaid ? "Active Lifetime" : "Unenrolled"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold transition text-xs"
                            >
                              Details
                            </Link>

                            {order.courseId && isPaid && (
                              <Link
                                href={`/courses/${order.courseId}/learn`}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold transition text-xs"
                              >
                                Go to Course
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
