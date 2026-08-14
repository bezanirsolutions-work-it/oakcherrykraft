import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'surface' | 'glass' | 'elevated';
  style?: React.CSSProperties;
}

const variantStyles = {
  surface: 'bg-white border border-bark/10 shadow-soft',
  glass: 'bg-white/70 backdrop-blur-xl border border-white/60 shadow-soft',
  elevated: 'bg-white border border-bark/10 shadow-[0_24px_90px_rgba(45,33,27,0.16)]',
} as const;

export function Card({ children, className = '', variant = 'surface', style }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'h-full rounded-[2rem] p-6 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-medium focus-within:-translate-y-1 focus-within:shadow-medium sm:p-8',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
