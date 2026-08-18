import { useEffect, useState, type ReactNode } from 'react';
import { SectionHeader } from '../ui';
import { Card } from '../ui';
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
              className="mb-8"
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {displayTestimonials.slice(0, 3).map((testimonial, index) => (
                <Card key={testimonial.id ?? `testimonial-${index}`} className="rounded-[1.75rem] border border-bark/10 bg-white p-8 shadow-soft">
                  <p className="text-sm tracking-[0.22em] text-clay" aria-label="Five stars">{Array.from({ length: testimonial.rating ?? 5 }).map(() => '★').join('')}</p>
                  <blockquote className="mt-5 font-display text-2xl leading-snug text-bark">"{testimonial.testimonial}"</blockquote>
                  <div className="mt-6 text-sm leading-7 text-bark/70">
                    <p className="font-semibold text-bark">{testimonial.name ?? 'Client'}</p>
                    {testimonial.company ? <p>{testimonial.company}</p> : null}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
