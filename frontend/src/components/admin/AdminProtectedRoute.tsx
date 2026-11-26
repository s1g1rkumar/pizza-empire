import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const adminUser = useAppSelector((state) => state.admin.adminUser);

  if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MODERATOR')) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
