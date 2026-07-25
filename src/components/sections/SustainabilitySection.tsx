import { type ReactNode } from 'react';

interface SustainabilitySectionProps {
  children?: ReactNode;
}

export function SustainabilitySection({ children }: SustainabilitySectionProps) {
  return (
    <section className="section-gap bg-surface">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
