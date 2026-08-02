import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { getProfileRole } from './profile';

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async (sessionOverride?: { user?: { id?: string } } | null) => {
      try {
        const sessionResponse = await supabase.auth.getSession();
        const session = sessionOverride ?? sessionResponse.data.session;
        const authError = sessionOverride ? null : sessionResponse.error;

        if (!mounted) return;

        const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
        if (!isAdminRoute) {
          setIsAdmin(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        if (authError || !session?.user?.id) {
          setIsAdmin(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        const sessionUser = session.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } };
        const metadataRole = sessionUser.user_metadata?.role ?? sessionUser.app_metadata?.role;
        if (metadataRole) {
          if (!mounted) return;
          setIsAdmin(metadataRole === 'admin');
          setError(null);
          setIsLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!mounted) return;

        if (userError || !userData.user?.id) {
          setIsAdmin(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        try {
          const role = await getProfileRole(userData.user.id);
          const resolvedRole = role ?? (userData.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } }).user_metadata?.role ?? (userData.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } }).app_metadata?.role;
          if (!mounted) return;
          setIsAdmin(resolvedRole === 'admin');
        } catch {
          if (!mounted) return;
          setIsAdmin(false);
        }
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void checkAdminStatus(session);
    });

    void checkAdminStatus();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
