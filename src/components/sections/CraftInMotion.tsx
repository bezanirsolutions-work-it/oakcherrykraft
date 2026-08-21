import { motion, useReducedMotion } from 'framer-motion';
import { useState, type CSSProperties } from 'react';
import cardOneImage from '../../../card 1.jpeg';
import cardFiveImage from '../../../card 5.jpeg';

interface CraftStage {
  number: string;
  eyebrow: string;
  title: string;
  image: string;
  imagePosition: string;
}

const craftStages: CraftStage[] = [
  {
    number: '01',
    eyebrow: 'DISCOVER',
    title: 'We understand your space, lifestyle, and vision.',
    image: cardOneImage,
    imagePosition: 'center',
  },
  {
    number: '02',
    eyebrow: 'DESIGN',
    title: 'We turn your vision into a considered, tailored design.',
    image: '/assets/living-room-cover.webp',
    imagePosition: 'center',
  },
  {
    number: '03',
    eyebrow: 'CRAFT',
    title: 'Our master craftsmen bring the design to life with precision.',
    image: '/assets/hero/TABLE.jpeg',
    imagePosition: 'center',
  },
  {
    number: '04',
    eyebrow: 'REFINE',
    title: 'We perfect the finish, comfort, proportion, and detail.',
    image: '/assets/office-furniture-cover.webp',
    imagePosition: 'center',
  },
  {
    number: '05',
    eyebrow: 'DELIVER',
    title: 'Your finished piece arrives ready for its place.',
    image: cardFiveImage,
    imagePosition: 'center',
  },
];

const cardOffsets = ['mt-14 md:mt-[116px]', 'mt-0', 'mt-14 md:mt-[116px]', 'mt-0', 'mt-14 md:mt-[116px]'];

export function CraftInMotion() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <style>{`
        @keyframes craftJourney {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(calc(-1 * var(--craft-segment-width)), 0, 0); }
        }

        @keyframes craftLineFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -160; }
        }

        @keyframes craftCardDance {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          25% { transform: translate3d(3px, -7px, 0) rotate(0.35deg); }
          50% { transform: translate3d(-2px, -3px, 0) rotate(-0.25deg); }
          75% { transform: translate3d(2px, 4px, 0) rotate(0.2deg); }
        }

        .craft-track {
          animation: craftJourney 38s linear infinite;
          will-change: transform;
        }

        .craft-track:hover {
          animation-play-state: paused;
        }

        .craft-line-flow {
          animation: craftLineFlow 11s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .craft-track,
          .craft-line-flow {
            animation: none;
          }
        }

        @media (max-width: 767px) {
          .craft-marquee {
            --craft-card-width: min(78vw, 300px) !important;
            --craft-gap: 1rem !important;
          }
        }
      `}</style>

      <div
        className="craft-marquee relative mt-10 w-full overflow-hidden py-2 md:mt-14 md:py-0"
        style={{
          '--craft-card-width': 'clamp(220px, 18vw, 280px)',
          '--craft-gap': '1.5rem',
          '--craft-segment-width': 'calc((var(--craft-card-width) * 5) + (var(--craft-gap) * 5))',
        } as CSSProperties}
      >
        <div className="craft-track flex w-max">
          {[0, 1].map((segment) => (
            <div
              key={segment}
              className="relative flex h-[430px] shrink-0 gap-[var(--craft-gap)] pr-[var(--craft-gap)] md:h-[540px]"
              style={{ width: 'var(--craft-segment-width)' }}
              aria-hidden={segment === 1}
            >
              <svg viewBox="0 0 1390 540" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" aria-hidden="true">
                <path d={segment === 0 ? 'M 0 330 C 45 330, 85 330, 130 330 C 215 330, 300 186, 410 186 C 505 186, 585 330, 690 330 C 790 330, 860 186, 970 186 C 1070 186, 1150 330, 1260 330 C 1310 330, 1350 186, 1390 186' : 'M 0 186 C 45 186, 85 186, 130 186 C 215 186, 300 330, 410 330 C 505 330, 585 186, 690 186 C 790 186, 860 330, 970 330 C 1070 330, 1150 186, 1260 186 C 1310 186, 1350 330, 1390 330'} fill="none" stroke="rgba(123,79,42,0.3)" strokeWidth="3.4" strokeLinecap="round" />
                <path className="craft-line-flow" d={segment === 0 ? 'M 0 330 C 45 330, 85 330, 130 330 C 215 330, 300 186, 410 186 C 505 186, 585 330, 690 330 C 790 330, 860 186, 970 186 C 1070 186, 1150 330, 1260 330 C 1310 330, 1350 186, 1390 186' : 'M 0 186 C 45 186, 85 186, 130 186 C 215 186, 300 330, 410 330 C 505 330, 585 186, 690 186 C 790 186, 860 330, 970 330 C 1070 330, 1150 186, 1260 186 C 1310 186, 1350 330, 1390 330'} fill="none" stroke="rgba(105,64,30,0.92)" strokeWidth="2.7" strokeLinecap="round" strokeDasharray="5 16" />
              </svg>

              {craftStages.map((stage, index) => {
                const isActive = index === activeIndex;

                return (
                  <motion.button
                    key={`${segment}-${stage.number}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View ${stage.eyebrow.toLowerCase()} stage`}
                    aria-pressed={isActive}
                    tabIndex={segment === 1 ? -1 : 0}
                    whileHover={reducedMotion ? undefined : { y: -6, scale: 1.01 }}
                    className={`group relative z-10 w-[var(--craft-card-width)] shrink-0 self-start overflow-hidden rounded-[1.8rem] border bg-[#fffdfb] text-left shadow-[0_24px_60px_rgba(78,56,34,0.12)] transition-[border-color,opacity,box-shadow,transform] duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 ${segment === 0 ? cardOffsets[index] : cardOffsets[(index + 1) % cardOffsets.length]} ${
                      isActive ? 'border-oak-700/30 shadow-[0_28px_70px_rgba(78,56,34,0.16)]' : 'border-bark/10'
                    }`}
                    style={reducedMotion ? undefined : { animation: `craftCardDance ${7.5 + index * 0.45}s ease-in-out infinite ${segment * 0.7 + index * 0.42}s` }}
                  >
                    <div className="relative aspect-[0.88/1] overflow-hidden bg-sand">
                      <img src={stage.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105" style={{ objectPosition: stage.imagePosition }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-bark/95 via-bark/25 to-bark/10" aria-hidden="true" />
                      <span className="absolute left-4 top-4 rounded-full border border-white/75 bg-bark/65 px-4 py-2 text-[0.78rem] font-bold tracking-[0.2em] text-white shadow-[0_5px_16px_rgba(45,42,38,0.22)] backdrop-blur-sm">{stage.number}</span>
                      <div className="absolute inset-x-0 bottom-0 p-5 xl:p-6">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/80">{stage.eyebrow}</p>
                        <p className="mt-3 font-display text-[1.28rem] leading-[1.12] text-white" style={{ letterSpacing: '-0.03em' }}>{stage.title}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
