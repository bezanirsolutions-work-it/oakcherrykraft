import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'neutral';
}

const styles = {
  primary: 'bg-oak-600 text-sand',
  secondary: 'bg-bark text-sand',
  neutral: 'bg-surface text-bark',
} as const;

export function Badge({ children, className = '', variant = 'neutral' }: BadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em]', styles[variant], className)}>
      {children}
    </span>
  );
}
