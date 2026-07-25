import { type ReactNode } from 'react';

interface CraftsmanshipProcessSectionProps {
  children?: ReactNode;
}

export function CraftsmanshipProcessSection({ children }: CraftsmanshipProcessSectionProps) {
  return (
    <section className="section-gap section-gap-lg bg-surface">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
