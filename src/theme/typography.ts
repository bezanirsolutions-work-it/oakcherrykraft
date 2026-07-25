export const typography = {
  families: {
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  display: 'font-display text-[clamp(2.75rem,4vw,4.5rem)] leading-[0.96] tracking-[-0.03em]',
  section: 'font-display text-[clamp(1.875rem,3vw,3.5rem)] leading-[1.02] tracking-[-0.03em]',
  paragraph: 'text-base sm:text-lg leading-8 tracking-[0.01em]',
  caption: 'text-sm font-medium leading-6 tracking-[0.04em]',
  eyebrow: 'text-xs uppercase tracking-[0.35em]',
  button: 'text-sm font-semibold uppercase tracking-[0.32em]',
  quote: 'font-display text-[clamp(1.9rem,3vw,2.75rem)] italic leading-[1.15] tracking-[-0.03em]',
} as const;
