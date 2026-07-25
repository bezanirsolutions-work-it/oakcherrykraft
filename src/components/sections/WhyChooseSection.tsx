import { type ReactNode } from 'react';

interface WhyChooseSectionProps {
  children?: ReactNode;
}

export function WhyChooseSection({ children }: WhyChooseSectionProps) {
  return (
    <section className="section-gap bg-sand">
      <div className="container-wide">
        {children}
      </div>
    </section>
  );
}
