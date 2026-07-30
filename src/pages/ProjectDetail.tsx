import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Button, Card, Breadcrumb, EmptyState, SectionHeader } from '../components/ui';
import { fetchProject, type Project } from '../lib/projects';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = slug ? await fetchProject(slug) : null;
        if (mounted) setProject(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load project.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProject();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <PageContainer className="space-y-10 pb-20">
        <div className="rounded-[2rem] border border-bark/10 bg-white p-12 text-center text-sm text-bark/70">
          Loading project…
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="space-y-10 pb-20">
        <EmptyState
          title="Project not found"
          description={error}
          action={<Button asChild><Link to="/projects">View portfolio</Link></Button>}
        />
      </PageContainer>
    );
  }

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
      <PageHeader title={project.title} subtitle={project.description} showBreadcrumb />
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Portfolio', path: '/projects' }, { label: project.title }]} className="pt-6" />
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="space-y-10">
        <SectionHeader eyebrow="Project details" title={project.title} description={project.description} />
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
          <div className="space-y-8">
            <AnimatedImage src={project.cover_image || ''} alt={project.title} aspectRatio="16 / 10" overlay objectFit="contain" />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Client</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.client_name || 'Private client'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Completion</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.completion_date || 'On request'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Budget</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.budget_range || 'Available on request'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Wood species</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.wood_species || 'Custom specification'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Finish</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.finish || 'Custom finish'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Location</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.location || 'Custom placement'}</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Status</p>
                <p className="mt-3 text-lg font-semibold text-bark">{project.status || 'Completed'}</p>
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
                  <Link to="/request-quote">Request quote</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
        {(project.before_image || project.after_image) ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {project.before_image ? (
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Before</p>
                <AnimatedImage src={project.before_image} alt={`${project.title} before`} aspectRatio="4 / 3" className="mt-4" />
              </Card>
            ) : null}
            {project.after_image ? (
              <Card>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">After</p>
                <AnimatedImage src={project.after_image} alt={`${project.title} after`} aspectRatio="4 / 3" className="mt-4" />
              </Card>
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Project details</p>
            <div className="mt-4 space-y-4 text-bark/75">
              {project.category ? (
                <div>
                  <p className="font-semibold text-bark">Project type</p>
                  <p>{project.category}</p>
                </div>
              ) : null}
              {project.description ? (
                <div>
                  <p className="font-semibold text-bark">Highlights</p>
                  <p>{project.description}</p>
                </div>
              ) : null}
              {project.duration ? (
                <div>
                  <p className="font-semibold text-bark">Duration</p>
                  <p>{project.duration}</p>
                </div>
              ) : null}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Materials</p>
            <p className="mt-4 text-bark/75">{project.wood_species || 'Custom specification'}</p>
          </Card>
        </div>
        {project.gallery_images?.length ? (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Gallery</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {project.gallery_images.map((image) => (
                <img key={image} src={image} alt={`${project.title} gallery`} className="h-48 w-full rounded-[1.5rem] object-cover" />
              ))}
            </div>
          </Card>
        ) : null}
      </motion.section>
    </PageContainer>
  );
}
