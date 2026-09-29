"use client";
import React, { useState, useEffect } from 'react';
import { getAdminOrders } from '../../api/adminApi';
import {
  ShoppingBag,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AdminOrdersPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = o.userName?.toLowerCase().includes(q);
      const matchEmail = o.userEmail?.toLowerCase().includes(q);
      const matchCourse = o.courseName?.toLowerCase().includes(q);
      const matchOrder = o.orderNumber?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCourse || matchOrder;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-green-600" />
            Order Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Student checkout orders, applied coupons, and settlement timelines.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-sm font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, order #, or course..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Order Number</th>
                <th className="px-4 py-3.5 bg-slate-50">Student</th>
                <th className="px-4 py-3.5 bg-slate-50">Course</th>
                <th className="px-4 py-3.5 bg-slate-50">Amount</th>
                <th className="px-4 py-3.5 bg-slate-50">Discount</th>
                <th className="px-4 py-3.5 bg-slate-50">Final Amount</th>
                <th className="px-4 py-3.5 bg-slate-50">Coupon</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Created Date</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Settled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{o.userName}</div>
                      <div className="text-xs text-slate-500">{o.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {o.courseName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">₹{o.originalAmount}</td>
                    <td className="px-4 py-3.5 text-xs text-amber-700 font-medium">
                      ₹{o.discountAmount || 0}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-green-700 text-xs">₹{o.finalAmount}</td>
                    <td className="px-4 py-3.5">
                      {o.couponCode ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 font-mono">
                          {o.couponCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          o.status === 'PAID'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : o.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {new Date(o.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 text-xs">
                      {o.paidDate ? new Date(o.paidDate).toLocaleDateString() : '—'}
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
            Total: <strong className="font-semibold text-slate-800">{filtered.length}</strong> order{filtered.length === 1 ? '' : 's'}
          </span>
          </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
