import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { SEO } from '../components/layout/SEO';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  Ruler,
  Truck,
  Hammer,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  CraftInMotion,
  FeaturedCollectionsSection,
  HeroSection,
} from '../components/sections';

const FeaturedProjectsSection = lazy(() => import('../components/sections/FeaturedProjectsSection').then((module) => ({ default: module.FeaturedProjectsSection })));
const TestimonialsSection = lazy(() => import('../components/sections/TestimonialsSection').then((module) => ({ default: module.TestimonialsSection })));
const WhyChooseSection = lazy(() => import('../components/sections/WhyChooseSection').then((module) => ({ default: module.WhyChooseSection })));
const CallToActionSection = lazy(() => import('../components/sections/CallToActionSection').then((module) => ({ default: module.CallToActionSection })));
import { Button, Card, Marquee, Reveal, RevealText, SectionHeader } from '../components/ui';
import { SectionTitle } from '../components/base/SectionTitle';
import { products } from '../data/products';
import { getCachedData } from '../lib/cache';
import { normalizeProducts, type Product } from '../lib/products';
import { supabase } from '../lib/supabase';
import type { Testimonial } from '../hooks/useTestimonials';
import { CATEGORY_HIERARCHY, type ProductCategoryGroup } from '../lib/productCategories';
import { inTheRealWorldProjects } from '../data/inTheRealWorld';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const MotionLink = motion(Link);
const founderPortrait = new URL('../../ADE\'s.jpeg', import.meta.url).href;
const bathroomVanityCover = new URL('../../bathroom & vanity.jpeg', import.meta.url).href;
const anteRoomCover = new URL('../../ante room.jpeg', import.meta.url).href;
const kitchenCover = new URL('../../kitchenn.jpeg', import.meta.url).href;
const hallwaysPassagesCover = new URL('../../hallways and passgaes.jpeg', import.meta.url).href;
const restaurantsCover = new URL('../../restaurants.jpeg', import.meta.url).href;
const entrywayCover = new URL('../../entryway.jpeg', import.meta.url).href;
const livingSpaceCover = new URL('../../living spacess.jpeg', import.meta.url).href;
const restaurantCategoryCover = new URL('../../Restaurant.jpeg', import.meta.url).href;

/**
 * Mapping of category slugs to display details (title, description, image).
 * Used for the homepage collection cards.
 */
const categoryCardDetails: Record<string, { title: string; description: string; image: string }> = {
  'bathroom-and-vanity': { title: 'Bathroom & Vanity', description: 'Curated for spa-like refinement.', image: bathroomVanityCover },
  'ante-room': { title: 'Ante Room', description: 'Transitional spaces with purpose.', image: anteRoomCover },
  'kitchen': { title: 'Kitchen', description: 'Beautifully practical storage and cabinetry.', image: kitchenCover },
  'bedrooms': { title: 'Bedrooms', description: 'Crafted for rest and retreat.', image: '/assets/bedroom-furniture-cover.webp' },
  'living-spaces': { title: 'Living Spaces', description: 'Designed for everyday comfort.', image: livingSpaceCover },
  'entryway-and-foyer': { title: 'Entryway & Foyer', description: 'First impressions, lasting impact.', image: entrywayCover },
  'hallways-and-passageways': { title: 'Hallways & Passageways', description: 'Movement made beautiful.', image: hallwaysPassagesCover },
  'dining': { title: 'Dining', description: 'Made for gathering.', image: '/assets/hero/intro-picture.webp' },
  'outdoor-living': { title: 'Outdoor Living', description: 'Made for open-air living.', image: '/assets/outdoor-furniture.webp' },
  'offices': { title: 'Offices', description: 'Designed for focused work.', image: '/assets/office-furniture-cover.webp' },
  'restaurants': { title: 'Restaurants', description: 'Hospitality through design.', image: restaurantCategoryCover },
  'lounges': { title: 'Lounges', description: 'Refined spaces for gathering.', image: restaurantsCover },
};

/**
 * Generates flat list of all category cards from the hierarchy.
 * Each card includes: title, description, image, slug, and pathValue for routing.
 */
const craftMarqueeItems = ['CUSTOM FURNITURE', 'BESPOKE DESIGN', 'MASTER CRAFTSMANSHIP', 'BUILT TO LAST'];
const spaceMarqueeItems = CATEGORY_HIERARCHY.flatMap((group) => group.categories.map((category) => category.displayLabel));

const defaultFeaturedProducts = normalizeProducts(products).slice(0, 3);

const projectTimeline = [
  {
    title: 'Understand',
    description: 'We listen to your requirements, space, and vision.',
    Icon: Ruler,
  },
  {
    title: 'Design',
    description: 'We develop the design, dimensions, and material direction.',
    Icon: CheckCircle2,
  },
  {
    title: 'Craft',
    description: 'Our craftsmen bring the approved design to life.',
    Icon: Hammer,
  },
  {
    title: 'Deliver',
    description: 'We inspect, deliver, and install the finished piece.',
    Icon: Truck,
  },
];

function CategoryRail({ group }: { group: ProductCategoryGroup }) {
  const railRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const updateRailState = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      setCanScroll(maxScroll > 4);
      setScrollProgress(maxScroll > 0 ? rail.scrollLeft / maxScroll : 0);
    };

    updateRailState();
    rail.addEventListener('scroll', updateRailState, { passive: true });
    const observer = new ResizeObserver(updateRailState);
    observer.observe(rail);

    return () => {
      rail.removeEventListener('scroll', updateRailState);
      observer.disconnect();
    };
  }, []);

  const moveRail = (direction: number) => {
    railRef.current?.scrollBy({ left: direction * (railRef.current.clientWidth * 0.72), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby={`${group.groupSlug}-spaces`} className="mt-12 first:mt-8">
      <div className="relative mb-5 flex items-end justify-center gap-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">{group.groupLabel}</p>
          <h3 id={`${group.groupSlug}-spaces`} className="mt-2 font-display text-3xl font-semibold text-bark sm:text-4xl">{group.groupLabel} spaces</h3>
        </div>
        <div className="absolute right-0 hidden items-center gap-2 sm:flex">
          <button type="button" onClick={() => moveRail(-1)} disabled={!canScroll || scrollProgress <= 0.01} aria-label={`Previous ${group.groupLabel.toLowerCase()} spaces`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-sm transition hover:-translate-x-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 disabled:cursor-not-allowed disabled:opacity-35">
            <ChevronRight size={17} className="rotate-180" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => moveRail(1)} disabled={!canScroll || scrollProgress >= 0.99} aria-label={`Next ${group.groupLabel.toLowerCase()} spaces`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-bark/10 bg-white text-bark shadow-sm transition hover:translate-x-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 disabled:cursor-not-allowed disabled:opacity-35">
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={railRef} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:gap-6 sm:px-0" style={{ scrollbarWidth: 'none' }}>
        {group.categories.map((category, index) => {
          const details = categoryCardDetails[category.slug];
          return (
            <Reveal key={category.slug} delay={Math.min(index * 0.04, 0.2)} className="min-w-[82%] snap-start sm:min-w-[45%] lg:min-w-[30%]">
              <MotionLink to={`/products/${category.slug}`} variants={reveal} className="group relative block aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-bark text-sand shadow-card transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200">
                <img src={details.image} alt={`${category.displayLabel} collection`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-bark/95 via-bark/20 to-transparent transition duration-500 group-hover:from-bark group-hover:via-bark/30" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-sand/70">{group.groupLabel}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <h4 className="max-w-[82%] font-display text-2xl font-semibold leading-tight text-sand">{category.displayLabel}</h4>
                    <ChevronRight size={20} className="shrink-0 transition-transform duration-300 ease-brand group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-sand/65">Explore space</p>
                </div>
              </MotionLink>
            </Reveal>
          );
        })}
      </div>
      {group.groupSlug !== 'commercial' ? (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-bark/10" aria-hidden="true">
            <div className="h-full rounded-full bg-oak-600 transition-[width] duration-300 ease-brand" style={{ width: `${Math.max(12, scrollProgress * 100)}%` }} />
          </div>
          <motion.span animate={reducedMotion ? undefined : { x: [0, 3, 0] }} transition={reducedMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-bark/55 sm:hidden">Swipe to explore <span aria-hidden="true">-&gt;</span></motion.span>
        </div>
      ) : null}
    </section>
  );
}

const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Chinwe',
    role: 'Interior Designer',
    company: 'Studio Nuru',
    photo_url: null,
    rating: 5,
    testimonial: 'The craftsmanship exceeded my expectations. The dining table feels incredibly solid, the finish is beautiful, and every detail was handled with care. The team was professional throughout the entire process.',
    featured: true,
    display_order: 1,
    created_at: null,
  },
  {
    id: 'testimonial-2',
    name: 'Musa',
    role: 'Homeowner',
    company: null,
    photo_url: null,
    rating: 5,
    testimonial: 'I wanted a custom TV console that matched my living room perfectly, and Oak Cherry Kraft delivered exactly what I had imagined. The quality of the woodwork is outstanding.',
    featured: true,
    display_order: 2,
    created_at: null,
  },
  {
    id: 'testimonial-3',
    name: 'Ada',
    role: null,
    company: null,
    photo_url: null,
    rating: 5,
    testimonial: 'From the first consultation to delivery, communication was excellent. The wardrobe was completed on schedule and looks even better than the design we discussed.',
    featured: false,
    display_order: 3,
    created_at: null,
  },
  {
    id: 'testimonial-4',
    name: 'Ibrahim',
    role: 'Entrepreneur',
    company: null,
    photo_url: null,
    rating: 4,
    testimonial: 'I appreciate the attention to detail and the premium finish on my office desk. It\'s sturdy, elegant, and has completely transformed my workspace. I would definitely recommend Oak Cherry Kraft.',
    featured: false,
    display_order: 4,
    created_at: null,
  },
  {
    id: 'testimonial-5',
    name: 'Sade',
    role: null,
    company: null,
    photo_url: null,
    rating: 5,
    testimonial: 'The Design Your Furniture process made it easy to customise exactly what I wanted. The final piece was beautifully crafted and worth every penny.',
    featured: false,
    display_order: 5,
    created_at: null,
  },
];

export function Home() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen">
      <SEO
        title="Oak Cherry Kraft | Handcrafted furniture & bespoke commissions"
        description="Oak Cherry Kraft Artistry Limited creates premium handcrafted furniture for homes, offices, and commercial spaces in Nigeria."
        url="https://oakcherrykraft.com/"
      />

      <HeroSection />

      <section className="overflow-hidden bg-bark py-5 text-sand sm:py-6" aria-label="Oak Cherry Kraft studio principles">
        <div className="container-wide">
          <Marquee
            items={craftMarqueeItems}
            duration={30}
            className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] sm:text-sm"
            trackClassName=""
          />
        </div>
      </section>

      <div className="w-full space-y-0 pb-16 pt-6 sm:pb-20">
        <FeaturedCollectionsSection>
          <section id="explore-collection">
            <SectionHeader
              eyebrow="THE COLLECTION"
              title="Explore our spaces."
              description="Thoughtfully designed furniture for residential and commercial spaces, made to begin a conversation with your room."
              className="mb-6 max-w-none text-left sm:[&_p:last-child]:whitespace-nowrap"
            />
          </section>
          {CATEGORY_HIERARCHY.map((group) => <CategoryRail key={group.groupSlug} group={group} />)}
      </FeaturedCollectionsSection>

      <Suspense fallback={null}>
        <WhyChooseSection>
          <div className="space-y-8">
            <SectionHeader
              eyebrow="How we build"
              title="How We Bring Your Vision to Life"
              description="An elegant, step-by-step process that ensures clarity, quality, and a refined final outcome."
              className="mx-auto max-w-4xl text-center"
            />
            <CraftInMotion />
          </div>
        </WhyChooseSection>
      </Suspense>

      <section className="section-gap -mt-8 md:-mt-12">
        <div className="container-wide">
        <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal direction="left" className="h-full">
            <motion.div
              initial={{ opacity: 0, x: -22 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-bark/10 bg-sand shadow-soft lg:aspect-auto lg:min-h-[620px]"
            >
              <img
                src={founderPortrait}
                alt="Adeyemo Rhodes-Vivour, founder of Oak Cherry Kraft"
                className="h-full w-full object-cover transition duration-700 ease-brand hover:scale-[1.01]"
              />
            </motion.div>
            </Reveal>

            <Reveal direction="right" delay={0.08} className="flex h-full flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8 py-2 lg:py-8"
            >
              <SectionHeader
                eyebrow="Meet the Founder"
                title="Adeyemo Rhodes-Vivour"
                description="Founder, Oak Cherry Kraft"
                className="max-w-3xl text-left"
              />

              <div className="space-y-4 text-base leading-8 text-bark/75">
                <p>At Oak Cherry Kraft, we believe great furniture creates lasting value. Led by Adeyemo Rhodes-Vivour, our studio creates bespoke furniture that balances elegance, durability, and functionality.</p>
                <p>Every project begins with understanding the client&apos;s vision and ends with carefully crafted furniture made specifically for its space.</p>
              </div>

              <Card className="h-auto rounded-[1.75rem] border border-bark/10 bg-sand/80 p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-oak-700">Founder quote</p>
                <blockquote className="mt-3 text-2xl font-display leading-tight text-bark">{"Great furniture isn't just built to fill a space—it's crafted to become part of the stories created within it."}</blockquote>
                <div className="mt-4 text-sm leading-7 text-bark/75">
                  <p className="font-semibold text-bark">Adeyemo Rhodes-Vivour</p>
                  <p>Founder, Oak Cherry Kraft</p>
                </div>
              </Card>
            </motion.div>
            </Reveal>
              </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>

      <section className="overflow-hidden border-y border-bark/10 bg-sand py-6 text-bark sm:py-8" aria-label="Furniture spaces">
        <div className="container-wide">
          <RevealText as="p" className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-oak-700 sm:text-xs">
            Spaces shaped with intention
          </RevealText>
          <Marquee
            items={spaceMarqueeItems}
            direction="right"
            duration={36}
            className="font-display text-2xl font-semibold tracking-[0.04em] sm:text-4xl"
            trackClassName=""
          />
        </div>
      </section>

      <FeaturedProjectsSection>
        <div className="grid gap-7">
          <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader
              eyebrow="Selected work"
              title="Spaces made memorable."
              description="A glimpse into the homes, workspaces, and hospitality environments shaped by our studio."
              className="max-w-4xl text-left"
            />
            <Button variant="link" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <Link to="/projects">View all projects</Link>
            </Button>
          </header>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="mt-4 grid gap-5 md:grid-cols-3">
            {inTheRealWorldProjects.slice(0, 3).map((project, index) => (
              <motion.article
                key={project.id}
                variants={reveal}
                className="group overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                  <img
                    src={project.poster || project.media}
                    alt={project.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  {project.type === 'video' ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/15 shadow-lg backdrop-blur-sm">
                        <Play className="ml-1 h-6 w-6 fill-white text-white" aria-hidden="true" />
                      </span>
                    </div>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </FeaturedProjectsSection>

      <Suspense fallback={null}>
        <CallToActionSection>
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle
            eyebrow="Your space, elevated"
            title="Ready to Transform Your Space?"
            description="Let&apos;s create handcrafted furniture designed exclusively for your home, office, or commercial project."
            inverse
            className="mx-auto"
          />
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/request-quote">Get free consultation</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <a href="https://wa.me/2348034291245">WhatsApp us</a>
            </Button>
          </div>
        </div>
        </CallToActionSection>
      </Suspense>
    </div>
    </div>
  );
}
