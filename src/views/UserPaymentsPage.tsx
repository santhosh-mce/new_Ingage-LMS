"use client";
import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowLeft, RefreshCw, CheckCircle2, Clock, XCircle, Shield, IndianRupee } from 'lucide-react';
import { getMyPayments, UserPaymentRecord } from '../api/paymentApi';
import { UserProfile } from '../types';

interface UserPaymentsPageProps {
  onNavigate: (path: string, param?: string) => void;
  currentUser: UserProfile | null;
}

export const UserPaymentsPage: React.FC<UserPaymentsPageProps> = ({ onNavigate, currentUser }) => {
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPayments();
      setPayments(data);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load your payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24">
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/my-learning')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Learning</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Shield className="w-4 h-4 text-lime-600" />
            <span>Secure 256-Bit Financial Records</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-lime-600" />
              <span>Payment & Receipt History</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              All transactions, receipts, and order settlements linked to your account.
            </p>
          </div>
          <button
            onClick={fetchPayments}
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            title="Refresh payments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-lime-600' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-lime-600 animate-spin" />
            <p className="text-sm font-medium text-gray-500">Loading your transactions from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 border border-red-200 text-center">
            <p className="text-sm text-red-600 font-semibold mb-4">{error}</p>
            <button
              onClick={fetchPayments}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No payment records yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              When you purchase a verified career track or course, your invoices and receipts will appear here.
            </p>
            <button
              onClick={() => onNavigate('/courses')}
              className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Browse Available Courses
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-200/70 text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Course</th>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Payment ID</th>
                    <th className="py-3.5 px-4">Original</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Final Paid</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{p.courseName}</div>
                        <button
                          onClick={() => onNavigate(`/courses/${p.courseId}`)}
                          className="text-[11px] text-lime-700 font-semibold hover:underline mt-0.5 cursor-pointer"
                        >
                          View Course
                        </button>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600">
                        {p.orderNumber || '—'}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600">
                        {p.razorpayPaymentId || p.paymentNumber || '—'}
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-600">
                        {formatPrice(p.amount)}
                      </td>
                      <td className="py-4 px-4 font-medium text-emerald-600">
                        {p.discount > 0 ? `-${formatPrice(p.discount)}` : '—'}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-gray-900">
                        {formatPrice(p.finalAmount)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(p.paymentStatus)}
                      </td>
                      <td className="py-4 px-5 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPaymentsPage;
