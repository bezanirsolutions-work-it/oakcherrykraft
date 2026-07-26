import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Eye, Heart, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Button, Card, SectionHeader } from '../components/ui';

const trustPoints = [
  'Premium hardwoods selected for grain, strength, and character.',
  'A clear, collaborative process from first sketch to installation.',
  'Furniture made to live beautifully in homes, offices, hotels, and commercial spaces.',
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const sectionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const cardLift = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
};

export function About() {
  return (
    <PageContainer className="space-y-16 pb-16 sm:space-y-24 sm:pb-20">
      <Helmet>
        <title>About | Oak Cherry Kraft</title>
        <meta name="description" content="Learn about Oak Cherry Kraft Artistry Limited, our craftsmanship, process, and furniture philosophy." />
      </Helmet>
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Our story</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-bark sm:text-6xl">Crafted with Passion. Built to Last.</h1>
          <p className="max-w-xl text-lg leading-8 text-bark/70">At Oak Cherry Kraft Artistry Limited, we believe furniture should do more than fill a room—it should define it.</p>
          <Button asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}><Link to="/contact">Start a conversation</Link></Button>
        </motion.div>
        <AnimatedImage src="/assets/about-page.jpeg" alt="Oak Cherry Kraft workshop and furniture" aspectRatio="3 / 5" overlay priority objectFit="contain" className="bg-sand object-center" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
          <Card className="bg-white">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-oak-100 text-oak-700" aria-hidden="true"><Heart size={22} /></span>
            <h2 className="mt-6 font-display text-3xl font-semibold text-bark">Our mission</h2>
            <p className="mt-3 text-base leading-8 text-bark/70">To create furniture that brings beauty, comfort, and purpose into the spaces where life unfolds.</p>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
          <Card className="bg-bark text-sand">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sand/10 text-clay" aria-hidden="true"><Eye size={22} /></span>
            <h2 className="mt-6 font-display text-3xl font-semibold text-sand">Our vision</h2>
            <p className="mt-3 text-base leading-8 text-sand/75">To become a trusted Nigerian furniture house known for thoughtful design, enduring craft, and responsible making.</p>
          </Card>
        </motion.div>
        <motion.div variants={fadeIn} whileHover={{ y: -4 }} className="transition-transform duration-300">
          <Card className="bg-white">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-oak-100 text-oak-700" aria-hidden="true"><Leaf size={22} /></span>
            <h2 className="mt-6 font-display text-3xl font-semibold text-bark">Our promise</h2>
            <p className="mt-3 text-base leading-8 text-bark/70">To listen closely, make carefully, communicate honestly, and deliver pieces worthy of being kept.</p>
          </Card>
        </motion.div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="order-2 lg:order-1"><AnimatedImage src="https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1400&q=85" alt="Artisan working with wood in a workshop" aspectRatio="4 / 5" overlay /></div>
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="order-1 space-y-6 lg:order-2">
          <SectionHeader eyebrow="Company story" title="From ordinary timber to extraordinary furniture." description="Founded in 2023, Oak Cherry Kraft Artistry Limited was born from a passion for transforming ordinary timber into extraordinary furniture. Inspired by nature and driven by creativity, our workshop combines traditional woodworking techniques with contemporary design to craft furniture that tells a story." />
          <p className="text-base leading-8 text-bark/70">Every grain of wood carries character, every curve is carefully sculpted, and every piece is handcrafted to become part of the memories made in homes, offices, hotels, and commercial spaces.</p>
          <p className="text-base leading-8 text-bark/70">Today, Oak Cherry Kraft serves discerning clients across Nigeria, creating bespoke furniture that balances beauty, comfort, durability, and sustainability.</p>
        </motion.div>
      </section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn} className="grid gap-8 rounded-[2rem] bg-sand p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <SectionHeader eyebrow="Why clients trust us" title="A personal studio experience, backed by serious craft." description="We make the process feel clear and considered, with the detail and reliability expected from a premium furniture partner." />
        <ul className="space-y-5">{trustPoints.map((point) => <li key={point} className="flex gap-4 text-base leading-7 text-bark/75"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-oak-600" aria-hidden="true" /><span>{point}</span></li>)}</ul>
      </motion.section>

      <section className="space-y-10">
        <SectionHeader eyebrow="Inside the workshop" title="Where material becomes meaning." description="Our workshop is a place for patience, precision, and the tactile decisions that make every piece distinct." />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }} variants={sectionStagger} className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={fadeIn} whileHover={{ scale: 1.02 }} className="transition-transform duration-300">
            <AnimatedImage src="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1400&q=85" alt="Woodworking tools and workshop materials" aspectRatio="16 / 10" overlay />
          </motion.div>
          <motion.div variants={fadeIn} whileHover={{ scale: 1.02 }} className="transition-transform duration-300">
            <AnimatedImage src="https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1100&q=85" alt="Close detail of crafted wooden furniture" aspectRatio="4 / 5" overlay />
          </motion.div>
        </motion.div>
      </section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn} className="rounded-[2rem] bg-bark px-7 py-12 text-center sm:px-12 sm:py-16">
        <SectionHeader eyebrow="Build something meaningful" title="Let&apos;s shape the piece your space has been waiting for." description="Bring us your room, your reference points, or simply an idea. We&apos;ll help you turn it into furniture with a future." className="mx-auto [&_h2]:text-sand [&_p]:text-sand/75 [&_p:first-child]:text-clay" />
        <Button size="lg" asChild className="mt-8"><Link to="/contact">Work with our studio</Link></Button>
      </motion.section>
    </PageContainer>
  );
}
