import { type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../../lib/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <HelmetProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </HelmetProvider>
  );
}
