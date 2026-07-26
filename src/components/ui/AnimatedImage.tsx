import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { imageReveal } from '../../lib/animations';

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
  priority?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
}

export function AnimatedImage({
  src,
  alt,
  className = '',
  overlay = false,
  priority = false,
  aspectRatio,
  objectFit = 'cover',
}: AnimatedImageProps) {
  return (
    <motion.div
      variants={imageReveal}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={cn(
        'group relative overflow-hidden rounded-[2.25rem] border border-bark/10 bg-white shadow-soft',
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={cn(
          'h-full w-full transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
          objectFit === 'contain' ? 'object-contain' : 'object-cover',
          overlay ? 'group-hover:scale-[1.01]' : ''
        )}
      />
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-bark/25 via-transparent to-transparent" aria-hidden="true" />
      ) : null}
    </motion.div>
  );
}
