import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Restoring empire session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
