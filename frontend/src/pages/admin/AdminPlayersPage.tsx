import { Save, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  adminUpdatePlayerAccount,
  adminUpdatePlayerProgression,
  fetchAdminPlayers,
} from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { AdminPlayerRow } from '@/types/admin.types';

export function AdminPlayersPage() {
  const dispatch = useAppDispatch();
  const { players, acting, error } = useAppSelector((state) => state.admin);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [drafts, setDrafts] = useState<Record<number, Partial<AdminPlayerRow>>>({});

  useEffect(() => {
    void dispatch(fetchAdminPlayers({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const setDraft = (userId: number, patch: Partial<AdminPlayerRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], ...patch },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Player & Progression Management</h1>
            <p className="text-xs text-slate-400">
              Manage player accounts, roles, balances, XP levels, and business stages (all changes
              are audited)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or email..."
                className="rounded-xl border border-slate-700 bg-slate-900 py-2 pl-8 pr-3 text-xs text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="BANNED">BANNED</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-3">User</th>
                <th className="p-3">Role / Status</th>
                <th className="p-3">Cash / Gems</th>
                <th className="p-3">Stage / XP Level</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {players.map((p) => {
                const d = drafts[p.userId] ?? {};
                const statusVal = d.status ?? p.status;
                const roleVal = d.role ?? p.role;
                const cashVal = Number(d.cashBalance ?? p.cashBalance ?? 0);
                const gemsVal = Number(d.gemsBalance ?? p.gemsBalance ?? 0);
                const xpLevelVal = Number(d.xpLevel ?? p.xpLevel ?? 1);
                const stageVal = Number(d.stageNumber ?? p.stageNumber ?? 1);

                return (
                  <tr key={p.userId}>
                    <td className="p-3">
                      <p className="font-bold text-white">{p.username}</p>
                      <p className="text-[11px] text-slate-400">{p.email}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <select
                          value={roleVal}
                          onChange={(e) =>
                            setDraft(p.userId, {
                              role: e.target.value as AdminPlayerRow['role'],
                            })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <select
                          value={statusVal}
                          onChange={(e) =>
                            setDraft(p.userId, {
                              status: e.target.value as AdminPlayerRow['status'],
                            })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-white"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="BANNED">BANNED</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={cashVal}
                          onChange={(e) =>
                            setDraft(p.userId, { cashBalance: Number(e.target.value) })
                          }
                          className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-emerald-400"
                        />
                        <input
                          type="number"
                          value={gemsVal}
                          onChange={(e) =>
                            setDraft(p.userId, { gemsBalance: Number(e.target.value) })
                          }
                          className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-amber-400"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      {p.playerId ? (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400">
                            Stage (1-8):
                            <input
                              type="number"
                              min={1}
                              max={8}
                              value={stageVal}
                              onChange={(e) =>
                                setDraft(p.userId, { stageNumber: Number(e.target.value) })
                              }
                              className="ml-1.5 w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[11px] text-white"
                            />
                          </label>
                          <label className="text-[10px] text-slate-400">
                            XP Lv:
                            <input
                              type="number"
                              min={1}
                              value={xpLevelVal}
                              onChange={(e) =>
                                setDraft(p.userId, { xpLevel: Number(e.target.value) })
                              }
                              className="ml-1.5 w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[11px] text-white"
                            />
                          </label>
                        </div>
                      ) : (
                        <span className="text-slate-500">No profile</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdatePlayerAccount({
                                userId: p.userId,
                                status: statusVal,
                                role: roleVal,
                                cashBalance: cashVal,
                                gemsBalance: gemsVal,
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />
                          Save Account
                        </button>
                        {p.playerId && (
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              void dispatch(
                                adminUpdatePlayerProgression({
                                  playerId: p.playerId!,
                                  xpLevel: xpLevelVal,
                                  stageNumber: stageVal,
                                })
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" />
                            Save Stage
                          </button>
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
    </AdminLayout>
  );
}
