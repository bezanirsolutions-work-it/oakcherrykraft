import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`mx-auto max-w-7xl px-3 py-10 sm:px-8 lg:px-10 ${className}`.trim()}>
      {children}
    </main>
  );
}
