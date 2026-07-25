import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingState } from '../ui/LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
}

type Status = 'loading' | 'authorized' | 'unauthenticated' | 'error';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const verifyUser = async () => {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (authError || !session?.user?.id) {
        setStatus('unauthenticated');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }

      if (!data || data.role !== 'admin') {
        setStatus('unauthenticated');
        return;
      }

      setStatus('authorized');
    };

    verifyUser();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'loading') {
    return <LoadingState title="Checking admin access" description="Verifying your session before loading the dashboard." />;
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="inline-flex w-full flex-col gap-4 rounded-[2rem] border border-bark/10 bg-white p-10 text-left shadow-soft">
          <h2 className="text-3xl font-semibold text-bark">Access check failed</h2>
          <p className="text-sm leading-7 text-bark/70">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
