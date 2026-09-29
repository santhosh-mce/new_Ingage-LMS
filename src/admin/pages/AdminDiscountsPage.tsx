"use client";
import React, { useState, useEffect } from 'react';
import {
  getAdminDiscounts,
  createAdminDiscount,
  toggleAdminDiscountStatus,
  deleteAdminDiscount,
  getDiscountAnalytics,
} from '../../api/adminApi';
import {
  TicketPercent,
  Plus,
  Trash2,
  RefreshCw,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

export interface AdminDiscountsPageProps {
  onNavigate: (path: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminDiscountsPage: React.FC<AdminDiscountsPageProps> = ({
  onNavigate,
  onShowToast,
}) => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [couponCode, setCouponCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(499);
  const [maxDiscount, setMaxDiscount] = useState<number>(2000);
  const [active, setActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [disc, anal] = await Promise.all([
        getAdminDiscounts(),
        getDiscountAnalytics(),
      ]);
      setDiscounts(disc);
      setAnalytics(anal);
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast('Failed to load discount coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      alert('Please enter a coupon code.');
      return;
    }

    try {
      await createAdminDiscount({
        couponCode: couponCode.trim().toUpperCase(),
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        usageLimit,
        perUserLimit,
        minPurchaseAmount,
        maxDiscount: discountType === 'PERCENTAGE' ? maxDiscount : null,
        active,
      });

      if (onShowToast) onShowToast(`Coupon ${couponCode.toUpperCase()} created successfully!`);
      setIsCreateModalOpen(false);
      setCouponCode('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create coupon.');
    }
  };

  const handleToggleStatus = async (d: any) => {
    try {
      await toggleAdminDiscountStatus(d.id, !d.active);
      setDiscounts(
        discounts.map((item) =>
          item.id === d.id
            ? { ...item, active: !d.active, status: !d.active ? 'ACTIVE' : 'INACTIVE' }
            : item
        )
      );
      if (onShowToast)
        onShowToast(`Coupon ${d.couponCode} is now ${!d.active ? 'Active' : 'Inactive'}`);
    } catch {
      if (onShowToast) onShowToast('Failed to update status.');
    }
  };

  const handleDelete = async (d: any) => {
    if (!window.confirm(`Delete coupon ${d.couponCode}?`)) return;
    try {
      await deleteAdminDiscount(d.id);
      setDiscounts(discounts.filter((item) => item.id !== d.id));
      if (onShowToast) onShowToast('Coupon deleted.');
    } catch {
      if (onShowToast) onShowToast('Failed to delete coupon.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TicketPercent className="w-6 h-6 text-green-600" />
            Discount & Promotional Coupons
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create InGage coupon codes, enforce usage caps, min cart rules, and view real-time redemption ROI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Refresh Discounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : 'text-slate-500'}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            Total Coupons
          </span>
          <p className="text-xl font-bold text-slate-900">{analytics?.totalCoupons || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-green-700 font-semibold uppercase tracking-wider">
            Active Coupons
          </span>
          <p className="text-xl font-bold text-green-700">{analytics?.activeCoupons || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider">
            Expired
          </span>
          <p className="text-xl font-bold text-amber-700">{analytics?.expiredCoupons || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            Total Uses
          </span>
          <p className="text-xl font-bold text-slate-900">{analytics?.totalUses || 0}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-rose-700 font-semibold uppercase tracking-wider">
            Discount Given
          </span>
          <p className="text-xl font-bold text-rose-700">
            ₹{Number(analytics?.totalDiscountGiven || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] text-green-700 font-semibold uppercase tracking-wider">
            Revenue Driven
          </span>
          <p className="text-xl font-bold text-green-700">
            ₹{Number(analytics?.revenueGenerated || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Coupon Code</th>
                <th className="px-4 py-3.5 bg-slate-50">Discount Value</th>
                <th className="px-4 py-3.5 bg-slate-50">Usage / Limit</th>
                <th className="px-4 py-3.5 bg-slate-50">Min Purchase</th>
                <th className="px-4 py-3.5 bg-slate-50">Validity</th>
                <th className="px-4 py-3.5 bg-slate-50">Discount Given</th>
                <th className="px-4 py-3.5 bg-slate-50">Revenue Driven</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && discounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying discounts from database...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No discount coupons found. Click &quot;Create Discount&quot; to add one.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-green-700 text-sm">
                      {d.couponCode}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">
                      {d.discountType === 'PERCENTAGE'
                        ? `${d.discountValue}% OFF`
                        : `₹${d.discountValue} FLAT`}
                      {d.maxDiscount && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          Max: ₹{d.maxDiscount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-bold text-slate-900">{d.usedCount}</span>
                      <span className="text-slate-400"> / {d.usageLimit || '∞'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 text-xs">
                      ₹{d.minPurchaseAmount || 0}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {d.endDate ? (
                        <span>Until {new Date(d.endDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-green-700 font-medium">No Expiration</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-rose-700 text-xs">
                      ₹{Number(d.totalDiscountGiven || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-green-700 text-xs">
                      ₹{Number(d.revenueGenerated || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          d.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : d.status === 'EXPIRED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(d)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          d.active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-green-50 hover:bg-green-100 text-green-700'
                        }`}
                        title={d.active ? 'Deactivate Coupon' : 'Activate Coupon'}
                      >
                        {d.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDelete(d)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
            Total: <strong className="font-semibold text-slate-800">{discounts.length}</strong> coupon{discounts.length === 1 ? '' : 's'}
          </span>
          </div>
      </div>

      {/* Modal: Create Coupon */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-green-600" />
                Create New Promotional Discount
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER50, WELCOME20"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 uppercase font-mono font-bold mt-1 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED_AMOUNT">FIXED AMOUNT (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Total Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Per-User Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Min Purchase Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                  />
                </div>

                {discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 mt-1 transition"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                />
                <span>Set as Active immediately</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                Create Discount
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountsPage;
