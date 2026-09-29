"use client";
import React from 'react';
import { CheckCircle2, PlayCircle, ArrowRight, Shield, Award, Calendar, Hash, CreditCard } from 'lucide-react';

interface PaymentSuccessPageProps {
  dataJson?: string;
  onNavigate: (path: string, param?: string) => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  dataJson,
  onNavigate,
}) => {
  let paymentData: any = {};
  try {
    if (dataJson) {
      paymentData = JSON.parse(dataJson);
    }
  } catch {
    paymentData = {};
  }

  const courseTitle = paymentData.courseTitle || 'Your Enrolled Course';
  const courseId = paymentData.courseId;
  const amountPaid = Number(paymentData.amountPaid || 0);
  const orderNumber = paymentData.orderNumber || 'ORD-' + Date.now();
  const paymentNumber = paymentData.paymentNumber || 'PAY-' + Date.now();

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountPaid);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Top Banner */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-md">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-100 bg-white/15 px-3 py-1 rounded-full border border-white/20">
            Payment & Enrollment Verified
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-emerald-100 text-sm mt-1.5 max-w-sm mx-auto">
            You are now actively enrolled in your course.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Course Card */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
              Course
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
              {courseTitle}
            </h2>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-gray-100 text-xs sm:text-sm">
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Amount Paid
              </span>
              <span className="font-extrabold text-emerald-700 text-base">
                {formattedAmount}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-gray-400" />
                Order ID
              </span>
              <span className="font-mono text-gray-800 font-semibold">{orderNumber}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-gray-400" />
                Payment ID
              </span>
              <span className="font-mono text-gray-800 font-semibold">{paymentNumber}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Date & Time
              </span>
              <span className="text-gray-700">{formattedDate}</span>
            </div>
          </div>

          {/* Confirmation Alert */}
          <div className="bg-lime-50/70 border border-lime-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-lime-900 leading-relaxed">
            <Award className="w-5 h-5 text-lime-700 shrink-0 mt-0.5" />
            <div>
              <strong>Confirmation Dispatched:</strong> A receipt and course access notification has been sent to your registered email address.
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate(courseId ? `/learn/${courseId}` : '/my-learning')}
              className="w-full py-4 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Learning</span>
            </button>
            <button
              onClick={() => onNavigate('/my-learning')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <span>Go to My Learning Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
