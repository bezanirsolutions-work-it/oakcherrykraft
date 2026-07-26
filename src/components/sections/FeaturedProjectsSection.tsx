import { type ReactNode } from 'react';

interface FeaturedProjectsSectionProps {
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sectionSizeClass = {
  sm: 'section-gap-sm',
  md: 'section-gap',
  lg: 'section-gap-lg',
};

export function FeaturedProjectsSection({ children, size = 'md' }: FeaturedProjectsSectionProps) {
  return (
    <section className={sectionSizeClass[size]}>
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
