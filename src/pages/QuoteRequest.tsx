import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Breadcrumb, Button, QuoteForm, SectionHeader } from '../components/ui';
import type { QuoteFormValues } from '../components/ui/QuoteForm';

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function QuoteRequest() {
  const location = useLocation();
  const state = location.state as { prefill?: Partial<QuoteFormValues> } | null;
  const prefillValues = state?.prefill ?? undefined;
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>Request a quote | Oak Cherry Kraft</title>
        <meta name="description" content="Submit a quote request for bespoke furniture, custom installations, and tailored design support." />
      </Helmet>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Request quote' }]} />

      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
        <SectionHeader eyebrow="Request a quote" title="Tell us about your furniture project" description="Share your space, materials, and timeframe. Our studio will respond with a tailored proposal and next steps." />
        <p className="max-w-3xl text-base leading-8 text-bark/70">
          Whether you are planning a dining room, bedroom, office, or commercial installation, our team helps you define the right scale, materials, and finish.
        </p>
        {prefillValues ? (
          <div className="rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Configuration summary</p>
            <h3 className="mt-3 text-lg font-semibold text-bark">{prefillValues.product || 'Custom design'}</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-bark/75">
              <div>Dimensions: {prefillValues.width && prefillValues.depth && prefillValues.height ? `${prefillValues.width} × ${prefillValues.depth} × ${prefillValues.height} cm` : '—'}</div>
              <div>Material: {prefillValues.woodSpecies ?? '—'}</div>
              <div>Finish: {prefillValues.finish ?? '—'}</div>
              <div>Colour: {prefillValues.colour ?? '—'}</div>
              <div>Style: {prefillValues.legStyle ?? '—'}</div>
              <div>Accessories: {prefillValues.accessories ?? '—'}</div>
            </div>
            {prefillValues.additionalNotes ? <p className="mt-4 text-sm text-bark/70">Notes: {prefillValues.additionalNotes}</p> : null}
          </div>
        ) : null}
        <p className="max-w-3xl text-base leading-8 text-bark/70">
          Already have a custom design in mind? Start with our Design Your Furniture workflow for a guided studio brief and quicker quote preparation.
        </p>
        {!submittedSuccess ? (
          <QuoteForm defaultValues={prefillValues ?? undefined} onSuccess={() => setSubmittedSuccess(true)} />
        ) : (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-8 text-bark/80">
            <h3 className="text-xl font-semibold text-emerald-800">Your custom furniture request has been received.</h3>
            <p className="mt-3">Our design team will review your configuration and prepare a personalised quotation. We will contact you shortly.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link to="/">Return home</Link></Button>
              <Button variant="secondary" asChild><Link to="/products">Browse products</Link></Button>
              <Button asChild><Link to="/configuration-selector">Design another piece</Link></Button>
            </div>
          </div>
        )}
        <div className="rounded-[2rem] border border-bark/10 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Prefer a quick conversation?</p>
              <p className="mt-2 text-base leading-7 text-bark/75">We can also schedule a call to discuss your needs and delivery options.</p>
            </div>
            <Button variant="secondary" asChild icon={<ArrowUpRight size={17} aria-hidden="true" />}>
              <Link to="/contact">Contact the studio</Link>
            </Button>
          </div>
        </div>
      </motion.section>
    </PageContainer>
  );
}
