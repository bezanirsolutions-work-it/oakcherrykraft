import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  background?: 'default' | 'muted' | 'dark' | 'transparent';
  narrow?: boolean;
  fullWidth?: boolean;
}

const backgroundStyles = {
  default: 'bg-sand',
  muted: 'bg-surface',
  dark: 'bg-bark text-sand',
  transparent: 'bg-transparent',
} as const;

export function SectionContainer({
  children,
  className = '',
  background = 'default',
  narrow = false,
  fullWidth = false,
}: SectionContainerProps) {
  return (
    <section className={cn('relative', backgroundStyles[background], className)}>
      <div
        className={cn(
          'mx-auto px-6 py-16 sm:px-8 lg:px-10',
          fullWidth ? 'max-w-full' : narrow ? 'max-w-4xl' : 'max-w-7xl'
        )}
      >
        {children}
      </div>
    </section>
  );
}
