import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import type { Testimonial } from '../../hooks/useTestimonials';
import { Card } from './Card';

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  initialIndex?: number;
  className?: string;
}

const SWIPE_OFFSET = 55;
const SWIPE_VELOCITY = 450;

export function TestimonialCarousel({ testimonials, initialIndex = 0, className }: TestimonialCarouselProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(testimonials.length - 1, 0)));
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth >= 1280 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount, { passive: true });
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(testimonials.length - visibleCount, 0)));
  }, [testimonials.length, visibleCount]);

  if (testimonials.length === 0) return null;

  const previous = () => setActiveIndex((current) => Math.max(current - 1, 0));
  const next = () => setActiveIndex((current) => Math.min(current + 1, Math.max(testimonials.length - visibleCount, 0)));
  const goTo = (index: number) => setActiveIndex(Math.min(index, Math.max(testimonials.length - visibleCount, 0)));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  return (
    <div
      className={cn('mx-auto w-full max-w-4xl', className)}
      role="region"
      aria-label="Client testimonials"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDownCapture={handleKeyDown}
    >
      <div className="relative overflow-hidden px-1 sm:px-12">
        <motion.div
          className="flex w-full cursor-grab active:cursor-grabbing"
          animate={{ x: `-${(activeIndex * 100) / testimonials.length}%` }}
          transition={reducedMotion ? { duration: 0.01 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          drag={visibleCount === 1 ? 'x' : false}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_event, info) => {
            if (info.offset.x <= -SWIPE_OFFSET || info.velocity.x <= -SWIPE_VELOCITY) next();
            if (info.offset.x >= SWIPE_OFFSET || info.velocity.x >= SWIPE_VELOCITY) previous();
          }}
        >
          {testimonials.map((testimonial, index) => {
            const firstName = testimonial.name.trim().split(/\s+/)[0] || 'Client';
            const isVisible = index >= activeIndex && index < activeIndex + visibleCount;
            return (
              <div
                key={testimonial.id ?? `testimonial-${index}`}
                className="shrink-0 px-1"
                style={{ flexBasis: `${100 / visibleCount}%` }}
                role="group"
                aria-roledescription="slide"
                aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
                aria-hidden={!isVisible}
              >
                <Card className={cn('relative min-h-[310px] rounded-[2rem] border border-bark/10 bg-white p-7 shadow-soft transition duration-300 sm:min-h-[300px] sm:p-8', index === activeIndex && 'shadow-medium')}>
                  <Quote className="absolute right-7 top-7 h-12 w-12 text-oak-100 sm:right-8 sm:top-8" aria-hidden="true" />
                  <div className="relative flex min-h-[250px] flex-col justify-between gap-8">
                    <div>
                      {testimonial.rating ? (
                        <p className="text-sm tracking-[0.22em] text-clay" aria-label={`${testimonial.rating} star rating`}>
                          {Array.from({ length: testimonial.rating }).map((_, starIndex) => <span key={starIndex}>★</span>)}
                        </p>
                      ) : null}
                      <blockquote className="mt-6 max-w-3xl font-display text-2xl leading-snug text-bark sm:text-[1.65rem]">
                        &ldquo;{testimonial.testimonial}&rdquo;
                      </blockquote>
                    </div>
                    <footer className="border-t border-bark/10 pt-5 text-sm leading-7 text-bark/70">
                      <cite className="not-italic"><span className="block font-semibold text-bark">{firstName}</span></cite>
                    </footer>
                  </div>
                </Card>
              </div>
            );
          })}
        </motion.div>

        <button
          type="button"
          onClick={previous}
          disabled={activeIndex === 0}
          aria-label="Previous testimonial"
          className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-soft transition hover:-translate-x-0.5 hover:border-bark/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
        >
          <ArrowLeft size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={activeIndex >= Math.max(testimonials.length - visibleCount, 0)}
          aria-label="Next testimonial"
          className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-soft transition hover:translate-x-0.5 hover:border-bark/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
        >
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" aria-label="Testimonial pagination">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id ?? `testimonial-${index}`}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to testimonial ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={cn(
              'h-2 rounded-full bg-bark/20 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200',
              index === activeIndex ? 'w-8 bg-oak-600' : 'w-2 hover:bg-bark/45'
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.25em] text-bark/45 sm:hidden">Swipe to explore</p>
    </div>
  );
}
