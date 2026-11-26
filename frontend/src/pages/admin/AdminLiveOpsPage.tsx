import { Megaphone, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  adminCreateAnnouncement,
  adminToggleAnnouncement,
  adminUpdateAchievement,
  adminUpdateMission,
  fetchAdminConfig,
} from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

type LiveOpsTab = 'missions' | 'achievements' | 'announcements';

export function AdminLiveOpsPage() {
  const dispatch = useAppDispatch();
  const { config, acting, error } = useAppSelector((state) => state.admin);
  const [tab, setTab] = useState<LiveOpsTab>('missions');
  const [drafts, setDrafts] = useState<Record<string, Record<string, number | boolean>>>({});

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE'>('EVENT');

  useEffect(() => {
    void dispatch(fetchAdminConfig());
  }, [dispatch]);

  const getVal = <T extends number | boolean>(key: string, field: string, fallback: T): T =>
    ((drafts[key]?.[field] as T | undefined) ?? fallback) as T;

  const setVal = (key: string, field: string, value: number | boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    void dispatch(adminCreateAnnouncement({ title, message, severity }));
    setTitle('');
    setMessage('');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Missions, Achievements & Announcements
            </h1>
            <p className="text-xs text-slate-400">
              Adjust mission/achievement targets and rewards, or broadcast global game announcements
            </p>
          </div>
          <div className="flex gap-2">
            {(['missions', 'achievements', 'announcements'] as LiveOpsTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize ${
                  tab === t
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {config && tab === 'missions' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Mission</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Cash Reward</th>
                  <th className="p-3">XP Reward</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.missions.map((m) => {
                  const k = `mis_${m.id}`;
                  return (
                    <tr key={m.id}>
                      <td className="p-3">
                        <p className="font-bold text-white">{m.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {m.missionType} · {m.targetMetric}
                        </p>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'targetValue', Number(m.targetValue))}
                          onChange={(e) => setVal(k, 'targetValue', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'rewardCash', Number(m.rewardCash))}
                          onChange={(e) => setVal(k, 'rewardCash', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'rewardXp', Number(m.rewardXp))}
                          onChange={(e) => setVal(k, 'rewardXp', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-amber-400"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateMission({
                                missionId: m.id,
                                targetValue: getVal(k, 'targetValue', Number(m.targetValue)),
                                rewardCash: getVal(k, 'rewardCash', Number(m.rewardCash)),
                                rewardXp: getVal(k, 'rewardXp', Number(m.rewardXp)),
                                rewardGems: Number(m.rewardGems),
                                isActive: Boolean(m.isActive),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {config && tab === 'achievements' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">Achievement</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Cash Reward</th>
                  <th className="p-3">Gems</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {config.achievements.map((a) => {
                  const k = `ach_${a.id}`;
                  return (
                    <tr key={a.id}>
                      <td className="p-3">
                        <p className="font-bold text-white">{a.title}</p>
                        <p className="text-[10px] text-slate-400">{a.targetMetric}</p>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'targetValue', Number(a.targetValue))}
                          onChange={(e) => setVal(k, 'targetValue', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'rewardCash', Number(a.rewardCash))}
                          onChange={(e) => setVal(k, 'rewardCash', Number(e.target.value))}
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-emerald-400"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={getVal(k, 'rewardGems', Number(a.rewardGems))}
                          onChange={(e) => setVal(k, 'rewardGems', Number(e.target.value))}
                          className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-amber-400"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() =>
                            void dispatch(
                              adminUpdateAchievement({
                                achievementId: a.id,
                                targetValue: getVal(k, 'targetValue', Number(a.targetValue)),
                                rewardCash: getVal(k, 'rewardCash', Number(a.rewardCash)),
                                rewardXp: Number(a.rewardXp),
                                rewardGems: getVal(k, 'rewardGems', Number(a.rewardGems)),
                                isActive: Boolean(a.isActive),
                              })
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {config && tab === 'announcements' && (
          <div className="space-y-6">
            <form
              onSubmit={handlePublish}
              className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
                <Megaphone className="h-4 w-4 text-amber-400" />
                Publish Global Announcement
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement Title"
                  className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as 'INFO' | 'WARNING' | 'EVENT' | 'MAINTENANCE')
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="EVENT">EVENT</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write announcement message for all players..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                disabled={acting}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
              >
                Publish Announcement
              </button>
            </form>

            <div className="space-y-2.5">
              {config.announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {a.title}{' '}
                      <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-amber-400">
                        {a.severity}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{a.message}</p>
                  </div>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      void dispatch(
                        adminToggleAnnouncement({
                          announcementId: a.id,
                          isActive: !a.isActive,
                        })
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      a.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {a.isActive ? 'Active' : 'Archived'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
