import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const displayImages = useMemo(() => images.filter(Boolean), [images]);

  useEffect(() => {
    setCurrentIndex(0);
    setDirection(0);
    setImageSrc(getSafeImageSrc(displayImages[0] ?? null));
  }, [displayImages]);

  if (displayImages.length === 0) {
    return null;
  }

  if (displayImages.length === 1) {
    return (
      <div className={cn('overflow-hidden rounded-[1.5rem] bg-surface-strong', className)}>
        <img
          src={imageSrc ?? getSafeImageSrc(displayImages[0] ?? null)}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setImageSrc(getSafeImageSrc(null))}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + displayImages.length) % displayImages.length);
  };

  useEffect(() => {
    setImageSrc(getSafeImageSrc(displayImages[currentIndex] ?? null));
  }, [currentIndex, displayImages]);

  const handlePrev = () => paginate(-1);
  const handleNext = () => paginate(1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!startXRef.current) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startXRef.current;
    const deltaY = endY - startYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    startXRef.current = 0;
    startYRef.current = 0;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!startXRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    startXRef.current = 0;
    startYRef.current = 0;
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    }
    if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-surface-strong', className)}>
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab select-none active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        role="group"
        tabIndex={0}
        aria-label={`Image carousel, showing ${currentIndex + 1} of ${displayImages.length}`}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentIndex}
            src={imageSrc ?? getSafeImageSrc(displayImages[currentIndex] ?? null)}
            alt={`${alt} ${currentIndex + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            loading="lazy"
            decoding="async"
            onError={() => setImageSrc(getSafeImageSrc(null))}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Previous Button */}
        <button
          onClick={handlePrev}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-bark shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-600"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          aria-label="Next image"
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-bark shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-oak-600"
        >
          <ChevronRight size={20} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
