import { motion, useScroll, useTransform } from 'framer-motion';
import { Award, Clock3, Leaf, Sparkles } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../base/Button';

const stats = [
  { value: '250+', label: 'Completed projects', Icon: Award },
  { value: '180+', label: 'Happy clients', Icon: Leaf },
  { value: '15+', label: 'Master craftsmen', Icon: Clock3 },
  { value: '12+', label: 'States served', Icon: Sparkles },
];

interface HeroSectionProps {
  children?: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-sand py-14 text-bark sm:py-20 lg:py-28">
      <div className="hero-wood-texture absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="container-wide relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div className="space-y-7">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="inline-flex rounded-full border border-bark/10 bg-white/85 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-bark/75 shadow-sm"
          >
            Crafted furniture, considered living
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="space-y-6"
          >
            {children ? (
              <div className="max-w-2xl">{children}</div>
            ) : (
              <>
                <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Oak, cherry & enduring form</p>
                <h1 className="font-display text-[clamp(2.75rem,4vw,4.5rem)] font-semibold leading-tight tracking-[-0.03em] text-bark">
                  Timeless furniture shaped by craft, material, and calm luxury.
                </h1>
              </>
            )}
          </motion.div>

          {children ? null : (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: 'easeOut' }}
              className="max-w-2xl text-base leading-8 text-bark/75 sm:text-lg"
            >
              Transform your home, office, or commercial space with bespoke furniture designed by master craftsmen. Every piece combines timeless elegance, premium craftsmanship, and lasting durability.
            </motion.p>
          )}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <Button size="sm" asChild className="w-full sm:w-auto">
                <Link to="/products">Explore collection</Link>
              </Button>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                <Link to="/quote">Request a quote</Link>
              </Button>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4" aria-label="Oak Cherry Kraft achievements">
            {stats.map(({ Icon, value, label }, index) => (
              <motion.article
                key={label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 + index * 0.08, ease: 'easeOut' }}
                className="flex h-full flex-col rounded-[1.5rem] border border-bark/10 bg-white/90 p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-medium sm:rounded-[2rem] sm:p-4"
              >
                <div className="flex flex-shrink-0 items-start gap-2">
                  <span className="icon-surface shrink-0 bg-bark/5 text-bark">
                    <Icon size={16} aria-hidden="true" className="sm:size-[18px]" />
                  </span>
                  <p className="min-w-0 flex-1 text-[0.625rem] leading-3 tracking-[0.1em] text-bark/60 sm:text-xs sm:leading-4 sm:tracking-[0.15em]">{label}</p>
                </div>
                <p className="mt-2 truncate text-xl font-bold tracking-tight text-bark sm:mt-3 sm:text-2xl">{value}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          style={{ y: imageY }}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="group relative mx-auto w-full max-w-xl overflow-hidden rounded-[2.25rem] border border-bark/10 bg-white/90 shadow-elevated"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/60 via-transparent to-transparent opacity-90" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2.25rem]">
            <img
              src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85"
              alt="Elegant living room with handcrafted wood furniture"
              className="h-[360px] w-full object-cover transition duration-700 ease-brand group-hover:scale-[1.01] sm:h-[440px] lg:h-[520px]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bark/20 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute bottom-4 left-4 right-4 rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-6 sm:p-5">
              <p className="text-xs uppercase tracking-[0.32em] text-bark/50">Studio selection</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-bark">Oak dining table with sculpted, hand-finished curves.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
