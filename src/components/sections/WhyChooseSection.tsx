import { type ReactNode } from 'react';

interface WhyChooseSectionProps {
  children?: ReactNode;
}

export function WhyChooseSection({ children }: WhyChooseSectionProps) {
  return (
    <section className="section-gap relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(217,183,132,0.1),_transparent_48%),_linear-gradient(180deg,_#f4efe8_0%,_#f8f3ee_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-oak-500/30 to-transparent" aria-hidden="true" />
      <div className="absolute left-[-12%] top-10 h-64 w-64 rounded-full bg-[#d9c1a0]/10 blur-3xl" aria-hidden="true" />
      <div className="absolute right-[-10%] top-16 h-72 w-72 rounded-full bg-[#d9c1a0]/10 blur-3xl" aria-hidden="true" />
      <div className="container-wide relative">{children}</div>
    </section>
  );
}
