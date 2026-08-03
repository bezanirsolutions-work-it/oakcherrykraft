import { motion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
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

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden text-[#2E241C] px-4 sm:px-[60px] min-h-[95vh] lg:min-h-[100vh] bg-[url('/assets/hero/GENERATED.webp')] bg-cover bg-center lg:bg-[position:calc(100%+240px)_50%] bg-no-repeat"
      style={{ backgroundColor: '#F8F4EE' }}
    >
      {/* Absolute image for precise large-screen placement (keeps bg as fallback on smaller screens) */}
      <img
        src="/assets/hero/GENERATED.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute top-0 bottom-0 right-[-320px] w-[145%] object-cover -z-20"
        style={{ transform: 'scaleX(-1)' }}
      />
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

      <div className="mx-auto grid max-w-[1500px] min-h-[95vh] items-center gap-6 py-12 sm:py-24 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-center lg:gap-10 lg:px-[90px] xl:px-[120px]">
        <div className="px-4 sm:px-0 lg:max-w-[55vw]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={containerVariants} className="relative z-10 mx-auto w-full max-w-[620px] rounded-[20px] bg-[rgba(248,244,238,0.55)] p-6 backdrop-blur-sm sm:p-10 md:p-12 lg:mx-0 lg:w-full lg:max-w-none lg:rounded-[28px] lg:border lg:border-white/40 lg:bg-[rgba(248,244,238,0.55)] lg:backdrop-blur-[12px] lg:shadow-[0_24px_80px_rgba(0,0,0,0.12)] lg:p-12">
            <motion.div variants={item} className="inline-flex items-center gap-4">
              <span className="inline-block h-px w-16 bg-[#b98b3b] opacity-90" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.32em] text-[#8d6a45] font-semibold">HANDCRAFTED IN NIGERIA</span>
            </motion.div>

            <motion.h1 variants={item} className="mt-8 text-[3.8rem] leading-[1.02] font-serif tracking-[-0.03em] text-[#241B16] sm:text-[4.75rem] md:text-[5.5rem] lg:max-w-[720px] lg:text-[5.8rem] lg:leading-[0.95] xl:text-[6.2rem]">
              <div>Bespoke Furniture</div>
              <div>Crafted For Timeless Living</div>
            </motion.h1>

            <motion.p variants={item} className="mt-16 max-w-[560px] text-lg font-medium leading-[1.8] text-[#4B4038] lg:mt-10 lg:max-w-[540px] lg:text-[1.05rem] lg:leading-[1.75]">
              Every Oak Cherry Kraft piece is thoughtfully designed and handcrafted using premium hardwoods to complement your home or workspace.
            </motion.p>

            <motion.div variants={item} className="mt-20 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-14 lg:gap-5">
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

            {/* feature cards removed from the left column and will render as a full-width bar below */}
        </div>

        <div className="relative flex items-center justify-end overflow-visible px-4 sm:px-0">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-[260px] w-[80%] max-w-[700px] rounded-full bg-black opacity-5 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 mx-auto h-[340px] w-[340px] rounded-full bg-[#f7efe7] opacity-40 blur-2xl" aria-hidden="true" />
            <div className="absolute inset-x-0 top-1/3 mx-auto h-[225px] w-[225px] rounded-full bg-[#f2e4d5] opacity-35 blur-3xl" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Feature cards: one full-width row on desktop, two-by-two on tablet, stacked on mobile */}
      <motion.div
        variants={item}
        className="relative z-10 -mt-8 mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 sm:px-[60px] md:grid md:grid-cols-2 md:gap-5 lg:absolute lg:bottom-[-26px] lg:left-1/2 lg:w-[min(92%,1280px)] lg:-translate-x-1/2 lg:flex-row lg:justify-between lg:gap-5 lg:px-0 xl:bottom-[-28px] xl:w-[min(92%,1320px)]"
      >
        {[
          { title: 'Crafted to Order', subtitle: 'Made just for you' },
          { title: 'Premium Hardwoods', subtitle: 'Sustainably sourced' },
          { title: 'Residential & Commercial', subtitle: 'Premium projects' },
          { title: 'Designed & Built', subtitle: 'Proudly in Nigeria' },
        ].map((itemData) => (
          <div
            key={itemData.title}
            className="flex min-h-[92px] flex-1 flex-row items-center justify-start gap-3 rounded-[18px] border border-[#e8d7bd]/80 bg-[rgba(255,255,255,0.82)] px-6 py-4 shadow-[0_12px_30px_rgba(46,36,28,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(46,36,28,0.14)] lg:min-h-[100px] lg:flex-1 lg:items-center lg:justify-center lg:gap-4 lg:px-4 lg:py-4 lg:text-center"
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
      </motion.div>

    </section>
  );
}
