import { useReducedMotion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface MarqueeProps {
  items: ReactNode[];
  direction?: 'left' | 'right';
  duration?: number;
  separator?: ReactNode;
  className?: string;
  trackClassName?: string;
}

export function Marquee({
  items,
  direction = 'left',
  duration = 28,
  separator = '•',
  className,
  trackClassName,
}: MarqueeProps) {
  const reducedMotion = useReducedMotion();
  const content = items.flatMap((item, index) => [
    <span key={`item-${index}`} className="shrink-0">{item}</span>,
    <span key={`separator-${index}`} aria-hidden="true" className="shrink-0 text-oak-600/65">{separator}</span>,
  ]);

  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className={cn('flex w-max min-w-full items-center whitespace-nowrap', !reducedMotion && 'marquee-track', trackClassName)}
        style={{
          '--marquee-duration': `${duration}s`,
          '--marquee-direction': direction === 'right' ? 'reverse' : 'normal',
        } as CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-6 sm:gap-8">{content}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-6 sm:gap-8">{content}</div>
      </div>
    </div>
  );
}
