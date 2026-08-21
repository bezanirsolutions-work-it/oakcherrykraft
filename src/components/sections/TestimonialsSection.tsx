import { useState, type ReactNode } from 'react';
import { SectionHeader, TestimonialCarousel } from '../ui';
import { useTestimonials } from '../../hooks/useTestimonials';
import type { Testimonial } from '../../hooks/useTestimonials';

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Chika Okonkwo',
    role: null,
    company: 'Okonkwo Design Studio',
    photo_url: null,
    testimonial: 'The quality and attention to detail in our bespoke dining table is unmatched. It\'s become the heart of our studio.',
    rating: 5,
    featured: true,
    display_order: 1,
    created_at: null,
  },
  {
    id: '2',
    name: 'Amara Ejiofor',
    role: null,
    company: 'Ejiofor Interiors',
    photo_url: null,
    testimonial: 'Working with Oak Cherry Kraft transformed our client\'s vision into reality. Truly exceptional craftsmanship.',
    rating: 5,
    featured: true,
    display_order: 2,
    created_at: null,
  },
  {
    id: '3',
    name: 'Tunde Adeyemi',
    role: null,
    company: 'Adeyemi Homes',
    photo_url: null,
    testimonial: 'Every piece is a masterpiece. Our clients consistently comment on the quality and beauty of the furniture.',
    rating: 5,
    featured: true,
    display_order: 3,
    created_at: null,
  },
];

interface TestimonialsSectionProps {
  children?: ReactNode;
}

export function TestimonialsSection({ children }: TestimonialsSectionProps) {
  const { testimonials: loadedTestimonials, loading: isTestimonialsLoading } = useTestimonials();

  const displayTestimonials = isTestimonialsLoading ? testimonials : loadedTestimonials.length > 0 ? loadedTestimonials : testimonials;

  return (
    <section className="section-gap">
      <div className="container-wide">
        {children ? (
          children
        ) : (
          <>
            <SectionHeader
              eyebrow="Client stories"
              title="The details people remember."
              description="Our work is measured not only in finish and form, but in how beautifully it becomes part of everyday life."
              className="mx-auto mb-8 max-w-4xl text-center [&_p:last-child]:max-w-none sm:[&_p:last-child]:whitespace-nowrap"
            />
            <TestimonialCarousel testimonials={displayTestimonials.slice(0, 5)} />
          </>
        )}
      </div>
    </section>
  );
}
