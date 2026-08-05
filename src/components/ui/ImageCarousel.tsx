import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { getSafeImageSrc } from '../../lib/imageUtils';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const displayImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [displayImages]);

  if (displayImages.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
  const next = () => setIndex((i) => (i + 1) % displayImages.length);

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-surface-strong', className)}>
      <div className="relative h-full w-full">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={index}
            src={getSafeImageSrc(displayImages[index] ?? null)}
            alt={`${alt} ${index + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = getSafeImageSrc(null);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <button onClick={prev} aria-label="Previous image" className="absolute left-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-bark shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-600">
          <ChevronLeft size={20} />
        </button>

        <button onClick={next} aria-label="Next image" className="absolute right-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-bark shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-600">
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {displayImages.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Go to image ${i + 1}`} aria-current={i === index ? 'true' : 'false'} className={cn('h-2 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80')} />
          ))}
        </div>
      </div>
    </div>
  );
}
