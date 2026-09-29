"use client";
import React, { useState, useEffect } from 'react';
import { getAdminCertificates, getCertificateDownloadUrl } from '../../api/adminApi';
import {
  Award,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const AdminCertificatesPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const data = await getAdminCertificates();
      setCertificates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const filtered = certificates.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.userName?.toLowerCase().includes(q);
      const matchEmail = c.userEmail?.toLowerCase().includes(q);
      const matchCourse = c.courseTitle?.toLowerCase().includes(q);
      const matchNum =
        c.certificateNumber?.toLowerCase().includes(q) ||
        c.verificationCode?.toLowerCase().includes(q);
      return matchName || matchEmail || matchCourse || matchNum;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-green-600" />
            Certifications & Issued Credentials
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable completion records generated via OpenPDF with unique cryptographic verification codes.
          </p>
        </div>

        <button
          onClick={fetchCerts}
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
            placeholder="Search certificate #, student, or course..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 uppercase text-[11px] text-slate-600 font-semibold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 bg-slate-50">Certificate Number</th>
                <th className="px-4 py-3.5 bg-slate-50">Student</th>
                <th className="px-4 py-3.5 bg-slate-50">Course Completed</th>
                <th className="px-4 py-3.5 bg-slate-50">Verification Code</th>
                <th className="px-4 py-3.5 bg-slate-50">Status</th>
                <th className="px-4 py-3.5 bg-slate-50">Issue Date</th>
                <th className="px-4 py-3.5 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-green-600 mb-2" />
                    Querying issued credentials...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No certificate records match.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-green-700 text-sm">
                      {c.certificateNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{c.userName}</div>
                      <div className="text-xs text-slate-500">{c.userEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-xs truncate">
                      {c.courseTitle}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-xs">
                      {c.verificationCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 uppercase tracking-wider">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {new Date(c.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      {/* Download PDF button */}
                      <a
                        href={getCertificateDownloadUrl(c.id, false)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>

                      {/* Public verify page */}
                      {c.verificationUrl && (
                        <a
                          href={c.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-green-50 text-slate-700 hover:text-green-700 text-xs font-medium transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </a>
                      )}
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
            Total: <strong className="font-semibold text-slate-800">{filtered.length}</strong> certificate{filtered.length === 1 ? '' : 's'}
          </span>
          </div>
      </div>
    </div>
  );
};

export default AdminCertificatesPage;
