import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ChipProps {
  children: ReactNode;
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost';
}

const styles = {
  solid: 'bg-bark text-sand',
  outline: 'border border-bark/10 bg-transparent text-bark',
  ghost: 'bg-white/80 text-bark',
} as const;

export function Chip({ children, className = '', variant = 'solid' }: ChipProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium', styles[variant], className)}>
      {children}
    </span>
  );
}
