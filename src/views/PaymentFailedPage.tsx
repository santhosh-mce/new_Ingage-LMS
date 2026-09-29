"use client";
import React from 'react';
import { XCircle, RefreshCw, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';

interface PaymentFailedPageProps {
  onNavigate: (path: string, param?: string) => void;
}

export const PaymentFailedPage: React.FC<PaymentFailedPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Top Banner */}
        <div className="bg-linear-to-r from-red-600 to-rose-700 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-md">
            <XCircle className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-100 bg-white/15 px-3 py-1 rounded-full border border-white/20">
            Transaction Incomplete
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Payment Failed
          </h1>
          <p className="text-red-100 text-sm mt-1.5 max-w-sm mx-auto">
            Your payment could not be completed.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-900 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong>No Charges Deducted:</strong> If your card or bank account was debited, the transaction will be refunded automatically by your bank within 3–5 business days.
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-500">
            <div className="font-semibold text-gray-700">Common reasons for payment decline:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Card declined by issuing bank or OTP expired</li>
              <li>Insufficient funds or international transaction disabled</li>
              <li>Network timeout during bank authorization</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('/courses')}
              className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => onNavigate('/courses')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Courses</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
