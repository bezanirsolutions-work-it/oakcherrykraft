export const colors = {
  background: '#efe5db',
  surface: '#f4efe7',
  walnut: '#6f402b',
  oak: '#a86a44',
  forest: '#33402d',
  gold: '#c9aa84',
  charcoal: '#3d2d26',
  muted: '#7a6554',
  white: '#ffffff',
} as const;

export const typography = {
  display: 'Cormorant Garamond, Georgia, serif',
  body: 'Inter, ui-sans-serif, system-ui, sans-serif',
} as const;

export const spacing = {
  section: '4rem',
  sectionLarge: '6rem',
  sectionSmall: '2.5rem',
  containerMax: '92rem',
  pagePaddingX: '1.5rem',
  pagePaddingY: '2.5rem',
} as const;

export const borderRadius = {
  card: '2rem',
  button: '9999px',
  image: '2.25rem',
} as const;

export const shadows = {
  soft: '0 18px 50px rgba(45, 33, 27, 0.12)',
  medium: '0 14px 40px rgba(45, 33, 27, 0.14)',
  luxury: '0 24px 90px rgba(45, 33, 27, 0.16)',
} as const;

export const transitions = {
  default: '260ms',
  slow: '420ms',
  fast: '180ms',
} as const;

export const animations = {
  durations: {
    short: '180ms',
    normal: '260ms',
    long: '420ms',
  },
  easing: {
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.5, 1, 0.89, 1)',
  },
} as const;
