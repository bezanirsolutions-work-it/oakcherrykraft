import { SEO } from '../components/layout/SEO';
import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/base/Button';

export function NotFound() {
  const location = useLocation();

  return (
    <PageContainer className="space-y-8 pb-20">
      <SEO
        title="Page not found | Oak Cherry Kraft"
        description="The page you requested could not be found. Return to the homepage to browse our furniture collection."
        url={`https://oakcherrykraft.com${location.pathname}`}
      />
      <PageHeader title="Page Not Found" subtitle="The page you requested could not be found. Return to the homepage to continue exploring our handcrafted furniture collection." />
      <div className="rounded-[2rem] border border-bark/10 bg-white p-12 shadow-soft text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-oak-700">Page not found</p>
        <h1 className="text-4xl font-semibold text-bark">We could not find that page.</h1>
        <p className="mt-4 text-base leading-8 text-bark/75">Return to the homepage and continue exploring our handcrafted furniture collection.</p>
        <div className="mt-8 inline-flex rounded-full border border-bark/10 bg-sand p-1">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
