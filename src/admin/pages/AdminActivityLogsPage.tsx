"use client";
import React, { useEffect, useState } from 'react';
import { getAdminActivityLogs } from '../../api/adminApi';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Database,
  Clock,
} from 'lucide-react';

export interface ActivityLogItem {
  id: number;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId: number;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export const AdminActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminActivityLogs();

      setLogs(data || []);
    } catch (err: any) {
      setError(
        err.message || 'Failed to fetch activity logs'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      log.adminEmail?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search) ||
      log.targetEntity?.toLowerCase().includes(search);

    const matchesAction =
      actionFilter === 'ALL' ||
      log.action?.includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  /* ================= ACTION BADGES ================= */

  const getBadgeClass = (action: string) => {
    if (
      action.includes('CREATE') ||
      action.includes('PUBLISH') ||
      action.includes('ISSUE')
    ) {
      return `
        bg-emerald-50
        text-emerald-700
        border-emerald-200
      `;
    }

    if (
      action.includes('DELETE') ||
      action.includes('ARCHIVE') ||
      action.includes('DEACTIVATE')
    ) {
      return `
        bg-red-50
        text-red-700
        border-red-200
      `;
    }

    if (
      action.includes('UPDATE') ||
      action.includes('EDIT')
    ) {
      return `
        bg-blue-50
        text-blue-700
        border-blue-200
      `;
    }

    return `
      bg-slate-100
      text-slate-600
      border-slate-200
    `;
  };

  /* ================= ACTION DOT ================= */

  const getActionDot = (action: string) => {
    if (
      action.includes('CREATE') ||
      action.includes('PUBLISH') ||
      action.includes('ISSUE')
    ) {
      return 'bg-emerald-500';
    }

    if (
      action.includes('DELETE') ||
      action.includes('ARCHIVE') ||
      action.includes('DEACTIVATE')
    ) {
      return 'bg-red-500';
    }

    if (
      action.includes('UPDATE') ||
      action.includes('EDIT')
    ) {
      return 'bg-blue-500';
    }

    return 'bg-slate-400';
  };

  return (
    <div className="space-y-6">

      {/* ================= PAGE HEADER ================= */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">

            <div
              className="
                w-11 h-11
                rounded-xl
                bg-blue-50
                border border-blue-100
                flex items-center justify-center
              "
            >
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Security & Activity Logs
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Monitor administrative activities and system changes
              </p>
            </div>

          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            px-4
            py-2.5
            bg-blue-600
            hover:bg-blue-700
            disabled:bg-blue-300
            text-white
            rounded-lg
            text-sm
            font-semibold
            shadow-sm
            transition
          "
        >
          <RefreshCw
            className={`w-4 h-4 ${
              loading ? 'animate-spin' : ''
            }`}
          />

          Refresh Logs
        </button>

      </div>

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Total Logs */}
        <div
          className="
            bg-white
            border border-slate-200
            rounded-xl
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Activities
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                {logs.length}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>

          </div>
        </div>

        {/* Filtered */}
        <div
          className="
            bg-white
            border border-slate-200
            rounded-xl
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Showing
              </p>

              <p className="text-2xl font-bold text-slate-900 mt-2">
                {filteredLogs.length}
              </p>
            </div>

            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-slate-600" />
            </div>

          </div>
        </div>

        {/* Status */}
        <div
          className="
            bg-white
            border border-slate-200
            rounded-xl
            p-5
            shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                System Status
              </p>

              <div className="flex items-center gap-2 mt-2">

                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>

                <span className="text-sm font-semibold text-emerald-600">
                  Monitoring Active
                </span>

              </div>
            </div>

            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

          </div>
        </div>

      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div
          className="
            p-4
            bg-red-50
            border border-red-200
            rounded-xl
            text-red-700
            text-sm
            flex items-center gap-3
          "
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ================= FILTERS ================= */}

      <div
        className="
          bg-white
          border border-slate-200
          rounded-xl
          p-4
          shadow-sm
        "
      >
        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">

            <Search
              className="
                w-4 h-4
                text-slate-400
                absolute
                left-3
                top-1/2
                -translate-y-1/2
              "
            />

            <input
              type="text"
              placeholder="Search admin, action, entity or details..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="
                w-full
                pl-10
                pr-4
                py-2.5
                bg-slate-50
                border border-slate-200
                rounded-lg
                text-sm
                text-slate-900
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500/20
                focus:border-blue-500
                transition
              "
            />

          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">

            <Filter className="w-4 h-4 text-slate-400 shrink-0" />

            <select
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value)
              }
              className="
                bg-slate-50
                border border-slate-200
                text-slate-700
                text-sm
                font-medium
                rounded-lg
                px-3
                py-2.5
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500/20
                focus:border-blue-500
              "
            >
              <option value="ALL">
                All Actions
              </option>

              <option value="CREATE">
                Created
              </option>

              <option value="UPDATE">
                Updated
              </option>

              <option value="DELETE">
                Deleted
              </option>

              <option value="PUBLISH">
                Published
              </option>

              <option value="DEACTIVATE">
                Deactivated
              </option>
            </select>

          </div>

        </div>
      </div>

      {/* ================= AUDIT LOG TABLE ================= */}

      <div
        className="
          bg-white
          border border-slate-200
          rounded-xl
          overflow-hidden
          shadow-sm
        "
      >

        {/* Table Header */}
        <div
          className="
            px-5
            py-4
            border-b border-slate-200
            flex
            items-center
            justify-between
          "
        >
          <div>

            <h2 className="text-base font-bold text-slate-900">
              Audit Trail
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Administrative actions recorded by the system
            </p>

          </div>

          <div
            className="
              hidden
              sm:flex
              items-center
              gap-2
              text-xs
              text-slate-500
            "
          >
            <Clock className="w-4 h-4" />
            Real-time
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            {/* Header */}
            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Timestamp
                </th>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Admin
                </th>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Action
                </th>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Entity
                </th>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Details
                </th>

                <th className="py-3 px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  IP Address
                </th>

              </tr>

            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">

              {/* Loading */}
              {loading ? (
                <tr>

                  <td
                    colSpan={6}
                    className="py-16 text-center"
                  >

                    <div
                      className="
                        inline-flex
                        items-center
                        justify-center
                        w-10
                        h-10
                        rounded-full
                        bg-blue-50
                        mb-3
                      "
                    >
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>

                    <p className="text-sm font-medium text-slate-600">
                      Loading activity logs...
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Please wait
                    </p>

                  </td>

                </tr>

              ) : filteredLogs.length === 0 ? (

                /* Empty */
                <tr>

                  <td
                    colSpan={6}
                    className="py-16 text-center"
                  >

                    <div
                      className="
                        inline-flex
                        items-center
                        justify-center
                        w-12
                        h-12
                        rounded-xl
                        bg-slate-100
                        mb-3
                      "
                    >
                      <Activity className="w-6 h-6 text-slate-400" />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      No activity logs found
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Try changing your search or filter
                    </p>

                  </td>

                </tr>

              ) : (

                /* Data */
                filteredLogs.map((log) => (

                  <tr
                    key={log.id}
                    className="
                      hover:bg-slate-50
                      transition
                    "
                  >

                    {/* Timestamp */}
                    <td className="py-4 px-5 whitespace-nowrap">

                      <div className="flex items-center gap-2">

                        <div
                          className="
                            w-8 h-8
                            rounded-lg
                            bg-slate-100
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <Calendar className="w-4 h-4 text-slate-500" />
                        </div>

                        <div>

                          <p className="text-xs font-medium text-slate-700">
                            {new Date(
                              log.createdAt
                            ).toLocaleDateString()}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            {new Date(
                              log.createdAt
                            ).toLocaleTimeString()}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Admin */}
                    <td className="py-4 px-5">

                      <div className="flex items-center gap-2.5">

                        <div
                          className="
                            w-8 h-8
                            rounded-full
                            bg-blue-50
                            border border-blue-100
                            text-blue-600
                            flex
                            items-center
                            justify-center
                          "
                        >
                          <User className="w-4 h-4" />
                        </div>

                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                          {log.adminEmail}
                        </span>

                      </div>

                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 whitespace-nowrap">

                      <span
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          px-2.5
                          py-1
                          rounded-full
                          text-[11px]
                          font-bold
                          border
                          ${getBadgeClass(log.action)}
                        `}
                      >

                        <span
                          className={`
                            w-1.5
                            h-1.5
                            rounded-full
                            ${getActionDot(log.action)}
                          `}
                        />

                        {log.action}

                      </span>

                    </td>

                    {/* Entity */}
                    <td className="py-4 px-5 whitespace-nowrap">

                      <div className="flex items-center gap-2">

                        <span className="text-sm font-medium text-blue-600">
                          {log.targetEntity || '—'}
                        </span>

                        {log.targetId ? (
                          <span
                            className="
                              px-1.5
                              py-0.5
                              bg-slate-100
                              text-slate-500
                              rounded
                              text-[10px]
                              font-mono
                            "
                          >
                            #{log.targetId}
                          </span>
                        ) : null}

                      </div>

                    </td>

                    {/* Details */}
                    <td className="py-4 px-5">

                      <div
                        className="
                          max-w-xs
                          lg:max-w-md
                          truncate
                          text-sm
                          text-slate-600
                        "
                        title={log.details}
                      >
                        {log.details || '—'}
                      </div>

                    </td>

                    {/* IP */}
                    <td className="py-4 px-5 whitespace-nowrap">

                      <span
                        className="
                          inline-flex
                          px-2
                          py-1
                          bg-slate-50
                          border border-slate-200
                          rounded-md
                          text-[11px]
                          font-mono
                          text-slate-500
                        "
                      >
                        {log.ipAddress || '127.0.0.1'}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
};
export default AdminActivityLogsPage;
