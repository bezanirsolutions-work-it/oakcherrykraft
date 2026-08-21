import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../base/Button';

interface HeroSectionProps {
  children?: ReactNode;
}

const easing: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({ children: _children }: HeroSectionProps) {
  const [animationReady, setAnimationReady] = useState(false);
  const reducedMotion = useReducedMotion();

  // Defer animations until after hero is painted
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimationReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      className="relative overflow-hidden text-[#2E241C] w-full px-3 sm:px-0 md:px-[60px] min-h-[90vh] md:min-h-[95vh] lg:min-h-[100vh] bg-[url('/assets/hero/GENERATED.webp')] bg-cover bg-center bg-no-repeat bg-[length:120%] lg:bg-[length:140%] lg:bg-[position:100%_50%]"
      style={{ backgroundColor: '#F8F4EE' }}
    >
      {/* Absolute image for precise large-screen placement (keeps bg as fallback on smaller screens) */}
      <img
        src="/assets/hero/GENERATED.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute top-0 bottom-0 right-[-300px] w-[150%] object-cover -z-20"
        style={{ transform: 'scale(0.92) scaleX(-1)' }}
        width={1536}
        height={1024}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 z-0 h-full hero-bg"
        initial={{ opacity: 0, x: 0 }}
        animate={animationReady ? { opacity: 1, x: [0, 10, 0] } : { opacity: 1, x: 0 }}
        transition={animationReady ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : {}}
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
        }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[12%] mx-auto h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(215,190,150,0.18),_transparent_70%)] opacity-90 blur-3xl" aria-hidden="true" />
      </div>

      <div className="w-full max-w-[1800px] mx-auto min-h-[auto] pt-5 pb-8 md:min-h-[95vh] md:pt-8 md:pb-12 lg:pt-8 lg:pb-10 xl:px-[72px]">
        <div className="w-full mx-auto px-0 lg:max-w-none">
        <div className="w-full px-0 sm:px-0 lg:max-w-[760px]">
          <div
            className="relative z-10 w-full max-w-[min(92%,620px)] rounded-[20px] bg-[rgba(248,244,238,0.65)] p-6 backdrop-blur-sm sm:max-w-[740px] sm:p-10 md:p-12 lg:-mt-14 lg:max-w-[760px] lg:rounded-[28px] lg:border lg:border-white/40 lg:bg-[rgba(248,244,238,0.68)] lg:backdrop-blur-[16px] lg:shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:p-14"
          >
            <motion.div
              initial={reducedMotion ? false : { opacity: 1, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.04, ease: easing }}
              className="inline-flex items-center gap-4"
            >
              <span className="inline-block h-px w-16 bg-[#b98b3b] opacity-90" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.32em] text-[#8d6a45] font-semibold">HANDCRAFTED IN NIGERIA</span>
            </motion.div>

            <motion.h1
              initial={reducedMotion ? false : { opacity: 1, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.12, ease: easing }}
              className="mt-8 max-w-[760px] font-serif tracking-[-0.03em] text-[#241B16] text-[2.8rem] leading-[0.95] sm:text-[3.6rem] md:text-[4rem] lg:mt-10 lg:max-w-[780px] lg:text-[4.15rem] lg:leading-[0.98] xl:text-[4.55rem]"
            >
              <span className="block">Bespoke Furniture Crafted</span>
              <span className="block">For Timeless Living</span>
            </motion.h1>

            <motion.p
              initial={reducedMotion ? false : { opacity: 1, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: easing }}
              className="mt-8 max-w-[320px] text-lg font-medium leading-[1.8] text-[#4B4038] sm:max-w-[560px] lg:mt-8 lg:max-w-[590px] lg:text-[1.05rem] lg:leading-[1.55]"
            >
              <span className="block lg:whitespace-nowrap">Every Oak Cherry Kraft piece is thoughtfully designed and handcrafted using premium</span>
              <span className="block lg:whitespace-nowrap">hardwoods to complement your home or workspace.</span>
            </motion.p>

            <motion.div
              initial={reducedMotion ? false : { opacity: 1, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.36, ease: easing }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-10 lg:justify-start lg:gap-6"
            >
              <motion.div whileHover={{ y: -2 }} className="w-full sm:w-auto">
                <Button asChild className="w-full sm:w-auto rounded-full bg-[#2E241C] px-8 py-4 text-sm font-semibold text-[#F8F4EE] shadow-lg shadow-[#00000014] transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <Link to="/configuration-selector" className="inline-flex items-center gap-3">
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
          </div>

          <div className="hidden lg:block relative min-h-[180px] px-4 sm:px-0 mt-6">
            <div className="pointer-events-none inset-0 flex items-center justify-center">
              <div className="absolute inset-0 mx-auto h-[340px] w-[340px] rounded-full bg-[#f7efe7] opacity-40 blur-2xl" aria-hidden="true" />
              <div className="absolute inset-x-0 top-1/3 mx-auto h-[225px] w-[225px] rounded-full bg-[#f2e4d5] opacity-35 blur-3xl" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Feature cards: one full-width row on desktop, two-by-two on tablet, stacked on mobile */}
      <div
        className="relative z-10 -mt-5 mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 sm:px-[60px] md:grid md:grid-cols-2 md:gap-5 lg:flex lg:flex-row lg:gap-5 lg:justify-center lg:px-0 xl:w-[min(92%,1320px)]"
      >
          {[
          { title: 'Crafted to Order', subtitle: 'Made just for you' },
          { title: 'Premium Hardwoods', subtitle: 'Sustainably sourced' },
          { title: 'Residential & Commercial', subtitle: 'Premium projects' },
          { title: 'Designed & Built', subtitle: 'Proudly in Nigeria' },
        ].map((itemData) => (
          <div
            key={itemData.title}
            className="flex min-h-[100px] w-full flex-1 items-center justify-center gap-3 rounded-[18px] border border-[#e8d7bd]/80 bg-[rgba(255,255,255,0.92)] px-6 py-4 shadow-[0_12px_30px_rgba(46,36,28,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(46,36,28,0.14)] lg:min-h-[100px] lg:flex-1 lg:items-center lg:justify-center lg:gap-4 lg:px-4 lg:py-4 lg:text-center"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#b98b3b] bg-[#f8efe2] text-[#b98b3b]">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.95rem] font-semibold leading-5 text-[#2E241C]">{itemData.title}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-[#6f5a46]">{itemData.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
 
