import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface TagProps {
  children: ReactNode;
  className?: string;
  variant?: 'neutral' | 'highlight';
}

const styles = {
  neutral: 'bg-surface text-bark border border-bark/10',
  highlight: 'bg-oak-100 text-oak-800 border border-oak-200',
} as const;

export function Tag({ children, className = '', variant = 'neutral' }: TagProps) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1.5 text-sm font-medium', styles[variant], className)}>
      {children}
    </span>
  );
}
