import { Pizza, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

export function Navbar() {
  const { isAuthenticated, profile } = useAppSelector((state) => state.auth);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-lg font-bold text-amber-400">
          <Pizza className="h-6 w-6" />
          <span>Pizza Empire Tycoon</span>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-amber-500/50"
              >
                <User className="h-4 w-4 text-amber-400" />
                <span>{profile.displayName}</span>
                <span className="text-emerald-400">${Number(profile.cashBalance).toFixed(0)}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
              >
                Play Free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
