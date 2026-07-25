import { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={cn('rounded-[2rem] border border-bark/10 bg-white p-10 text-center shadow-soft', className)}>
      <p className="mb-3 text-sm uppercase tracking-[0.32em] text-oak-700">Nothing found</p>
      <h2 className="text-3xl font-semibold text-bark">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-bark/70">{description}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
