import { cn } from '../../lib/cn';

interface QuoteProps {
  quote: string;
  author?: string;
  className?: string;
}

export function Quote({ quote, author, className = '' }: QuoteProps) {
  return (
    <figure className={cn('rounded-[2rem] border border-bark/10 bg-surface p-8 text-bark shadow-soft', className)}>
      <blockquote className="text-2xl leading-[1.2] tracking-[-0.03em]">“{quote}”</blockquote>
      {author ? <figcaption className="mt-6 text-sm uppercase tracking-[0.35em] text-bark/60">— {author}</figcaption> : null}
    </figure>
  );
}
