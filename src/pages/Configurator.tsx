import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SEO } from '../components/layout/SEO';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ChevronRight, Hammer, Sparkles, Truck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { Breadcrumb, Button, Card, SectionHeader } from '../components/ui';
import { QuoteFormValues, categories, productTypes, woodSpecies, finishes, budgetRanges } from '../components/ui/QuoteForm';
import { getEstimatedPriceRange } from '../utils/priceEstimator';

const stepDefinitions = [
  { label: 'Category', description: 'Choose the furniture family that fits your project.' },
  { label: 'Type', description: 'Pick the project type to guide the design direction.' },
  { label: 'Dimensions', description: 'Set the ideal width, depth, and height for the space.' },
  { label: 'Wood species', description: 'Choose the timber that feels most luxurious.' },
  { label: 'Finish', description: 'Select a finish that brings out the grain and the character of the wood.' },
  { label: 'Quantity', description: 'Decide how many matching pieces your space needs.' },
  { label: 'Budget', description: 'Share your investment range so we can tailor the proposal.' },
  { label: 'Delivery', description: 'Where should we install your custom furniture?' },
  { label: 'Details', description: 'Provide your contact details, completion window, and notes.' },
  { label: 'Review', description: 'Confirm the configurator selections before continuing to the quote request.' },
];

const CONFIGURATOR_STORAGE_KEY = 'oakcherrykraft:configurator-state';

const baseConfiguration: Partial<QuoteFormValues> = {
  product: '',
  category: '',
  productType: '',
  colour: '',
  legStyle: '',
  accessories: '',
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

interface ConfiguratorPrefillProduct {
  name?: string;
  productName?: string;
  category?: string;
  wood?: string;
  material?: string;
  finish?: string;
  cover_image?: string;
  image_url?: string;
  image_urls?: string[];
}

interface ConfiguratorLocationState {
  selectedProduct?: ConfiguratorPrefillProduct;
}

export function Configurator() {
  const location = useLocation();
  const locationState = location.state as ConfiguratorLocationState | null;
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const [savedConfiguration, setSavedConfiguration] = useState<Partial<QuoteFormValues> | null>(null);

  const routeState = locationState;
  const searchParams = new URLSearchParams(location.search);
  const incomingProductName =
    routeState?.selectedProduct?.name ??
    routeState?.selectedProduct?.productName ??
    searchParams.get('productName') ??
    '';
  const incomingCategory =
    routeState?.selectedProduct?.category ??
    searchParams.get('productCategory') ??
    '';
  const incomingWood =
    routeState?.selectedProduct?.wood ??
    routeState?.selectedProduct?.material ??
    '';
  const incomingFinish =
    routeState?.selectedProduct?.finish ??
    searchParams.get('finish') ??
    '';
  const hasSelectedProduct = Boolean(incomingProductName || incomingCategory);

  const initialConfiguration = useMemo<Partial<QuoteFormValues>>(() => ({
    ...baseConfiguration,
    ...(savedConfiguration ?? {}),
    ...(incomingProductName ? { product: incomingProductName } : {}),
    ...(incomingCategory ? { category: incomingCategory } : {}),
    ...(incomingWood ? { woodSpecies: incomingWood } : {}),
    ...(incomingFinish ? { finish: incomingFinish } : {}),
  }), [incomingProductName, incomingCategory, incomingWood, incomingFinish, savedConfiguration]);

  const [step, setStep] = useState(0);
  const [configuration, setConfiguration] = useState<Partial<QuoteFormValues>>(initialConfiguration);
  const [selectedProductName, setSelectedProductName] = useState(incomingProductName);

  useEffect(() => {
    const nextStep = hasSelectedProduct ? 1 : 0;
    const sanitizedConfiguration = {
      ...baseConfiguration,
      ...(savedConfiguration ?? {}),
      ...(incomingProductName ? { product: incomingProductName } : {}),
      ...(incomingCategory ? { category: incomingCategory } : {}),
      ...(incomingWood ? { woodSpecies: incomingWood } : {}),
      ...(incomingFinish ? { finish: incomingFinish } : {}),
    };

    setSelectedProductName(incomingProductName || '');
    setConfiguration(sanitizedConfiguration);
    setStep(nextStep);
    setSubmissionStatus('idle');
    setSubmissionMessage('');
  }, [location.key, incomingProductName, incomingCategory, incomingWood, incomingFinish, hasSelectedProduct, savedConfiguration]);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        CONFIGURATOR_STORAGE_KEY,
        JSON.stringify({ configuration, step, savedAt: new Date().toISOString() })
      );
    } catch {
      // ignore storage failures
    }
  }, [configuration, step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(CONFIGURATOR_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { configuration?: Partial<QuoteFormValues>; step?: number } | null;
      if (!parsed?.configuration) return;

      setSavedConfiguration(parsed.configuration);
      if (typeof parsed.step === 'number') {
        setStep(parsed.step);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

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
      { label: 'Product', value: configuration.product || 'Not selected' },
      { label: 'Category', value: configuration.category || 'Not selected' },
      { label: 'Project type', value: configuration.productType || 'Not selected' },
      { label: 'Dimensions', value: configuration.width && configuration.depth && configuration.height ? `${configuration.width} × ${configuration.depth} × ${configuration.height} cm` : 'Not set' },
      { label: 'Wood species', value: configuration.woodSpecies || 'Not selected' },
      { label: 'Finish', value: configuration.finish || 'Not selected' },
      { label: 'Estimated price', value: getEstimatedPriceRange(configuration) },
      { label: 'Colour', value: configuration.colour || 'Not selected' },
      { label: 'Leg style', value: configuration.legStyle || 'Not selected' },
      { label: 'Accessories', value: configuration.accessories || 'None' },
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
  const handleNext = () => {
    if (!stepComplete) {
      return;
    }
    setStep((current) => Math.min(stepDefinitions.length - 1, current + 1));
  };

  const submitDesign = async () => {
    // route to the canonical request-quote page and hand over the completed configuration
    navigate('/request-quote', { state: { prefill: configuration } });
  };

  const selectedProductObj = routeState?.selectedProduct ?? null;
  const productImageUrl: string | undefined =
    [selectedProductObj?.cover_image, selectedProductObj?.image_url, ...(selectedProductObj?.image_urls ?? [])]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find(Boolean) || undefined;

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
      case 9: {
        const reviewGroups = [
          {
            title: 'Product details',
            items: [
              { label: 'Product', value: configuration.product || 'Custom design' },
              { label: 'Category', value: configuration.category || 'Not selected' },
              { label: 'Project type', value: configuration.productType || 'Not selected' },
              { label: 'Quantity', value: configuration.quantity ? `${configuration.quantity}` : 'Not set' },
            ],
          },
          {
            title: 'Material & finish',
            items: [
              { label: 'Wood species', value: configuration.woodSpecies || 'Not selected' },
              { label: 'Finish', value: configuration.finish || 'Not selected' },
              { label: 'Colour', value: configuration.colour || 'Not selected' },
              { label: 'Leg style', value: configuration.legStyle || 'Not selected' },
              { label: 'Accessories', value: configuration.accessories || 'None' },
            ],
          },
          {
            title: 'Project scope',
            items: [
              { label: 'Dimensions', value: configuration.width && configuration.depth && configuration.height ? `${configuration.width} × ${configuration.depth} × ${configuration.height} cm` : 'Not set' },
              { label: 'Budget', value: configuration.budgetRange || 'Not selected' },
              { label: 'Delivery', value: configuration.deliveryLocation || 'Not provided' },
              { label: 'Completion date', value: configuration.preferredDate || 'Not selected' },
            ],
          },
        ];

        return (
          <div className="space-y-6">
            <p className="text-base leading-7 text-bark/75">Review your choices before continuing to the quote request page.</p>
            {productImageUrl ? (
              <div className="overflow-hidden rounded-[1.75rem] border border-bark/10 bg-white shadow-sm">
                <img src={productImageUrl} alt={selectedProductName ?? 'Selected product preview'} loading="lazy" decoding="async" width="896" height="224" className="h-56 w-full object-cover" />
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Product preview</p>
                  <p className="text-lg font-semibold text-bark">{selectedProductName || 'Custom design'}</p>
                  <p className="text-sm leading-6 text-bark/70">Review the product inspiration we will use to guide your quote and material selection.</p>
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-3">
              {reviewGroups.map((group) => (
                <div key={group.title} className="rounded-[1.75rem] border border-bark/10 bg-sand/60 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-oak-700">{group.title}</h3>
                  <div className="mt-4 space-y-4 text-sm text-bark/80">
                    {group.items.map((item) => (
                      <div key={item.label} className="grid gap-2 sm:grid-cols-[150px_1fr]">
                        <span className="font-semibold text-bark">{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-sm">
              <p className="font-semibold text-bark">Almost there.</p>
              <p className="mt-2 text-sm leading-7 text-bark/70">Once submitted, your configuration and quote request will be saved for the studio to review and respond with a tailored proposal.</p>
            </div>
          </div>
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <PageContainer className="space-y-10 pb-20">
      <SEO
        title="Design your furniture | Oak Cherry Kraft"
        description="Build your premium custom furniture specification and send a quote request with tailored selections."
        url="https://oakcherrykraft.com/configurator"
      />

      <PageHeader title="Design Your Furniture" subtitle="Create a tailored furniture brief with premium materials, dimensions, and finish details." showBreadcrumb />
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Design Your Furniture' }]} className="pt-6" />

      <section className="grid gap-10 xl:grid-cols-[0.95fr_0.45fr] xl:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="space-y-4">
            {selectedProductName ? (
              <div className="mb-4 rounded-[1.5rem] border border-bark/10 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Customising</p>
                <p className="mt-2 font-semibold text-bark">{selectedProductName}</p>
                <p className="mt-1 text-sm text-bark/70">Auto-applied from product — you can edit any selection below.</p>
              </div>
            ) : null}

            <SectionHeader
              eyebrow="Design Your Furniture"
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
                <motion.div
                  className="h-full origin-left rounded-full bg-oak-600"
                  initial={false}
                  animate={{ scaleX: progress / 100 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reducedMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, x: -12 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {stepContent()}
                </motion.div>
              </AnimatePresence>

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
            <div className="mt-8 rounded-[1.5rem] border border-bark/10 bg-sand/70 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="secondary" size="md" disabled={step === 0 || submissionStatus === 'submitting'} onClick={handlePrev}>
                    Back
                  </Button>
                  {step < stepDefinitions.length - 1 ? (
                    <Button type="button" size="md" disabled={!stepComplete || submissionStatus === 'submitting'} onClick={handleNext}>
                      Continue
                    </Button>
                  ) : (
                    <Button type="button" size="md" className="bg-[#2E241C] text-[#F7F1E8] shadow-[0_12px_32px_rgba(46,36,28,0.22)] hover:bg-[#1f1812]" icon={<ArrowUpRight size={17} aria-hidden="true" />} disabled={submissionStatus === 'submitting'} onClick={submitDesign}>
                      Finish and request quote
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-7 text-bark/70">Finish now to save your configurator selections as a quote request with our studio.</p>
              </div>
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
