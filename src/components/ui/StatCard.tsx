import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'muted';
}

export function StatCard({
  icon,
  value,
  label,
  description,
  className = '',
  variant = 'default',
}: StatCardProps) {
  return (
    <article
      className={cn(
        'group rounded-[2rem] border p-6 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-medium',
        variant === 'muted' ? 'border-bark/10 bg-sand' : 'border-bark/10 bg-white',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-bark/5 text-bark transition group-hover:bg-bark/10">
          {icon}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-bark/90">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-bark">{value}</p>
        </div>
      </div>
      {description ? <p className="mt-4 text-sm leading-7 text-bark/90">{description}</p> : null}
    </article>
  );
}
