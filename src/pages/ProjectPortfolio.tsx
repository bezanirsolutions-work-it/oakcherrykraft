import { Helmet } from 'react-helmet-async';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Filter } from 'lucide-react';
import { projects } from '../data/projects';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Badge, Button, Card, Breadcrumb, EmptyState, SectionHeader } from '../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const projectCategories = ['All', 'Residential', 'Commercial', 'Hospitality'];

export function ProjectPortfolio() {
  const [filter, setFilter] = useState('All');
  const filteredProjects = useMemo(
    () => projects.filter((project) => filter === 'All' || project.category === filter),
    [filter]
  );

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>Portfolio | Oak Cherry Kraft</title>
        <meta name="description" content="Browse our portfolio of crafted furniture and bespoke project installations." />
      </Helmet>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Portfolio' }]} />
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
        <SectionHeader eyebrow="Project portfolio" title="A curated selection of our recent work" description="Browse completed commissions and get inspired by projects that balance craft, comfort, and architectural presence." />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            {projectCategories.map((category) => (
              <Button
                key={category}
                variant={filter === category ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(category)}
                className="rounded-full px-4"
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-bark/75">
            <Filter size={18} aria-hidden="true" />
            {filteredProjects.length} projects
          </div>
        </div>
      </motion.section>

      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match this filter"
          description="Try another category or browse the full portfolio instead."
          action={<Button asChild><Link to="/projects">Reset filter</Link></Button>}
        />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden p-0">
              <AnimatedImage src={project.image} alt={project.title} aspectRatio="4 / 3" />
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-bark">{project.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-bark/75">{project.description}</p>
                  </div>
                  <Badge className="bg-oak-100 text-oak-700">Featured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="link" size="sm" asChild icon={<ArrowUpRight size={16} aria-hidden="true" />}>
                    <Link to={`/projects/${project.id}`}>View project</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
