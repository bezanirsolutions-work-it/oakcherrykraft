import { type ReactNode } from 'react';

interface FeaturedCollectionsSectionProps {
  children?: ReactNode;
}

export function FeaturedCollectionsSection({ children }: FeaturedCollectionsSectionProps) {
  return (
    <section className="section-gap">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
