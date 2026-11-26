import {
  Activity,
  BarChart3,
  FileText,
  LogOut,
  Megaphone,
  ShieldCheck,
  Sliders,
  Sprout,
  Users,
} from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { adminLogout } from '@/features/admin/adminSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';

const ADMIN_NAV = [
  { label: 'Analytics', to: '/admin', icon: BarChart3, end: true },
  { label: 'Players & Progression', to: '/admin/players', icon: Users, end: false },
  { label: 'Crops, Products & Upgrades', to: '/admin/catalog', icon: Sprout, end: false },
  { label: 'Missions & Announcements', to: '/admin/liveops', icon: Megaphone, end: false },
  { label: 'Economy & Settings', to: '/admin/config', icon: Sliders, end: false },
  { label: 'Reports & Audit Logs', to: '/admin/reports', icon: FileText, end: false },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const adminUser = useAppSelector((state) => state.admin.adminUser);

  const handleLogout = () => {
    dispatch(adminLogout());
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-white">Empire Ops</p>
            <p className="text-[11px] font-semibold text-amber-400">INTERNAL ADMIN</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {ADMIN_NAV.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="truncate font-semibold text-slate-300">
              {adminUser?.username ?? 'Administrator'}
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              {adminUser?.role ?? 'ADMIN'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Pizza Empire Tycoon · LiveOps & Configuration Console</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 md:hidden">
            <span>{adminUser?.role}</span>
            <button type="button" onClick={handleLogout} className="font-bold text-amber-400">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
