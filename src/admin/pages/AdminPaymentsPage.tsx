"use client";
import React, { useState, useEffect } from 'react';
import { getAdminPayments } from '../../api/adminApi';
import {
  CreditCard,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AdminPaymentsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getAdminPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.paymentStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.userName?.toLowerCase().includes(q);
      const matchEmail = p.userEmail?.toLowerCase().includes(q);
      const matchCourse = p.courseName?.toLowerCase().includes(q);
      const matchId =
        p.paymentNumber?.toLowerCase().includes(q) ||
        p.razorpayPaymentId?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCourse || matchId;
    }
    return true;
  });

  const totalCollected = payments
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((acc, p) => acc + (Number(p.finalAmount) || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Payment Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time Razorpay transaction logs verified via backend HMAC-SHA256 signatures.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] uppercase font-bold text-slate-500">Total Settled</span>
            <p className="text-lg font-bold text-green-700">₹{totalCollected.toLocaleString()}</p>
          </div>
          <button
            onClick={fetchPayments}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, course, or payment ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          {['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Payment ID</th>
                <th className="px-4 py-3.5 bg-slate-50">Order ID</th>
                <th className="px-4 py-3.5 bg-slate-50">Student</th>
                <th className="px-4 py-3.5 bg-slate-50">Course</th>
                <th className="px-4 py-3.5 bg-slate-50">Original</th>
                <th className="px-4 py-3.5 bg-slate-50">Discount</th>
                <th className="px-4 py-3.5 bg-slate-50">Final Paid</th>
                <th className="px-4 py-3.5 bg-slate-50">Gateway / Ref</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying payment records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No payment records match criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-900 font-bold">
                      {p.paymentNumber}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-xs">
                      {p.orderNumber || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{p.userName}</div>
                      <div className="text-xs text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {p.courseName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">₹{p.amount}</td>
                    <td className="px-4 py-3.5 text-xs text-amber-700 font-medium">
                      ₹{p.discount || 0}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-green-700 text-xs">
                      ₹{p.finalAmount}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 truncate max-w-[120px]">
                      {p.razorpayPaymentId || p.paymentMethod || 'Razorpay'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : p.paymentStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 text-xs whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Count */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span>
            Total: <strong className="font-semibold text-slate-800">{payments.length}</strong> record{payments.length === 1 ? '' : 's'}
          </span>
          </div>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
