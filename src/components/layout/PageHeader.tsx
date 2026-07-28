import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  height?: string;
  showBreadcrumb?: boolean;
}

export function PageHeader({ title, subtitle, height = 'min-h-[320px] sm:min-h-[420px]', showBreadcrumb = false }: PageHeaderProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <section
      className="relative isolate overflow-hidden bg-[#F8F4EE] px-4 py-16 text-[#F8F4EE] sm:px-[60px] sm:py-20 lg:py-24"
      style={{ minHeight: height }}
    >
      <div className="absolute inset-0 z-0 bg-[#120f0b]" aria-hidden="true" />
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12,10,8,0.76) 0%, rgba(12,10,8,0.70) 42%, rgba(12,10,8,0.60) 68%, rgba(12,10,8,0.35) 100%), url('/assets/hero/GENERATED.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,_rgba(185,139,59,0.22),_transparent_46%)]" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl rounded-[24px] border border-white/15 bg-[rgba(12,10,8,0.2)] p-8 backdrop-blur-[2px] sm:p-10 lg:p-12"
        >
          {showBreadcrumb ? (
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#e9dcc8]">
              <Link to="/" className="transition hover:text-white">
                Home
              </Link>
              {pathSegments.length > 0 ? <ChevronRight size={14} className="text-[#e9dcc8]/70" aria-hidden="true" /> : null}
              {pathSegments.map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                const label = segment.replace(/-/g, ' ');

                return (
                  <span key={href} className="inline-flex items-center gap-2">
                    {isLast ? (
                      <span className="font-semibold capitalize text-white">{label}</span>
                    ) : (
                      <Link to={href} className="transition hover:text-white">
                        {label}
                      </Link>
                    )}
                    {!isLast ? <ChevronRight size={14} className="text-[#e9dcc8]/70" aria-hidden="true" /> : null}
                  </span>
                );
              })}
            </nav>
          ) : null}

          <div className="inline-flex items-center gap-4">
            <span className="h-px w-16 bg-[#b98b3b]" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e9dcc8]">
              Oak Cherry Kraft
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[760px] font-serif text-[2.4rem] leading-[1.04] tracking-[-0.03em] text-white sm:text-[3rem] md:text-[3.5rem] lg:text-[4rem]"
          >
            {title}
          </motion.h1>

          {subtitle ? (
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-2xl text-base leading-8 text-[#efe2d0] sm:text-lg"
            >
              {subtitle}
            </motion.p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
