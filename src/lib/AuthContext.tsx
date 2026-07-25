import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

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

    const checkAdminStatus = async () => {
      try {
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (authError || !session?.user?.id) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (!mounted) return;

        if (profileError) {
          console.error(profileError);
          setError(profileError.message);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        setIsAdmin(data?.role === 'admin');
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

    checkAdminStatus();

    return () => {
      mounted = false;
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
