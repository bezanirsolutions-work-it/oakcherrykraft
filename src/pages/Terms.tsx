import { SEO } from '../components/layout/SEO';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';

export function Terms() {
  return (
    <PageContainer className="space-y-10 pb-16 sm:pb-20">
      <SEO
        title="Terms | Oak Cherry Kraft"
        description="Read the general website terms for using the Oak Cherry Kraft website, enquiry form, and custom furniture request experience."
        url="https://oakcherrykraft.com/terms"
      />

      <PageHeader
        title="Terms"
        subtitle="General website usage and enquiry terms."
        showBreadcrumb
      />

      <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="space-y-5 text-sm leading-7 text-bark/75">
          <p>
            By using the Oak Cherry Kraft website, you agree to use it responsibly and for lawful purposes only. Any enquiry, quote request, or custom design brief submitted through this site should be accurate, complete, and relevant to the service being requested.
          </p>
          <p>
            Furniture specifications, concepts, and pricing shared through this website are for estimation and consultation purposes. Final scope, lead times, and commercial terms may be confirmed directly with our studio team.
          </p>
          <p>
            We reserve the right to update, revise, or remove content from this site at any time. Where a request or submission cannot be processed, we will communicate the relevant next step as promptly as possible.
          </p>
          <p>
            For direct assistance, contact our team at <a className="text-oak-700 underline" href="mailto:oakcherrykraft@gmail.com">oakcherrykraft@gmail.com</a>.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/contact" className="rounded-full bg-bark px-5 py-3 text-sm font-semibold text-sand">Contact us</Link>
          <Link to="/privacy-policy" className="rounded-full border border-bark-10 bg-sand px-5 py-3 text-sm font-semibold text-bark">Read Privacy Policy</Link>
        </div>
      </section>
    </PageContainer>
  );
}
