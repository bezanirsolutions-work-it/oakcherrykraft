import { motion } from 'framer-motion';
import { useRef, type ReactNode, useCallback } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../base/Button';

interface HeroSectionProps {
  children?: ReactNode;
}

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.14 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easing } },
};

export function HeroSection({ children }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement | null>(null);

  const handleScrollClick = useCallback(() => {
    const target = document.getElementById('explore-collection');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const el = heroRef.current?.nextElementSibling as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden text-[#2E241C] px-4 sm:px-[60px]"
      style={{
        minHeight: '95vh',
        backgroundColor: '#F8F4EE',
        backgroundImage: "url('/assets/hero/GENERATED.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-y-0 z-0 h-full hero-bg"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: 1, x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          left: '0%',
          right: '0%',
          top: '0%',
          bottom: '0%',
          width: '100%',
          backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.28) 100%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.16), transparent 30%)",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          maskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 10%, rgba(0,0,0,0.7) 38%, rgba(0,0,0,1) 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 10%, rgba(0,0,0,0.7) 38%, rgba(0,0,0,1) 100%)',
          filter: 'drop-shadow(0 32px 88px rgba(0,0,0,0.18))',
        }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[12%] mx-auto h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(215,190,150,0.18),_transparent_70%)] opacity-90 blur-3xl" aria-hidden="true" />
      </div>

      <div className="mx-auto grid max-w-[1400px] min-h-[95vh] items-center gap-6 lg:grid-cols-[0.45fr_0.55fr] py-12 sm:py-24">
        <div className="px-4 sm:px-0">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={containerVariants} className="relative z-10 mx-auto max-w-[100%] sm:max-w-[500px] rounded-[20px] bg-[rgba(248,244,238,0.55)] backdrop-blur-sm p-6 sm:p-10 md:p-12">
            <motion.div variants={item} className="inline-flex items-center gap-4">
              <span className="inline-block h-px w-16 bg-[#b98b3b] opacity-90" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.32em] text-[#8d6a45] font-semibold">HANDCRAFTED IN NIGERIA</span>
            </motion.div>

            <motion.h1 variants={item} className="mt-8 max-w-[500px] text-[3.8rem] leading-[1.02] font-serif tracking-[-0.03em] text-[#241B16] sm:text-[4.75rem] md:text-[5.5rem] lg:text-[6rem]">
              <div>Bespoke Furniture</div>
              <div>Crafted for</div>
              <div>Timeless Living</div>
            </motion.h1>

            <motion.p variants={item} className="mt-14 max-w-[500px] text-lg font-medium leading-[1.8] text-[#4B4038]">
              Every Oak Cherry Kraft piece is thoughtfully designed and handcrafted using premium hardwoods to complement your home or workspace.
            </motion.p>

            <motion.div variants={item} className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-center">
              <motion.div whileHover={{ y: -2 }} className="w-full sm:w-auto">
                <Button asChild className="w-full sm:w-auto rounded-full bg-[#2E241C] px-8 py-4 text-sm font-semibold text-[#F8F4EE] shadow-lg shadow-[#00000014] transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <Link to="/request-quote" className="inline-flex items-center gap-3">
                    Design Your Furniture
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="w-full sm:w-auto">
                <Button variant="ghost" asChild className="w-full sm:w-auto rounded-full border border-[#2E241C] bg-white px-8 py-4 text-sm font-semibold text-[#2E241C] transition duration-300 hover:-translate-y-1 hover:bg-[#f7f1ec]">
                  <Link to="/products">Explore Collection →</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div variants={item} className="mt-16 grid gap-4 rounded-[22px] border border-[#d9c3a6]/70 bg-[rgba(255,250,244,0.88)] p-5 shadow-[0_16px_45px_rgba(46,36,28,0.08)] backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 xl:gap-5">
            {[
              { title: 'Crafted to Order', subtitle: 'Made just for you' },
              { title: 'Premium Hardwoods', subtitle: 'Sustainably sourced' },
              { title: 'Residential & Commercial', subtitle: 'Premium projects' },
              { title: 'Designed & Built', subtitle: 'Proudly in Nigeria' },
            ].map((itemData) => (
              <div key={itemData.title} className="flex min-w-[0] items-start gap-3 rounded-[16px] border border-[#e8d7bd] bg-white/80 p-3 shadow-sm">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#b98b3b] bg-[#f8efe2] text-[#b98b3b]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold leading-5 text-[#2E241C]">{itemData.title}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#6f5a46]">{itemData.subtitle}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative flex items-center justify-end overflow-visible px-4 sm:px-0">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-[260px] w-[80%] max-w-[700px] rounded-full bg-black opacity-5 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 mx-auto h-[340px] w-[340px] rounded-full bg-[#f7efe7] opacity-40 blur-2xl" aria-hidden="true" />
            <div className="absolute inset-x-0 top-1/3 mx-auto h-[225px] w-[225px] rounded-full bg-[#f2e4d5] opacity-35 blur-3xl" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
        <button onClick={handleScrollClick} aria-label="Scroll to explore" className="pointer-events-auto flex flex-col items-center gap-2 rounded-md bg-transparent">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="text-[#2E241C] text-2xl">
            ↓
          </motion.div>
          <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} className="text-xs text-[#5f5249]">
            Scroll to Explore
          </motion.span>
        </button>
      </div>
    </section>
  );
}
