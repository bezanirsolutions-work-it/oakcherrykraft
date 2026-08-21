import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface RevealTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  mode?: 'lines' | 'words';
  delay?: number;
}

const lineBreak = /\n/;
const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
};

export function RevealText({
  children,
  className,
  as = 'h2',
  mode = 'lines',
  delay = 0,
}: RevealTextProps) {
  const reducedMotion = useReducedMotion();
  const Tag = motionTags[as];
  const parts = mode === 'lines' ? children.split(lineBreak) : children.split(/\s+/);

  return (
    <Tag
      className={cn(className)}
      initial={reducedMotion ? false : 'hidden'}
      whileInView={reducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: mode === 'words' ? 0.035 : 0.08, delayChildren: delay } },
      }}
    >
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className={cn('inline-block overflow-hidden', mode === 'lines' && 'w-full')}>
          <motion.span
            className="inline-block"
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {part}{mode === 'words' && index < parts.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
