import { type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <HelmetProvider>{children}</HelmetProvider>;
}
