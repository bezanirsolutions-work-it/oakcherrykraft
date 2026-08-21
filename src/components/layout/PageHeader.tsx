import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  height?: string;
  showBreadcrumb?: boolean;
  image?: string;
}

export function PageHeader({ title, subtitle, height = 'min-h-[320px] sm:min-h-[420px]', showBreadcrumb = false, image = '/assets/hero/GENERATED.webp' }: PageHeaderProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <section
      className="relative isolate overflow-hidden px-4 py-16 text-[#F8F4EE] sm:px-[60px] sm:py-20 lg:py-24"
      style={{
        minHeight: height,
        backgroundColor: '#F8F4EE',
      }}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        width={1800}
        height={900}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,10,8,0.38),rgba(12,10,8,0.16),rgba(12,10,8,0.34))]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center">
        <div className="max-w-4xl py-4 sm:py-8 lg:max-w-5xl">
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

          <h1 className="mt-7 max-w-[900px] font-serif text-[2.4rem] leading-[1.04] tracking-[-0.03em] text-white sm:text-[3.5rem] md:text-[4.2rem] lg:text-[5.2rem]">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#efe2d0] sm:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
