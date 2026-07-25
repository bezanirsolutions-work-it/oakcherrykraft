import { type ReactNode } from 'react';

interface BrandIntroductionSectionProps {
  children?: ReactNode;
}

export function BrandIntroductionSection({ children }: BrandIntroductionSectionProps) {
  return (
    <section className="section-gap section-gap-sm bg-surface">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
