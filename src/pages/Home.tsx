import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  Leaf,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  CallToActionSection,
  FeaturedCollectionsSection,
  FeaturedProjectsSection,
  HeroSection,
  TestimonialsSection,
} from '../components/sections';
import { PageContainer } from '../components/layout/PageContainer';
import { Button, Card, SectionHeader } from '../components/ui';
import { SectionTitle } from '../components/base/SectionTitle';
import { products } from '../data/products';
import { projects as featuredProjects } from '../data/projects';

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
  { title: 'Dining Tables', description: 'Sculptural centrepieces made for long conversations and memorable gatherings.', image: '/assets/hero/intro-picture.png' },
  { title: 'Living Room Furniture', description: 'Warm, considered forms that bring depth and ease to everyday living.', image: '/assets/living-room-cover.jpeg' },
  { title: 'Bedroom Furniture', description: 'Quietly luxurious pieces designed around rest, ritual, and lasting comfort.', image: '/assets/bedroom-furniture-cover.jpeg' },
  { title: 'Office Furniture', description: 'Confident executive desks and storage that make focused work feel elevated.', image: '/assets/office-furniture-cover.jpeg' },
  { title: 'Kitchen Furniture', description: 'Tailored cabinetry and fitted storage with practical intelligence and a beautiful material presence.', image: '/assets/19.jpeg' },
  { title: 'Outdoor Furniture', description: 'Durable outdoor forms for slow mornings, open-air dinners, and generous hosting.', image: '/assets/outdoor-furniture.jpeg' },
];

const featuredProducts = products.slice(0, 3);

const founderValues = [
  { title: 'Premium Quality Materials', Icon: ShieldCheck },
  { title: 'Expert Craftsmanship', Icon: Leaf },
  { title: 'Bespoke Furniture Design', Icon: Ruler },
  { title: 'Timeless & Sustainable Solutions', Icon: Sparkles },
  { title: 'Personalised Client Experience', Icon: MapPin },
  { title: 'Exceptional Attention to Detail', Icon: Truck },
];

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
  return (
    <PageContainer className="space-y-0 pb-16 sm:pb-20">
      <Helmet>
        <title>Oak Cherry Kraft | Handcrafted furniture & bespoke commissions</title>
        <meta
          name="description"
          content="Oak Cherry Kraft Artistry Limited creates premium handcrafted furniture for homes, offices, and commercial spaces in Nigeria."
        />
      </Helmet>

      <HeroSection>
        <SectionTitle
          level={1}
          eyebrow="Oak Cherry Kraft Artistry Limited"
          title="Handcrafted Furniture That Defines Exceptional Living"
          description="Transform your home, office, or commercial space with bespoke furniture designed by master craftsmen. Every piece combines timeless elegance, premium craftsmanship, and lasting durability."
        />
      </HeroSection>

      <FeaturedCollectionsSection>
        <SectionHeader
          eyebrow="Explore the collection"
          title="Furniture for the way you want to live."
          description="From a statement dining table to a complete bespoke installation, each piece is made to feel unmistakably yours."
          className="mb-10"
        />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => (
            <MotionLink
              key={category.title}
              to="/products"
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

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="mt-8 grid gap-5 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <motion.article
                key={product.id}
                variants={reveal}
                className="group overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium focus-within:outline-none focus-within:ring-4 focus-within:ring-oak-200 focus-within:ring-offset-2 focus-within:ring-offset-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={product.image}
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
                      <Link to={`/products/${product.id}`}>View product</Link>
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-gap">
        <div className="container-wide">
          <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr] xl:items-center xl:gap-12">
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
              className="space-y-6"
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
          </div>
        </div>
      </section>

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
            {featuredProjects.map((project) => (
              <motion.article
                key={project.id}
                variants={reveal}
                className="group overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium focus-within:outline-none focus-within:ring-4 focus-within:ring-oak-200 focus-within:ring-offset-2 focus-within:ring-offset-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.image}
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
                    <Link to={`/projects/${project.id}`}>View project</Link>
                  </Button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </FeaturedProjectsSection>

      <TestimonialsSection>
        <SectionHeader
          eyebrow="Client stories"
          title="The details people remember."
          description="Our work is measured not only in finish and form, but in how beautifully it becomes part of everyday life."
          className="mb-10"
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

      <CallToActionSection>
        <div className="mx-auto max-w-3xl text-center">
          <SectionTitle
            eyebrow="Your space, elevated"
            title="Ready to Transform Your Space?"
            description="Let&apos;s create handcrafted furniture designed exclusively for your home, office, or commercial project."
            inverse
            className="mx-auto"
          />
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/request-quote">Get free consultation</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <a href="https://wa.me/2340000000000">WhatsApp us</a>
            </Button>
          </div>
        </div>
      </CallToActionSection>
    </PageContainer>
  );
}
