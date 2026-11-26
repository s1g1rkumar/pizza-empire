import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminUpdateSetting, fetchAdminConfig } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

export function AdminConfigPage() {
  const dispatch = useAppDispatch();
  const { config, acting, error } = useAppSelector((state) => state.admin);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    void dispatch(fetchAdminConfig());
  }, [dispatch]);

  const groups = ['ECONOMY', 'BUSINESS', 'EMPLOYEE', 'GAMEPLAY', 'MAINTENANCE'] as const;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Economy, Employee, Business & Game Settings
          </h1>
          <p className="text-xs text-slate-400">
            Configure live game economy values, multipliers, and maintenance toggles (ADMIN role
            required)
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {config &&
          groups.map((grp) => {
            const items = config.settings.filter((s) => s.settingGroup === grp);
            if (items.length === 0) return null;

            return (
              <div key={grp} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  {grp} Configuration
                </h2>
                <div className="space-y-3">
                  {items.map((s) => {
                    const val = drafts[s.settingKey] ?? s.settingValue;
                    return (
                      <div
                        key={s.settingKey}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{s.label}</p>
                          <p className="text-[11px] text-slate-400">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.valueType === 'BOOLEAN' ? (
                            <select
                              value={val}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [s.settingKey]: e.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [s.settingKey]: e.target.value,
                                }))
                              }
                              className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-emerald-400"
                            />
                          )}
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() =>
                              void dispatch(
                                adminUpdateSetting({
                                  settingKey: s.settingKey,
                                  settingValue: val,
                                })
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Apply
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </AdminLayout>
  );
}
