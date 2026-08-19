import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { SEO } from '../components/layout/SEO';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Ruler,
  Truck,
  Hammer,
  CheckCircle2,
} from 'lucide-react';
import {
  FeaturedCollectionsSection,
  HeroSection,
} from '../components/sections';

const FeaturedProjectsSection = lazy(() => import('../components/sections/FeaturedProjectsSection').then((module) => ({ default: module.FeaturedProjectsSection })));
const TestimonialsSection = lazy(() => import('../components/sections/TestimonialsSection').then((module) => ({ default: module.TestimonialsSection })));
const WhyChooseSection = lazy(() => import('../components/sections/WhyChooseSection').then((module) => ({ default: module.WhyChooseSection })));
const CallToActionSection = lazy(() => import('../components/sections/CallToActionSection').then((module) => ({ default: module.CallToActionSection })));
import { PageContainer } from '../components/layout/PageContainer';
import { Button, Card, SectionHeader } from '../components/ui';
import { SectionTitle } from '../components/base/SectionTitle';
import { products } from '../data/products';
import { getCachedData } from '../lib/cache';
import { featuredProductSelectColumns, getProductImage, normalizeProducts, type Product } from '../lib/products';
import { supabase } from '../lib/supabase';
import { fetchFeaturedProjects, fetchProjectOfMonth, type Project } from '../lib/projects';
import type { Testimonial } from '../hooks/useTestimonials';

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

const categoryCards = [
  { title: 'Dining Furniture', description: 'Made for gathering.', image: '/assets/hero/intro-picture.webp', pathValue: 'dining' },
  { title: 'Living Room Furniture', description: 'Designed for everyday comfort.', image: '/assets/living-room-cover.webp', pathValue: 'living-room' },
  { title: 'Bedroom Furniture', description: 'Crafted for rest and retreat.', image: '/assets/bedroom-furniture-cover.webp', pathValue: 'bedroom' },
  { title: 'Office Furniture', description: 'Designed for focused work.', image: '/assets/office-furniture-cover.webp', pathValue: 'office' },
  { title: 'Kitchen Furniture', description: 'Beautifully practical storage and cabinetry.', image: '/assets/19.webp', pathValue: 'kitchen' },
  { title: 'Outdoor Furniture', description: 'Made for open-air living.', image: '/assets/outdoor-furniture.webp', pathValue: 'outdoor' },
];

const defaultFeaturedProducts = normalizeProducts(products).slice(0, 3);

const defaultProjectOfMonth: Project = {
  id: 'project-of-the-month',
  slug: 'project-of-the-month',
  title: 'Luxury Dining Suite in Lekki',
  description: 'An elegant dining collection with hand-carved timber details, designed to anchor a refined home interior with warmth and precision.',
  category: 'Residential',
  location: 'Lekki, Lagos',
  status: 'Completed',
  cover_image: '/assets/hero/intro-picture.webp',
  gallery_images: [],
  budget_range: '',
  duration: '11 weeks',
  completion_date: '11 weeks',
  wood_species: 'Mahogany & Oak',
  finish: 'Hand-rubbed oil & beeswax',
  show_in_gallery: true,
  featured_project: false,
  project_of_the_month: false,
  created_at: '',
  updated_at: '',
};

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

const deferAfterHeroPaint = (callback: () => void) => {
  const run = () => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => callback());
      return;
    }

    window.setTimeout(callback, 0);
  };

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(run);
    return;
  }

  run();
};

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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(defaultFeaturedProducts);
  const [_isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [_featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [projectOfMonth, setProjectOfMonth] = useState<Project | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      setIsFeaturedLoading(true);
      setFeaturedError(null);

      try {
        const activeProducts = await getCachedData<Product[]>(`products:homepage-featured`, 10 * 60 * 1000, async () => {
          const { data, error } = await supabase
            .from('products')
            .select(featuredProductSelectColumns)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return normalizeProducts(data);
        });

        if (!mounted) return;

        const featuredItems = activeProducts.slice(0, 3);
        setFeaturedProducts(featuredItems);
      } catch (error) {
        if (!mounted) return;
        setFeaturedError(error instanceof Error ? error.message : 'Unable to load featured products.');
      } finally {
        if (mounted) {
          setIsFeaturedLoading(false);
        }
      }
    };

    deferAfterHeroPaint(() => {
      void fetchFeaturedProducts();
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      setIsProjectsLoading(true);
      setProjectsError(null);
      try {
        const [featured, projectOfMonthData] = await Promise.all([
          fetchFeaturedProjects(),
          fetchProjectOfMonth(),
        ]);
        if (mounted) {
          setFeaturedProjects(featured);
          setProjectOfMonth(projectOfMonthData ?? defaultProjectOfMonth);
        }
      } catch (err) {
        if (mounted) {
          setFeaturedProjects([]);
          setProjectOfMonth(defaultProjectOfMonth);
        }
      } finally {
        if (mounted) setIsProjectsLoading(false);
      }
    };

    deferAfterHeroPaint(() => {
      if (!mounted) return;
      void loadProjects();
    });

    return () => {
      mounted = false;
    };
  }, []);

const normalizeCategorySlug = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const displayFeaturedProducts = featuredProducts.length > 0 ? featuredProducts : defaultFeaturedProducts;

  return (
    <div className="min-h-screen">
      <SEO
        title="Oak Cherry Kraft | Handcrafted furniture & bespoke commissions"
        description="Oak Cherry Kraft Artistry Limited creates premium handcrafted furniture for homes, offices, and commercial spaces in Nigeria."
        url="https://oakcherrykraft.com/"
      />

      <HeroSection />

      <PageContainer className="space-y-0 pb-16 sm:pb-20 pt-6">
        <FeaturedCollectionsSection>
          <section id="explore-collection">
            <SectionHeader
              eyebrow="Explore the collection"
              title="Furniture for the way you want to live."
              description="From a statement dining table to a complete bespoke installation, each piece is made to feel unmistakably yours."
              className="mb-6"
            />
          </section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => (
            <MotionLink
              key={category.title}
              to={category.pathValue ? `/products/${category.pathValue}` : '/products'}
              variants={reveal}
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-[1.5rem] bg-bark text-sand shadow-card transition duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
            >
              <img
                src={category.image}
                alt={`${category.title} collection`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 ease-brand group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bark/95 via-bark/25 to-transparent" aria-hidden="true" />
              <div className="relative p-6 sm:p-7">
                <p className="max-w-xs text-sm leading-6 text-sand/80">{category.description}</p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <h3 className="font-display text-2xl font-semibold text-sand">{category.title}</h3>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/40 transition duration-300 group-hover:bg-sand group-hover:text-bark" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </div>
              </div>
            </MotionLink>
          ))}
        </motion.div>
      </FeaturedCollectionsSection>

      <section className="section-gap">
        <div className="container-wide">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader
              eyebrow="Featured products"
              title="Curated furniture ready for commission."
              description="Explore a premium selection of signature pieces designed for modern living and enduring quality."
              className="max-w-3xl"
            />
            <Button variant="link" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <Link to="/products">View all products</Link>
            </Button>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="mt-6 grid gap-5 lg:grid-cols-3">
            {displayFeaturedProducts.map((product) => (
              <motion.article
                key={product.id}
                variants={reveal}
                className="group overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium focus-within:outline-none focus-within:ring-4 focus-within:ring-oak-200 focus-within:ring-offset-2 focus-within:ring-offset-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.name ?? ''}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-bark">{product.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-bark/70">{product.description || 'Premium handcrafted furniture.'}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-bark/70">{product.material || 'Fine wood'}</p>
                    <Button variant="link" size="sm" asChild className="px-0">
                      <Link to={`/products/${normalizeCategorySlug(product.category ?? '')}/${product.slug ?? product.id}`} aria-label={`View ${product.name}`}>View product</Link>
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {projectOfMonth ? (
        <section className="section-gap bg-sand/40">
          <div className="container-wide">
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center xl:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-[2rem] border border-bark/10 bg-white shadow-soft"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/80 to-transparent" aria-hidden="true" />
                <img
                  src={projectOfMonth.cover_image || defaultProjectOfMonth.cover_image || ''}
                  alt={projectOfMonth.title}
                  loading="lazy"
                  decoding="async"
                  className="relative h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="inline-flex rounded-full border border-bark/10 bg-white px-4 py-2 text-sm font-semibold text-bark shadow-sm">
                  Project of the Month
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-semibold text-bark sm:text-5xl">{projectOfMonth.title}</h2>
                  <p className="max-w-2xl text-base leading-8 text-bark/75">{projectOfMonth.description}</p>
                </div>
                <Button size="lg" asChild>
                  <Link to={`/projects/${projectOfMonth.slug}`}>View Full Project</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}



      <Suspense fallback={null}>
        <WhyChooseSection>
          <div className="grid gap-10 xl:grid-cols-[0.55fr_0.45fr] xl:items-start">
            <div className="space-y-6">
              <SectionHeader
                eyebrow="How we build"
                title="How We Bring Your Vision to Life"
                description="An elegant, step-by-step process that ensures clarity, quality, and a refined final outcome."
                className="max-w-3xl"
              />
            </div>
            <div className="relative">
              <div className="absolute left-5 top-10 hidden h-[calc(100%-3rem)] w-px bg-bark/10 lg:block" />
              <div className="grid gap-5 lg:grid-cols-1">
                {projectTimeline.map((step, index) => (
                  <div key={step.title} className="relative rounded-[1.75rem] border border-bark/10 bg-sand p-6 shadow-soft">
                    <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-bark text-sand">
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div className="ml-16">
                      <p className="text-sm uppercase tracking-[0.3em] text-bark">Step {index + 1}</p>
                      <h3 className="mt-3 text-xl font-semibold text-bark">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-bark/70">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WhyChooseSection>
      </Suspense>

      <TestimonialsSection>
            <motion.div
              initial={{ opacity: 0, x: -22 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2rem] border border-bark/10 bg-sand shadow-soft"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,247,236,0.85),_transparent_45%)] opacity-90" aria-hidden="true" />
              <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-oak-100/80 blur-3xl" aria-hidden="true" />
              <img
                src={founderPortrait}
                alt="Adeyemo Rhodes-Vivour, founder of Oak Cherry Kraft"
                className="relative h-full w-full object-cover transition duration-700 ease-brand hover:scale-[1.01]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <SectionHeader
                eyebrow="Meet the Founder"
                title="Adeyemo Rhodes-Vivour"
                description="Founder, Oak Cherry Kraft"
                className="max-w-3xl"
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
      </TestimonialsSection>

      <FeaturedProjectsSection>
        <div className="grid gap-7">
          <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader
              eyebrow="Selected work"
              title="Spaces made memorable."
              description="A glimpse into the homes, workspaces, and hospitality environments shaped by our studio."
            />
            <Button variant="link" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <Link to="/projects">View all projects</Link>
            </Button>
          </header>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="mt-4 grid gap-5 lg:grid-cols-3">
            {isProjectsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <motion.article
                  key={`project-skeleton-${index}`}
                  variants={reveal}
                  className="overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-bark/5">
                    <div className="h-full w-full animate-pulse bg-bark/10" />
                  </div>
                  <div className="space-y-3 p-6">
                    <div className="h-4 w-24 animate-pulse rounded-full bg-bark/10" />
                    <div className="h-7 w-3/4 animate-pulse rounded-full bg-bark/10" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-bark/10" />
                    <div className="h-4 w-5/6 animate-pulse rounded-full bg-bark/10" />
                  </div>
                </motion.article>
              ))
            ) : projectsError ? (
              <div className="col-span-full rounded-[1.5rem] border border-bark/10 bg-white p-8 text-center text-sm leading-7 text-bark/70 shadow-soft">
                {projectsError}
              </div>
            ) : featuredProjects.length > 0 ? featuredProjects.map((project) => (
              <motion.article
                key={project.id}
                variants={reveal}
                className="group overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium focus-within:outline-none focus-within:ring-4 focus-within:ring-oak-200 focus-within:ring-offset-2 focus-within:ring-offset-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.cover_image || defaultProjectOfMonth.cover_image || ''}
                    alt={`${project.title} project in ${project.category}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-bark shadow-soft">
                    <MapPin size={13} aria-hidden="true" />
                    {project.category}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-bark">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-bark/70">{project.description}</p>
                  <Button variant="link" size="sm" asChild className="mt-5 px-0">
                    <Link to={`/projects/${project.slug}`}>View project</Link>
                  </Button>
                </div>
              </motion.article>
            )) : (
              <div className="col-span-full rounded-[1.5rem] border border-bark/10 bg-white p-8 text-center text-sm leading-7 text-bark/70 shadow-soft">
                No featured projects are available right now. Please check back soon.
              </div>
            )}
          </motion.div>
        </div>
      </FeaturedProjectsSection>

      <Suspense fallback={null}>
        <TestimonialsSection />
                </Suspense>



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
    </PageContainer>
    </div>
  );
}
