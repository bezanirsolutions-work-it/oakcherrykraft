import { ReactNode } from 'react';
import { typography } from '../../theme/typography';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  inverse?: boolean;
  level?: 1 | 2;
  children?: ReactNode;
}

export function SectionTitle({ eyebrow, title, description, className = '', inverse = false, level = 2, children }: SectionTitleProps) {
  const textColor = inverse ? 'text-sand' : 'text-bark';
  const mutedColor = inverse ? 'text-sand/75' : 'text-bark/80';
  const eyebrowColor = inverse ? 'text-sand/65' : 'text-oak-700';
  const Heading = level === 1 ? 'h1' : 'h2';

  return (
    <div className={`max-w-3xl ${textColor} ${className}`.trim()}>
      {eyebrow ? <p className={`mb-3 ${typography.eyebrow} ${eyebrowColor}`}>{eyebrow}</p> : null}
      <Heading className={`mb-4 ${typography.section} ${textColor}`}>{title}</Heading>
      {description ? <p className={`${typography.paragraph} ${mutedColor}`}>{description}</p> : null}
      {children}
    </div>
  );
}
