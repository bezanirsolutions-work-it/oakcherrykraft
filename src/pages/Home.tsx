import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  Leaf,
  MapPin,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Sparkles,
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
import { supabase } from '../lib/supabase';
import { fetchFeaturedProjects, fetchProjectOfMonth, type Project } from '../lib/projects';

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const MotionLink = motion(Link);
const founderPortrait = new URL('../../FOUNDER.jpeg', import.meta.url).href;

const categoryCards = [
  { title: 'Dining Furniture', description: 'Sculptural centrepieces made for long conversations and memorable gatherings.', image: '/assets/hero/intro-picture.webp', queryValue: 'Dining' },
  { title: 'Living Room Furniture', description: 'Warm, considered forms that bring depth and ease to everyday living.', image: '/assets/living-room-cover.webp', queryValue: 'Living Room' },
  { title: 'Bedroom Furniture', description: 'Quietly luxurious pieces designed around rest, ritual, and lasting comfort.', image: '/assets/bedroom-furniture-cover.webp', queryValue: 'Bedroom' },
  { title: 'Office Furniture', description: 'Confident executive desks and storage that make focused work feel elevated.', image: '/assets/office-furniture-cover.webp', queryValue: 'Office' },
  { title: 'Kitchen Furniture', description: 'Tailored cabinetry and fitted storage with practical intelligence and a beautiful material presence.', image: '/assets/19.webp', queryValue: 'Kitchen' },
  { title: 'Outdoor Furniture', description: 'Durable outdoor forms for slow mornings, open-air dinners, and generous hosting.', image: '/assets/outdoor-furniture.webp', queryValue: null },
];

const featuredProductSelectColumns = [
  'id',
  'name',
  'category',
  'summary',
  'price',
  'wood',
  'availability',
  'image',
  'cover_image',
  'image_urls',
  'slug',
  'status',
  'is_active',
  'featured',
  'is_featured',
  'featured_product',
].join(',');

const heroTrustBadges = [
  { title: 'Custom Furniture Crafted to Order', description: 'Every piece is made to your exact specification with meticulous craftsmanship.' },
  { title: 'Sustainably Sourced Hardwood', description: 'Premium timbers selected for beauty, durability, and responsible sourcing.' },
  { title: 'Premium Residential & Commercial Projects', description: 'Projects designed to suit upscale homes, offices, and hospitality interiors.' },
  { title: 'Designed & Built in Nigeria', description: 'Local craftsmanship with a luxury finish for discerning clients across the region.' },
];

interface Product {
  id: string;
  name: string;
  category: string;
  summary?: string;
  price?: string;
  wood?: string;
  availability?: string;
  image?: string;
  cover_image?: string;
  image_urls?: string[];
  slug?: string;
  status?: string;
  is_active?: boolean;
  featured?: boolean;
  is_featured?: boolean;
  featured_product?: boolean;
}

const defaultFeaturedProducts: Product[] = products.slice(0, 3);

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

const materialSwatches = [
  { name: 'Mahogany', description: 'Rich, warm undertones with deep luxury.', color: '#5b2b1e', previewImage: '/assets/19.webp' },
  { name: 'Walnut', description: 'Soft brown depth with velvety grain.', color: '#4a2b1d', previewImage: '/assets/living-room-cover.webp' },
  { name: 'Oak', description: 'Timeless golden warmth with crisp character.', color: '#aa7f57', previewImage: '/assets/hero/intro-picture.webp' },
  { name: 'Teak', description: 'Warm amber glow with durable appeal.', color: '#8f6236', previewImage: '/assets/outdoor-furniture.webp' },
  { name: 'Ebony', description: 'Bold dark finish with dramatic presence.', color: '#18120e' },
  { name: 'White Ash', description: 'Creamy neutral tone with subtle texture.', color: '#d9c9b1' },
  { name: 'Beeswax', description: 'Soft sheen and gentle honey warmth.', color: '#c79c50' },
  { name: 'Natural Oil', description: 'Matte richness that reveals grain beautifully.', color: '#b89a72' },
  { name: 'Resin Finish', description: 'Smooth polished surface with glass-like depth.', color: '#8e6a52' },
  { name: 'Rough Wood Finish', description: 'Textured surface with tactile natural character.', color: '#b9a083' },
];

const projectTimeline = [
  {
    title: 'Measurements',
    description: 'Detailed site dimensions ensure a precise fit.',
    Icon: Ruler,
  },
  {
    title: 'Design Approval',
    description: 'Review drawings and confirm the final direction.',
    Icon: CheckCircle2,
  },
  {
    title: 'Material Selection',
    description: 'Choose premium timbers, finishes, and detailing.',
    Icon: Leaf,
  },
  {
    title: 'Craftsmanship',
    description: 'Skilled joinery and finishing brings the design to life.',
    Icon: Hammer,
  },
  {
    title: 'Quality Inspection',
    description: 'Final checks ensure every detail meets our standards.',
    Icon: ShieldCheck,
  },
  {
    title: 'Delivery & Installation',
    description: 'Careful delivery and final installation at your site.',
    Icon: Truck,
  },
];

const statistics = [
  { label: 'Projects Completed', value: 100 },
  { label: 'Happy Clients', value: 100 },
  { label: 'Years Experience', value: 3 },
  { label: 'States Served', value: 11 },
];

const founderValues = [
  { title: 'Craftsmanship', Icon: Sparkles },
  { title: 'Quality Assurance', Icon: ShieldCheck },
  { title: 'Thoughtful Design', Icon: Leaf },
];

function formatStat(value: number) {
  return `${value}+`;
}

const testimonials = [
  {
    quote: 'The craftsmanship exceeded my expectations. The dining table feels incredibly solid, the finish is beautiful, and every detail was handled with care. The team was professional throughout the entire process.',
  },
  {
    quote: 'I wanted a custom TV console that matched my living room perfectly, and Oak Cherry Kraft delivered exactly what I had imagined. The quality of the woodwork is outstanding.',
  },
  {
    quote: 'From the first consultation to delivery, communication was excellent. The wardrobe was completed on schedule and looks even better than the design we discussed.',
  },
  {
    quote: 'I appreciate the attention to detail and the premium finish on my office desk. It\'s sturdy, elegant, and has completely transformed my workspace. I would definitely recommend Oak Cherry Kraft.',
  },
  {
    quote: 'The Design Your Furniture process made it easy to customise exactly what I wanted. The final piece was beautifully crafted and worth every penny.',
  },
];

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(defaultFeaturedProducts);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [projectOfMonth, setProjectOfMonth] = useState<Project | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsFeaturedLoading(true);
      setFeaturedError(null);

      try {
        const activeProducts = await getCachedData<Product[]>(`products:homepage-featured`, 10 * 60 * 1000, async () => {
          const { data, error } = await supabase
            .from('products')
            .select(featuredProductSelectColumns)
            .eq('status', 'published')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return (data ?? []) as Product[];
        });

        const featuredItems = activeProducts.filter(
          (product) =>
            product.featured === true ||
            product.is_featured === true ||
            product.featured_product === true
        );

        setFeaturedProducts(
          featuredItems.length > 0 ? featuredItems.slice(0, 4) : activeProducts.slice(0, 4)
        );
      } catch (error) {
        console.error('Featured products query error:', error);
        setFeaturedError(error instanceof Error ? error.message : 'Unable to load featured products.');
      } finally {
        setIsFeaturedLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadProjects = async () => {
      setIsProjectsLoading(true);
      setProjectsError(null);
      try {
        const [featured, projectOfMonthData] = await Promise.all([fetchFeaturedProjects(), fetchProjectOfMonth()]);
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

    void loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const [selectedSwatch, setSelectedSwatch] = useState(materialSwatches[0]);
  const previewImage = useMemo(() => selectedSwatch.previewImage ?? projectOfMonth?.cover_image ?? defaultProjectOfMonth.cover_image ?? '', [selectedSwatch, projectOfMonth?.cover_image]);

const normalizeCategorySlug = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const displayFeaturedProducts = featuredProducts.length > 0 ? featuredProducts : defaultFeaturedProducts;

  return (
    <PageContainer className="space-y-0 pb-16 sm:pb-20 pt-6">
      <Helmet>
        <title>Oak Cherry Kraft | Handcrafted furniture & bespoke commissions</title>
        <meta
          name="description"
          content="Oak Cherry Kraft Artistry Limited creates premium handcrafted furniture for homes, offices, and commercial spaces in Nigeria."
        />
      </Helmet>

      <HeroSection />

      <section className="container-wide mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {heroTrustBadges.map((badge) => (
          <Card
            key={badge.title}
            className="bg-white/95 rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4 min-h-[180px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ece2] text-[#aa7f57]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-bark">{badge.title}</h3>
              <p className="text-sm leading-6 text-bark/70">{badge.description}</p>
            </div>
          </Card>
        ))}
      </section>

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
              to={category.queryValue ? `/products?category=${encodeURIComponent(category.queryValue)}` : '/products'}
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
                    src={product.cover_image || product.image || product.image_urls?.[0] || ''}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-bark">{product.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-bark/70">{product.summary}</p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-bark/70">{product.wood}</p>
                    <Button variant="link" size="sm" asChild className="px-0">
                      <Link to={`/products/${normalizeCategorySlug(product.category)}/${product.slug ?? product.id}`}>View product</Link>
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

      <section className="section-gap">
        <div className="container-wide">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <div className="space-y-6">
              <SectionHeader
                eyebrow="Choose your finish"
                title="Material Swatches"
                description="Explore premium timber and finish options with subtle texture inspiration for your bespoke furniture project."
                className="max-w-3xl"
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {materialSwatches.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onMouseEnter={() => setSelectedSwatch(swatch)}
                    onFocus={() => setSelectedSwatch(swatch)}
                    className="group rounded-[1.75rem] border border-bark/10 bg-white p-4 text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:border-oak-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200"
                  >
                    <div
                      aria-hidden="true"
                      className="h-20 w-20 rounded-full shadow-inner"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <p className="mt-4 font-semibold text-bark">{swatch.name}</p>
                    <p className="mt-2 text-sm leading-6 text-bark/70">{swatch.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2rem] border border-bark/10 bg-sand shadow-soft"
            >
              <img
                src={previewImage}
                alt={`${selectedSwatch.name} finish preview`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-700 ease-brand hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-gradient-to-t from-bark/90 to-transparent p-6 text-sand">
                <p className="text-sm uppercase tracking-[0.35em] text-sand/80">Selected finish</p>
                <p className="mt-2 text-2xl font-semibold">{selectedSwatch.name}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
                      <p className="text-sm uppercase tracking-[0.3em] text-bark/60">Step {index + 1}</p>
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
                title="Crafting Timeless Furniture with Purpose"
                description="At Oak Cherry Kraft, every piece of furniture is designed with the belief that great craftsmanship creates lasting value. Under the leadership of Adeyemo Rhodes-Vivour, the company is committed to producing bespoke furniture that combines elegance, durability, and functionality."
                className="max-w-3xl"
              />

              <div className="space-y-4 text-base leading-8 text-bark/75">
                <p>Every project begins with understanding the client&apos;s vision. From handcrafted dining tables and wardrobes to custom office furniture and complete interior solutions, each piece is thoughtfully designed and carefully crafted to suit the space and lifestyle of its owner.</p>
                <p>Rather than producing furniture in volume, Oak Cherry Kraft focuses on quality, attention to detail, and personalised service. Every design reflects a commitment to premium materials, expert workmanship, and timeless aesthetics.</p>
              </div>

              <Card className="h-auto rounded-[1.75rem] border border-bark/10 bg-sand/80 p-6 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-oak-700">Founder quote</p>
                <blockquote className="mt-3 text-2xl font-display leading-tight text-bark">"Great furniture isn't just built to fill a space—it's crafted to become part of the stories created within it."</blockquote>
                <div className="mt-4 text-sm leading-7 text-bark/75">
                  <p className="font-semibold text-bark">Adeyemo Rhodes-Vivour</p>
                  <p>Founder, Oak Cherry Kraft</p>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {founderValues.map((value) => (
                  <Card key={value.title} className="rounded-[1.75rem] border border-bark/10 bg-white p-5 shadow-sm">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
                      <value.Icon size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-bark">{value.title}</p>
                  </Card>
                ))}
              </div>
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
        <TestimonialsSection>
          <SectionHeader
          eyebrow="Client stories"
          title="The details people remember."
          description="Our work is measured not only in finish and form, but in how beautifully it becomes part of everyday life."
          className="mb-8"
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="rounded-[1.75rem] border border-bark/10 bg-white p-8 shadow-soft">
              <p className="text-sm tracking-[0.22em] text-clay" aria-label="Five stars">★★★★★</p>
              <blockquote className="mt-5 font-display text-2xl leading-snug text-bark">&ldquo;{testimonial.quote}&rdquo;</blockquote>
            </Card>
          ))}
        </div>
      </TestimonialsSection>

      <section className="section-gap bg-sand/10">
        <div className="container-wide">
          <SectionHeader
            eyebrow="Established excellence"
            title="Craftsmanship backed by meaningful metrics"
            description="Subtle, animated statistics that reflect our dedication to quality workmanship, client satisfaction, and long-lasting luxury."
            className="mb-8 max-w-3xl"
          />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map((stat, index) => (
              <motion.article
                key={stat.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
                className="rounded-[1.75rem] border border-bark/10 bg-white p-8 shadow-soft"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-bark/60">{stat.label}</p>
                <p className="mt-6 text-5xl font-semibold text-bark">{formatStat(stat.value)}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

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
              <a href="https://wa.me/2340000000000">WhatsApp us</a>
            </Button>
          </div>
        </div>
        </CallToActionSection>
      </Suspense>
    </PageContainer>
  );
}
