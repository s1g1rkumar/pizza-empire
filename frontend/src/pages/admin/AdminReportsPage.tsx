import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { fetchAdminReports } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function AdminReportsPage() {
  const dispatch = useAppDispatch();
  const { reports, loading } = useAppSelector((state) => state.admin);
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    void dispatch(fetchAdminReports());
  }, [dispatch]);

  const filteredLogs = (reports?.auditLogs ?? []).filter(
    (log) => actionFilter === 'ALL' || log.actionType === actionFilter
  );

  const actionTypes = Array.from(new Set((reports?.auditLogs ?? []).map((l) => l.actionType)));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Reports & Admin Audit Logs</h1>
            <p className="text-xs text-slate-400">
              Immutable audit trail of all administrative actions, economy volume breakdown, and top
              empires
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dispatch(fetchAdminReports())}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Reports
          </button>
        </div>

        {reports && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-3 text-sm font-extrabold text-white">
                  Economy Volume by Category
                </h2>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">Type</th>
                        <th className="py-2">Category</th>
                        <th className="py-2">Tx Count</th>
                        <th className="py-2">Total Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {reports.economyByCategory.map((row, idx) => (
                        <tr key={`${row.transactionType}_${row.category}_${idx}`}>
                          <td className="py-2 text-slate-300">{row.transactionType}</td>
                          <td className="py-2 font-bold text-white">{row.category}</td>
                          <td className="py-2 text-slate-400">{row.txCount}</td>
                          <td className="py-2 font-bold text-emerald-400">
                            ${Number(row.totalAmount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-3 text-sm font-extrabold text-white">Top 20 Player Empires</h2>
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2">Player</th>
                        <th className="py-2">Stage</th>
                        <th className="py-2">Cash</th>
                        <th className="py-2">Net Worth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {reports.topPlayers.map((tp) => (
                        <tr key={tp.playerId}>
                          <td className="py-2 font-bold text-white">{tp.displayName}</td>
                          <td className="py-2 text-slate-400">{tp.stageName ?? '-'}</td>
                          <td className="py-2 text-emerald-400">
                            ${Number(tp.cashBalance).toLocaleString()}
                          </td>
                          <td className="py-2 font-bold text-amber-400">
                            ${Number(tp.netWorth).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-white">Administrative Audit Trail</h2>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                >
                  <option value="ALL">All Actions</option>
                  {actionTypes.map((at) => (
                    <option key={at} value={at}>
                      {at}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3">Timestamp</th>
                      <th className="py-2 pr-3">Admin</th>
                      <th className="py-2 pr-3">Action</th>
                      <th className="py-2 pr-3">Target Player</th>
                      <th className="py-2">After State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 pr-3 text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 font-bold text-white">{log.actorUsername}</td>
                        <td className="py-2 pr-3">
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-400">{log.targetPlayerId ?? '-'}</td>
                        <td className="max-w-xs truncate py-2 font-mono text-[11px] text-slate-300">
                          {log.afterState ? JSON.stringify(log.afterState) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
