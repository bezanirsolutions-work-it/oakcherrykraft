import { type ReactNode } from 'react';

interface CallToActionSectionProps {
  children?: ReactNode;
}

export function CallToActionSection({ children }: CallToActionSectionProps) {
  return (
    <section className="section-gap section-gap-sm bg-bark text-sand">
      <div className="container-narrow">
        {children}
      </div>
    </section>
  );
}
