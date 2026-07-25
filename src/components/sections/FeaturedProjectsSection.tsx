import { type ReactNode } from 'react';

interface FeaturedProjectsSectionProps {
  children?: ReactNode;
}

export function FeaturedProjectsSection({ children }: FeaturedProjectsSectionProps) {
  return (
    <section className="section-gap">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
