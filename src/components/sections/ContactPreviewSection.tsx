import { type ReactNode } from 'react';

interface ContactPreviewSectionProps {
  children?: ReactNode;
}

export function ContactPreviewSection({ children }: ContactPreviewSectionProps) {
  return (
    <section className="section-gap bg-surface">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
