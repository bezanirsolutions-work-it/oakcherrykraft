import { type ReactNode } from 'react';

interface TestimonialsSectionProps {
  children?: ReactNode;
}

export function TestimonialsSection({ children }: TestimonialsSectionProps) {
  return (
    <section className="section-gap">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
