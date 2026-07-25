import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronRight,
  Hammer,
  MapPin,
  Sparkles,
  Truck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Breadcrumb, Button, Card, SectionHeader } from '../components/ui';
import { QuoteFormValues, categories, productTypes, woodSpecies, finishes, budgetRanges } from '../components/ui/QuoteForm';
import { supabase } from '../lib/supabase';

const stepDefinitions = [
  { label: 'Category', description: 'Choose the furniture family that fits your project.' },
  { label: 'Type', description: 'Pick the project type to guide the design direction.' },
  { label: 'Dimensions', description: 'Set the ideal width, depth, and height for the space.' },
  { label: 'Material', description: 'Choose the wood species that feels most luxurious.' },
  { label: 'Finish', description: 'Select a finish that complements your interior.' },
  { label: 'Quantity', description: 'Tell us how many pieces you need.' },
  { label: 'Budget', description: 'Share your investment range so we can tailor the proposal.' },
  { label: 'Delivery', description: 'Where should we install your custom furniture?' },
  { label: 'Schedule', description: 'Choose a completion window and share your contact details.' },
  { label: 'Review', description: 'Confirm the configurator selections before requesting a quote.' },
];

const baseConfiguration: Partial<QuoteFormValues> = {
  category: '',
  productType: '',
  width: 120,
  depth: 60,
  height: 75,
  woodSpecies: 'Oak',
  finish: 'Natural oil',
  quantity: 1,
  deliveryLocation: '',
  preferredDate: '',
  budgetRange: '',
  name: '',
  email: '',
  phone: '',
  additionalNotes: '',
};

export function Configurator() {
  const [step, setStep] = useState(0);
  const [configuration, setConfiguration] = useState<Partial<QuoteFormValues>>(baseConfiguration);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');

  const progress = useMemo(() => ((step + 1) / stepDefinitions.length) * 100, [step]);

  const stepComplete = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(configuration.category);
      case 1:
        return Boolean(configuration.productType);
      case 2:
        return Boolean(configuration.width && configuration.depth && configuration.height);
      case 3:
        return Boolean(configuration.woodSpecies);
      case 4:
        return Boolean(configuration.finish);
      case 5:
        return Boolean(configuration.quantity && configuration.quantity > 0);
      case 6:
        return Boolean(configuration.budgetRange);
      case 7:
        return Boolean(configuration.deliveryLocation?.trim());
      case 8:
        return Boolean(configuration.preferredDate && configuration.name?.trim() && configuration.email?.trim() && configuration.phone?.trim());
      default:
        return true;
    }
  }, [step, configuration]);

  const summaryItems = useMemo(
    () => [
      { label: 'Category', value: configuration.category || 'Not selected' },
      { label: 'Project type', value: configuration.productType || 'Not selected' },
      { label: 'Dimensions', value: configuration.width && configuration.depth && configuration.height ? `${configuration.width} × ${configuration.depth} × ${configuration.height} cm` : 'Not set' },
      { label: 'Wood species', value: configuration.woodSpecies || 'Not selected' },
      { label: 'Finish', value: configuration.finish || 'Not selected' },
      { label: 'Quantity', value: configuration.quantity ? `${configuration.quantity}` : 'Not set' },
      { label: 'Budget', value: configuration.budgetRange || 'Not selected' },
      { label: 'Delivery', value: configuration.deliveryLocation || 'Not provided' },
      { label: 'Completion date', value: configuration.preferredDate || 'Not selected' },
    ],
    [configuration],
  );

  const updateField = <K extends keyof QuoteFormValues>(field: K, value: QuoteFormValues[K]) => {
    setConfiguration((current) => ({ ...current, [field]: value }));
  };

  const handlePrev = () => setStep((current) => Math.max(0, current - 1));
  const handleNext = () => setStep((current) => Math.min(stepDefinitions.length - 1, current + 1));

  const buildQuoteRequestPayload = (config: Partial<QuoteFormValues>) => ({
    full_name: config.name?.trim() ?? '',
    email: config.email?.trim() ?? '',
    phone: config.phone?.trim() ?? '',
    project_type: config.productType ?? null,
    room_type: config.category ?? null,
    dimensions:
      config.width && config.depth && config.height
        ? `${config.width} x ${config.depth} x ${config.height}`
        : null,
    budget: config.budgetRange ?? null,
    configuration: {
      category: config.category ?? '',
      productType: config.productType ?? '',
      width: config.width ?? 0,
      depth: config.depth ?? 0,
      height: config.height ?? 0,
      woodSpecies: config.woodSpecies ?? '',
      finish: config.finish ?? '',
      quantity: config.quantity ?? 0,
      deliveryLocation: config.deliveryLocation ?? '',
      preferredDate: config.preferredDate ?? '',
      budgetRange: config.budgetRange ?? '',
      additionalNotes: config.additionalNotes ?? '',
    },
    notes: config.additionalNotes ?? '',
  });

  const submitDesign = async () => {
    setSubmissionStatus('submitting');
    setSubmissionMessage('');

    const quoteRequestId = crypto.randomUUID();
    const payload = {
      id: quoteRequestId,
      ...buildQuoteRequestPayload(configuration),
    };

    console.log('QUOTE PAYLOAD', payload);

    const { error: quoteError } = await supabase
      .from('quote_requests')
      .insert(payload);

    if (quoteError) {
      console.error(JSON.stringify(quoteError, null, 2));
      setSubmissionStatus('error');
      setSubmissionMessage(
        quoteError?.message || 'There was a problem submitting your quote request. Please try again.',
      );
      return;
    }

    const { error: selectionError } = await supabase.from('configurator_selections').insert({
      quote_request_id: quoteRequestId,
      material: configuration.woodSpecies ?? null,
      finish: configuration.finish ?? null,
      colour: null,
      accessories: [],
      estimated_price: 0,
    });

    if (selectionError) {
      setSubmissionStatus('error');
      setSubmissionMessage(
        selectionError.message || 'There was a problem saving your configurator selections. Please try again.',
      );
      return;
    }

    setSubmissionStatus('success');
    setSubmissionMessage('Your quote request has been submitted successfully. We will contact you shortly.');
    setConfiguration(baseConfiguration);
    setStep(0);
  };

  const stepIndicator = stepDefinitions.map((item, index) => (
    <li key={item.label} className="flex items-center gap-3 text-sm text-bark/70">
      <span className={index <= step ? 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-oak-500 bg-oak-100 text-oak-900' : 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-bark/10 bg-white text-bark'}>{index + 1}</span>
      <span className={index === step ? 'font-semibold text-bark' : 'text-bark/70'}>{item.label}</span>
    </li>
  ));

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <p className="text-base leading-7 text-bark/75">Start with the furniture category that best reflects the space and use.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('category', option)}
                  className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${configuration.category === option ? 'border-oak-500 bg-oak-50 text-bark' : 'border-bark/10 bg-white text-bark/75 hover:border-oak-400 hover:bg-sand/80'}`}
                >
                  <p className="font-semibold">{option}</p>
                  <p className="mt-2 text-sm leading-6 text-bark/70">Refine the tone of the piece and the way it sits in the room.</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <p className="text-base leading-7 text-bark/75">Choose the furniture type that aligns with your design ambition.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productTypes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('productType', option)}
                  className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${configuration.productType === option ? 'border-oak-500 bg-oak-50 text-bark' : 'border-bark/10 bg-white text-bark/75 hover:border-oak-400 hover:bg-sand/80'}`}
                >
                  <p className="font-semibold">{option}</p>
                  <p className="mt-2 text-sm leading-6 text-bark/70">A focused choice helps us propose the right form and scale.</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Set the exact footprint that will sit comfortably in your room.</p>
            <div className="grid gap-5 sm:grid-cols-3">
              {(['width', 'depth', 'height'] as const).map((field) => (
                <label key={field} className="block text-sm font-medium text-bark">
                  {field === 'width' ? 'Width (cm)' : field === 'depth' ? 'Depth (cm)' : 'Height (cm)'}
                  <input
                    type="number"
                    min={1}
                    value={configuration[field] ?? ''}
                    onChange={(event) => updateField(field, Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  />
                </label>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <p className="text-base leading-7 text-bark/75">Choose a timber that feels grounded, rich, and tactile.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {woodSpecies.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('woodSpecies', option)}
                  className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${configuration.woodSpecies === option ? 'border-oak-500 bg-oak-50 text-bark' : 'border-bark/10 bg-white text-bark/75 hover:border-oak-400 hover:bg-sand/80'}`}
                >
                  <p className="font-semibold">{option}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <p className="text-base leading-7 text-bark/75">Select a finish that brings out the grain and the character of the wood.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finishes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('finish', option)}
                  className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${configuration.finish === option ? 'border-oak-500 bg-oak-50 text-bark' : 'border-bark/10 bg-white text-bark/75 hover:border-oak-400 hover:bg-sand/80'}`}
                >
                  <p className="font-semibold">{option}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Select how many matching pieces you want from this design direction.</p>
            <label className="block text-sm font-medium text-bark">
              Quantity
              <input
                type="number"
                min={1}
                step={1}
                value={configuration.quantity ?? ''}
                onChange={(event) => updateField('quantity', Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              />
            </label>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <p className="text-base leading-7 text-bark/75">Share your budget expectations so our proposal fits the right scale and materials.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {budgetRanges.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField('budgetRange', option)}
                  className={`rounded-[1.5rem] border px-5 py-4 text-left transition ${configuration.budgetRange === option ? 'border-oak-500 bg-oak-50 text-bark' : 'border-bark/10 bg-white text-bark/75 hover:border-oak-400 hover:bg-sand/80'}`}
                >
                  <p className="font-semibold">{option}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Tell us where this piece will be delivered and installed.</p>
            <label className="block text-sm font-medium text-bark">
              Delivery location
              <input
                type="text"
                value={configuration.deliveryLocation ?? ''}
                onChange={(event) => updateField('deliveryLocation', event.target.value)}
                className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                placeholder="City, neighbourhood, or venue"
              />
            </label>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Add the ideal completion date and the best contact details for follow-up.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-bark">
                Preferred completion date
                <input
                  type="date"
                  value={configuration.preferredDate ?? ''}
                  onChange={(event) => updateField('preferredDate', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                />
              </label>
              <label className="block text-sm font-medium text-bark">
                Phone number
                <input
                  type="tel"
                  value={configuration.phone ?? ''}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="0803 429 1245"
                />
              </label>
              <label className="block text-sm font-medium text-bark">
                Email address
                <input
                  type="email"
                  value={configuration.email ?? ''}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm font-medium text-bark sm:col-span-2">
                Full name
                <input
                  type="text"
                  value={configuration.name ?? ''}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="Your full name"
                />
              </label>
              <label className="block text-sm font-medium text-bark sm:col-span-2">
                Notes for the studio
                <textarea
                  value={configuration.additionalNotes ?? ''}
                  onChange={(event) => updateField('additionalNotes', event.target.value)}
                  className="mt-2 min-h-[160px] w-full resize-y rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="Share your design references, material priorities, or site details."
                />
              </label>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Review your choices before continuing to the quote request page.</p>
            <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-sm">
              {summaryItems.map((item) => (
                <div key={item.label} className="grid gap-2 sm:grid-cols-[170px_1fr] text-sm text-bark/80">
                  <span className="font-semibold text-bark">{item.label}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-sand/60 p-6 text-sm text-bark/80">
              <p className="font-semibold text-bark">Almost there.</p>
              <p className="mt-2">When you finish, we will submit this quote request and save your configurator selections for the studio to review.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer className="space-y-10 pb-20">
      <Helmet>
        <title>Furniture configurator | Oak Cherry Kraft</title>
        <meta name="description" content="Build your premium custom furniture specification and send a quote request with tailored selections." />
      </Helmet>

      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Configurator' }]} />

      <section className="grid gap-10 xl:grid-cols-[0.95fr_0.45fr] xl:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <SectionHeader
              eyebrow="Configurator"
              title="Design your bespoke furniture experience"
              description="Move through a refined studio workflow built to capture your materials, scale, and craft preferences before you request a quote."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-[1.75rem] border-bark/10 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-oak-700">
                  <Hammer size={20} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em]">Expert design</p>
                    <p className="mt-2 text-sm text-bark/70">We guide each choice for premium form, function, and finish.</p>
                  </div>
                </div>
              </Card>
              <Card className="rounded-[1.75rem] border-bark/10 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-oak-700">
                  <Sparkles size={20} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em]">Premium finish</p>
                    <p className="mt-2 text-sm text-bark/70">Create a specification that feels custom, considered, and luxurious.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="rounded-[2rem] border-bark/10 bg-white p-6 shadow-soft">
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Step {step + 1} of {stepDefinitions.length}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-bark">{stepDefinitions[step].label}</h2>
                  <p className="mt-2 text-sm leading-7 text-bark/70">{stepDefinitions[step].description}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-semibold text-bark shadow-soft"><ChevronRight size={16} aria-hidden="true" />{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bark/10">
                <div className="h-full rounded-full bg-oak-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {stepContent()}

            {submissionStatus !== 'idle' ? (
              <div
                className={`rounded-3xl border px-5 py-4 text-sm ${
                  submissionStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {submissionMessage}
              </div>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="md" disabled={step === 0 || submissionStatus === 'submitting'} onClick={handlePrev}>
                  Back
                </Button>
                {step < stepDefinitions.length - 1 ? (
                  <Button type="button" size="md" disabled={!stepComplete || submissionStatus === 'submitting'} onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button type="button" size="md" icon={<ArrowUpRight size={17} aria-hidden="true" />} disabled={submissionStatus === 'submitting'} onClick={submitDesign}>
                    Finish and request quote
                  </Button>
                )}
              </div>
              <p className="text-sm leading-7 text-bark/70">Finish now to save your configurator selections as a quote request with our studio.</p>
            </div>
          </Card>
        </motion.div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <Card className="rounded-[2rem] border-bark/10 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Design summary</p>
            <h3 className="mt-3 text-xl font-semibold text-bark">Current selections</h3>
            <div className="mt-5 space-y-4">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-3xl border border-bark/10 bg-sand/50 p-4">
                  <p className="text-sm font-semibold text-bark">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-bark/75">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[2rem] border-bark/10 bg-white p-6 shadow-soft">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-oak-700">
                <Truck size={20} aria-hidden="true" />
                <p className="font-semibold">Nationwide delivery</p>
              </div>
              <p className="text-sm leading-7 text-bark/70">Our studio can deliver and install your custom furniture across Nigeria with care and timing tailored to your project.</p>
              <Button asChild size="sm" variant="ghost">
                <a href="/contact">Need help with your brief</a>
              </Button>
            </div>
          </Card>
        </aside>
      </section>
    </PageContainer>
  );
}
