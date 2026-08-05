import { SEO } from '../components/layout/SEO';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';

export function PrivacyPolicy() {
  return (
    <PageContainer className="space-y-10 pb-16 sm:pb-20">
      <SEO
        title="Privacy Policy | Oak Cherry Kraft"
        description="Learn how Oak Cherry Kraft handles customer enquiries, contact submissions, and website analytics in line with privacy expectations."
        url="https://oakcherrykraft.com/privacy-policy"
      />

      <PageHeader
        title="Privacy Policy"
        subtitle="How we handle your information and respect your privacy."
        showBreadcrumb
      />

      <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="space-y-5 text-sm leading-7 text-bark/75">
          <p>
            Oak Cherry Kraft respects the privacy of visitors to our website. We only collect information that is necessary to respond to enquiries, process quote requests, and improve the customer experience.
          </p>
          <p>
            Information submitted through our contact or quote forms may be used to communicate with you about your enquiry, review your furniture requirements, and support operational follow-up.
          </p>
          <p>
            We do not sell personal data. Where third-party services such as Supabase are used to store submitted information, those services are used only to support the functioning of the website and its submission workflows.
          </p>
          <p>
            If you would like to update or remove any information you previously submitted, please contact us directly at <a className="text-oak-700 underline" href="mailto:oakcherrykraft@gmail.com">oakcherrykraft@gmail.com</a>.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/contact" className="rounded-full bg-bark px-5 py-3 text-sm font-semibold text-sand">Contact us</Link>
          <Link to="/terms" className="rounded-full border border-bark/10 bg-sand px-5 py-3 text-sm font-semibold text-bark">Read Terms</Link>
        </div>
      </section>
    </PageContainer>
  );
}
