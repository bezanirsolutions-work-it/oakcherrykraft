import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface IconBoxProps {
  icon: ReactNode;
  className?: string;
  variant?: 'soft' | 'contrast';
}

const styles = {
  soft: 'bg-bark/5 text-bark',
  contrast: 'bg-bark text-sand',
} as const;

export function IconBox({ icon, className = '', variant = 'soft' }: IconBoxProps) {
  return (
    <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]', styles[variant], className)}>
      {icon}
    </span>
  );
}
