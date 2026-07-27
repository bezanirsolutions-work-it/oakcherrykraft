import { cn } from '../../lib/cn';
import { typography } from '../../theme/typography';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, className = '' }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-3xl', className)}>
      {eyebrow ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{eyebrow}</p>
      ) : null}
      <h2 className={cn('mb-4', typography.section, 'text-bark')}>{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-8 text-bark/70">{description}</p> : null}
    </div>
  );
}
