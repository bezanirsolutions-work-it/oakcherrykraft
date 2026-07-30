import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Filter, Search } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { AnimatedImage, Badge, Button, Card, Breadcrumb, EmptyState, SectionHeader } from '../components/ui';
import { fetchProjects, type Project } from '../lib/projects';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const projectCategories = ['All', 'Residential', 'Commercial', 'Hospitality', 'Office', 'Custom Furniture', 'Outdoor', 'Bedroom', 'Living Room', 'Dining', 'Kitchen'];
const sortOptions = [
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'title', label: 'Title A–Z' },
];

export function ProjectPortfolio() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProjects();
        if (mounted) {
          setProjects(data.filter((project) => project.show_in_gallery !== false));
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load projects.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...projects]
      .filter((project) => project.show_in_gallery !== false)
      .filter((project) => filter === 'All' || project.category === filter)
      .filter((project) => {
        if (!normalizedSearch) return true;
        return [project.title, project.description, project.category, project.location]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        if (sortBy === 'updated_at') {
          return (right.updated_at ?? '').localeCompare(left.updated_at ?? '');
        }

        if (sortBy === 'title') {
          return (left.title ?? '').localeCompare(right.title ?? '');
        }

        return (left.title ?? '').localeCompare(right.title ?? '');
      });
  }, [filter, projects, search, sortBy]);

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>Portfolio | Oak Cherry Kraft</title>
        <meta name="description" content="Browse our portfolio of crafted furniture and bespoke project installations." />
      </Helmet>
      <PageHeader title="Project Portfolio" subtitle="Browse completed commissions and get inspired by projects that balance craft, comfort, and architectural presence." showBreadcrumb />
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Portfolio' }]} className="pt-6" />
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-2 text-sm text-bark/70 shadow-sm">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                className="w-36 bg-transparent outline-none sm:w-48"
              />
            </label>
            <label className="flex items-center gap-2 rounded-full border border-bark/10 bg-white px-4 py-2 text-sm text-bark/70 shadow-sm">
              <Filter size={16} aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-transparent outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-bark/75">
              <Filter size={18} aria-hidden="true" />
              {filteredProjects.length} projects
            </div>
          </div>
        </div>
      </motion.section>

      {isLoading ? (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`project-skeleton-${index}`} className="overflow-hidden rounded-[2rem] border border-bark/10 bg-white shadow-soft">
              <div className="aspect-[4/3] animate-pulse bg-bark/10" />
              <div className="space-y-3 p-6">
                <div className="h-4 w-24 animate-pulse rounded-full bg-bark/10" />
                <div className="h-7 w-3/4 animate-pulse rounded-full bg-bark/10" />
                <div className="h-4 w-full animate-pulse rounded-full bg-bark/10" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-bark/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {error}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match this filter"
          description="Try another category, search term, or browse the full portfolio instead."
          action={<Button asChild><Link to="/projects">Reset filter</Link></Button>}
        />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden p-0">
              <AnimatedImage src={project.cover_image || ''} alt={project.title} aspectRatio="4 / 3" />
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
                    <Link to={`/projects/${project.slug}`}>View project</Link>
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
