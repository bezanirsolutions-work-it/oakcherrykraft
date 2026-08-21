import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: 'up' | 'left' | 'right' | 'fade';
  delay?: number;
  amount?: number;
}

const offsets = {
  up: { x: 0, y: 22 },
  left: { x: -22, y: 0 },
  right: { x: 22, y: 0 },
  fade: { x: 0, y: 0 },
} as const;

export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  amount = 0.18,
  ...props
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const offset = offsets[direction];

  return (
    <motion.div
      {...props}
      className={cn(className)}
      initial={reducedMotion ? false : { opacity: 0, ...offset }}
      whileInView={reducedMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={reducedMotion ? undefined : { duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
