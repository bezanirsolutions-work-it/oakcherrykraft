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
        const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
        const authError = sessionOverride ? null : (await supabase.auth.getSession()).error;

        if (!mounted) return;

        if (authError || !session?.user?.id) {
          setIsAdmin(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        try {
          const role = await getProfileRole(session.user.id);
          const resolvedRole = role ?? (session.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } }).user_metadata?.role ?? (session.user as { user_metadata?: { role?: string }; app_metadata?: { role?: string } }).app_metadata?.role;
          if (!mounted) return;
          setIsAdmin(resolvedRole === 'admin');
        } catch (profileError) {
          console.error(profileError);
          if (!mounted) return;
          setError(profileError instanceof Error ? profileError.message : 'Unable to verify admin profile.');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (mounted) {
          console.error(err);
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
