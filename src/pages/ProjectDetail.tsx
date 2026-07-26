import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { projects } from '../data/projects';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Button, Card, Breadcrumb, EmptyState, SectionHeader } from '../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function ProjectDetail() {
  const { projectId } = useParams();
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projectId]);

  if (!project) {
    return (
      <PageContainer className="space-y-10 pb-20">
        <EmptyState
          title="Project not found"
          description="The project you requested does not exist. Explore our portfolio or contact the studio for more examples."
          action={<Button asChild><Link to="/projects">View portfolio</Link></Button>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>{project.title} | Oak Cherry Kraft</title>
        <meta name="description" content={project.description} />
      </Helmet>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Portfolio', path: '/projects' }, { label: project.title }]} />
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="space-y-10">
        <SectionHeader eyebrow="Project details" title={project.title} description={project.description} />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
          <div className="space-y-8">
            <AnimatedImage src={project.image} alt={project.title} aspectRatio="16 / 10" overlay objectFit="contain" />
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Project type</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.category || 'Featured commission'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Style</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.style || 'Architectural custom woodwork'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Configuration</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.configuration || 'Custom layout'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Tread thickness</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.treadThickness || 'Custom solid timber'}</p>
              </Card>
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Overview</p>
              <p className="mt-4 text-base leading-8 text-bark/75">{project.description}</p>
            </Card>
            <Card className="bg-sand">
              <div className="flex items-center gap-3 text-bark/80">
                <MapPin size={18} aria-hidden="true" />
                <p>Studio and delivery available nationwide.</p>
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <Button asChild>
                  <Link to="/contact">Request estimates</Link>
                </Button>
                <Button variant="secondary" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
                  <Link to="/quote">Request quote</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Details</p>
            <div className="mt-4 space-y-4 text-bark/75">
              {project.structure ? (
                <div>
                  <p className="font-semibold text-bark">Structure</p>
                  <p>{project.structure}</p>
                </div>
              ) : null}
              {project.installation ? (
                <div>
                  <p className="font-semibold text-bark">Installation</p>
                  <p>{project.installation}</p>
                </div>
              ) : null}
              {project.summary ? (
                <div>
                  <p className="font-semibold text-bark">Highlights</p>
                  <p>{project.summary}</p>
                </div>
              ) : null}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Features</p>
            <ul className="mt-4 space-y-3 text-bark/75 list-disc list-inside">
              {(project.features || []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </Card>
        </div>
        {project.specifications?.length ? (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Specifications</p>
            <ul className="mt-4 space-y-3 text-bark/75 list-disc list-inside">
              {project.specifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ) : null}
      </motion.section>
    </PageContainer>
  );
}
