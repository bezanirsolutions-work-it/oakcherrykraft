import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LoadingState } from '../ui/LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAdmin, isLoading, error } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState title="Loading dashboard" description="Initializing your admin session." />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="inline-flex w-full flex-col gap-4 rounded-[2rem] border border-bark/10 bg-white p-10 text-left shadow-soft">
          <h2 className="text-3xl font-semibold text-bark">Access check failed</h2>
          <p className="text-sm leading-7 text-bark/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
