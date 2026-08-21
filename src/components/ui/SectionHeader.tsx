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
        <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.38em] text-oak-700">{eyebrow}</p>
      ) : null}
      <h2 className={cn('mb-4 font-display leading-[0.9] tracking-[-0.045em] text-bark', typography.section)}>{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-8 text-bark/70">{description}</p> : null}
    </div>
  );
}
