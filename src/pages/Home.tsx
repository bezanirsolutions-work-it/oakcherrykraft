import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Hammer,
  Leaf,
  MapPin,
  Ruler,
  ShieldCheck,
  Truck,
  ChevronRight,
} from 'lucide-react';
import {
  BrandIntroductionSection,
  CallToActionSection,
  CraftsmanshipProcessSection,
  FeaturedCollectionsSection,
  FeaturedProjectsSection,
  HeroSection,
  SustainabilitySection,
  TestimonialsSection,
  WhyChooseSection,
} from '../components/sections';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Button, Card, SectionHeader } from '../components/ui';
import { SectionTitle } from '../components/base/SectionTitle';
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

const lift = {
  whileHover: { y: -4, transition: { duration: 0.25, ease: 'easeOut' } },
};

const categoryCards = [
  { title: 'Dining Tables', description: 'Sculptural centrepieces made for long conversations and memorable gatherings.', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1100&q=85' },
  { title: 'Living Room Furniture', description: 'Warm, considered forms that bring depth and ease to everyday living.', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1100&q=85' },
  { title: 'Bedroom Furniture', description: 'Quietly luxurious pieces designed around rest, ritual, and lasting comfort.', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85' },
  { title: 'Office Furniture', description: 'Confident executive desks and storage that make focused work feel elevated.', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=85' },
  { title: 'Kitchen Cabinets', description: 'Tailored cabinetry with practical intelligence and a beautiful material presence.', image: 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=1100&q=85' },
  { title: 'Outdoor Furniture', description: 'Durable outdoor forms for slow mornings, open-air dinners, and generous hosting.', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85' },
];

const benefits = [
  { title: 'Premium Craftsmanship', description: 'Every detail is meticulously handcrafted by experienced artisans.', Icon: Hammer },
  { title: 'Sustainable Materials', description: 'Responsibly sourced hardwoods and environmentally conscious production.', Icon: Leaf },
  { title: 'Tailored Designs', description: 'Furniture designed around your taste, lifestyle, and space.', Icon: Ruler },
  { title: 'Reliable Delivery', description: 'Professional installation and dependable nationwide delivery.', Icon: Truck },
];

const projects = [
  { title: 'Modern Executive Office', location: 'Abuja', description: 'Luxury walnut executive workspace.', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85' },
  { title: 'Contemporary Dining Space', location: 'Lagos', description: 'Custom eight-seater dining collection.', image: 'https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85' },
  { title: 'Luxury Bedroom Suite', location: 'Kaduna', description: 'Complete bespoke bedroom installation.', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85' },
];

const processSteps = [
  ['01', 'Consultation', 'We listen, measure, and understand how you want the space to live.'],
  ['02', 'Design', 'Our studio develops a considered direction around your brief and budget.'],
  ['03', 'Material Selection', 'You choose from premium hardwoods, finishes, and tactile details.'],
  ['04', 'Production', 'Master craftsmen shape and assemble your furniture with precision.'],
  ['05', 'Quality Inspection', 'Every piece is checked for structure, finish, balance, and detail.'],
  ['06', 'Delivery & Installation', 'We deliver, install, and leave your space ready to enjoy.'],
];

const testimonials = [
  { quote: 'Oak Cherry Kraft transformed our home beyond expectations. Every piece reflects outstanding craftsmanship.', name: 'Amina Yusuf', city: 'Abuja', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80' },
  { quote: 'Professional service from consultation to installation. Exceptional quality.', name: 'David Okeke', city: 'Lagos', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80' },
  { quote: 'Beautiful furniture, timely delivery, and incredible attention to detail.', name: 'Fatima Ibrahim', city: 'Kaduna', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80' },
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
        <SectionTitle level={1} eyebrow="Oak Cherry Kraft Artistry Limited" title="Handcrafted Furniture That Defines Exceptional Living" description="Transform your home, office, or commercial space with bespoke furniture designed by master craftsmen. Every piece combines timeless elegance, premium craftsmanship, and lasting durability." />
      </HeroSection>

      <BrandIntroductionSection>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} className="space-y-6">
            <SectionTitle eyebrow="About the studio" title="Crafted with Passion. Built to Last." description="At Oak Cherry Kraft Artistry Limited, we believe furniture should do more than fill a room—it should define it." />
            <p className="max-w-2xl text-base leading-8 text-bark/70">Since 2023, we&apos;ve been creating handcrafted wooden furniture that blends contemporary elegance with timeless craftsmanship. Every project is tailored to our clients&apos; vision using premium hardwoods and exceptional attention to detail.</p>
            <Button variant="secondary" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}><Link to="/about">Learn more</Link></Button>
          </motion.div>
          <AnimatedImage src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85" alt="Warm contemporary interior with handcrafted wood furniture" aspectRatio="4 / 3" overlay />
        </div>
      </BrandIntroductionSection>

      <FeaturedCollectionsSection>
        <SectionHeader eyebrow="Explore the collection" title="Furniture for the way you want to live." description="From a statement dining table to a complete bespoke installation, each piece is made to feel unmistakably yours." className="mb-10" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((category) => (
            <MotionLink key={category.title} to="/products" variants={reveal} whileHover={{ scale: 1.02 }} className="group relative block min-h-[310px] overflow-hidden rounded-[1.5rem] bg-bark text-sand shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 transition-transform duration-300">
              <img src={category.image} alt={`${category.title} collection`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-bark/90 via-bark/25 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7"><p className="max-w-xs text-sm leading-6 text-sand/80">{category.description}</p><div className="mt-4 flex items-center justify-between gap-4"><h3 className="font-display text-2xl font-semibold text-sand">{category.title}</h3><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand/40 transition duration-300 group-hover:bg-sand group-hover:text-bark" aria-hidden="true"><ChevronRight size={18} /></span></div></div>
            </MotionLink>
          ))}
        </motion.div>
      </FeaturedCollectionsSection>

      <WhyChooseSection>
        <SectionHeader eyebrow="The Oak Cherry Kraft difference" title="A more considered way to furnish your world." description="We pair a personal studio experience with the discipline, reliability, and finish expected from a premium furniture brand." className="mb-10" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={sectionStagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ title, description, Icon }) => (
            <motion.div key={title} variants={reveal} whileHover={{ y: -4 }} className="transition-transform duration-300">
              <Card className="border-bark/10 bg-white/75">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-oak-100 text-oak-700" aria-hidden="true"><Icon size={22} /></span>
                <h3 className="mt-6 text-xl font-semibold text-bark">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-bark/70">{description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </WhyChooseSection>

      <FeaturedProjectsSection>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><SectionHeader eyebrow="Selected work" title="Spaces made memorable." description="A glimpse into the homes, workspaces, and hospitality environments shaped by our studio." /><Button variant="link" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}><Link to="/projects">View all projects</Link></Button></div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={sectionStagger} className="mt-10 grid gap-5 lg:grid-cols-3">
          {featuredProjects.map((project) => <motion.article key={project.id} variants={reveal} className="group overflow-hidden rounded-[1.5rem] border border-bark/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-medium focus-within:outline-none focus-within:ring-4 focus-within:ring-oak-200 focus-within:ring-offset-2 focus-within:ring-offset-white"><div className="relative aspect-[4/3] overflow-hidden"><img src={project.image} alt={`${project.title} project in ${project.category}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 ease-brand group-hover:scale-105" /><span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-bark shadow-soft"><MapPin size={13} aria-hidden="true" />{project.category}</span></div><div className="p-6"><h3 className="text-2xl font-semibold text-bark">{project.title}</h3><p className="mt-2 text-sm leading-7 text-bark/70">{project.description}</p><Button variant="link" size="sm" asChild className="mt-5 px-0" icon={<ArrowUpRight size={16} aria-hidden="true" />}><Link to={`/projects/${project.id}`}>View project</Link></Button></div></motion.article>)}
        </motion.div>
      </FeaturedProjectsSection>

      <CraftsmanshipProcessSection>
        <SectionHeader eyebrow="From idea to heirloom" title="A process built around your vision." description="Every commission moves through a clear, collaborative journey with thoughtful decisions at every stage." className="mb-12" />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={sectionStagger} className="grid gap-8 md:grid-cols-3 lg:grid-cols-6">
          {processSteps.map(([number, title, description], index) => <motion.div key={number} variants={reveal} className="relative"><div className="flex items-center gap-4 md:block"><span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-oak-500 bg-sand text-sm font-semibold text-oak-700">{number}</span>{index < processSteps.length - 1 ? <span className="hidden h-px flex-1 bg-oak-500/30 md:absolute md:left-12 md:right-[-2rem] md:top-6 md:block" aria-hidden="true" /> : null}<h3 className="font-display text-xl font-semibold text-bark md:mt-6">{title}</h3></div><p className="mt-3 pl-16 text-sm leading-6 text-bark/65 md:pl-0">{description}</p></motion.div>)}
        </motion.div>
      </CraftsmanshipProcessSection>

      <SustainabilitySection>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16"><div><SectionHeader eyebrow="Built with intention" title="Beauty that respects where it comes from." description="We choose premium materials with care, build for longevity, and keep our production intentionally focused so less is wasted." /><div className="mt-7 flex flex-wrap gap-3 text-sm font-medium text-bark/75"><span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-soft"><Leaf size={16} className="text-oak-600" aria-hidden="true" />Responsible hardwoods</span><span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-soft"><ShieldCheck size={16} className="text-oak-600" aria-hidden="true" />Built for generations</span></div></div><AnimatedImage src="https://images.unsplash.com/photo-1586023492125-27b2c045cef7?auto=format&fit=crop&w=1400&q=85" alt="Natural wood furniture and materials in a calm interior" aspectRatio="16 / 9" overlay /></div>
      </SustainabilitySection>

      <TestimonialsSection>
        <SectionHeader eyebrow="Client stories" title="The details people remember." description="Our work is measured not only in finish and form, but in how beautifully it becomes part of everyday life." className="mb-10" />
        <div className="grid gap-5 lg:grid-cols-3">{testimonials.map((testimonial) => <Card key={testimonial.name} className="bg-white"><p className="text-sm tracking-[0.22em] text-clay" aria-label="Five stars">★★★★★</p><blockquote className="mt-5 font-display text-2xl leading-snug text-bark">&ldquo;{testimonial.quote}&rdquo;</blockquote><div className="mt-7 flex items-center gap-3 border-t border-bark/10 pt-5"><img src={testimonial.avatar} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover" /><div><p className="text-sm font-semibold text-bark">{testimonial.name}</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-bark/55">{testimonial.city}</p></div></div></Card>)}</div>
      </TestimonialsSection>

      <CallToActionSection>
        <div className="mx-auto max-w-3xl text-center"><SectionTitle eyebrow="Your space, elevated" title="Ready to Transform Your Space?" description="Let&apos;s create handcrafted furniture designed exclusively for your home, office, or commercial project." inverse className="mx-auto" /><div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row"><Button size="lg" asChild><Link to="/quote">Get free consultation</Link></Button><Button variant="secondary" size="lg" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}><a href="https://wa.me/2340000000000">WhatsApp us</a></Button></div></div>
      </CallToActionSection>

      <BrandIntroductionSection>
        <div className="grid gap-8 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-card sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Start a project</p><h2 className="mt-4 font-display text-3xl font-semibold text-bark sm:text-4xl">Tell us what you&apos;re imagining.</h2><p className="mt-3 max-w-2xl text-base leading-8 text-bark/70">Share your space, your inspiration, and the way you want it to feel. Our studio will be in touch.</p></div><Button asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}><Link to="/quote">Contact the studio</Link></Button></div>
      </BrandIntroductionSection>
    </PageContainer>
  );
}
