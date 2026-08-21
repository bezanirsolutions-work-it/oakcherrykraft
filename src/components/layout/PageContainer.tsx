import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`mx-auto max-w-[104rem] px-[clamp(1.25rem,3vw,3.5rem)] py-10 sm:py-12 lg:py-16 ${className}`.trim()}>
      {children}
    </main>
  );
}
