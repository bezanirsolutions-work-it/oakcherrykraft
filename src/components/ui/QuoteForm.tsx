import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../../lib/cn';
import { supabase } from '../../lib/supabase';
import { getEstimatedPriceRange } from '../../utils/priceEstimator';
import { emailService } from '../../services/email';
import { CATEGORY_HIERARCHY } from '../../lib/productCategories';

export const categories = CATEGORY_HIERARCHY.flatMap((group) =>
  group.categories.map((cat) => cat.displayLabel)
);

export const productTypes = [
  'Table',
  'Seating',
  'Storage',
  'Shelving',
  'Bed',
  'Custom installation',
];

export const woodSpecies = ['Oak', 'Cherry', 'Walnut', 'Mahogany', 'Teak', 'Mixed species'];

export const finishes = [
  'Natural oil',
  'Matte lacquer',
  'Satin lacquer',
  'Hand-rubbed wax',
  'Raw edge',
  'Beeswax',
  'Resin Finish',
  'Rough Wood Finish',
];

export const budgetRanges = ['Under ₦500,000', '₦500,000–₦1,200,000', '₦1,200,000–₦2,500,000', 'Above ₦2,500,000'];

const quoteSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  category: z.string().min(1, 'Select a furniture category'),
  productType: z.string().min(1, 'Select a project type'),
  product: z.string().optional(),
  colour: z.string().optional(),
  legStyle: z.string().optional(),
  accessories: z.string().optional(),
  width: z.number({ invalid_type_error: 'Enter a width' }).positive('Width must be greater than 0').optional().or(z.literal(0)),
  depth: z.number({ invalid_type_error: 'Enter a depth' }).positive('Depth must be greater than 0').optional().or(z.literal(0)),
  height: z.number({ invalid_type_error: 'Enter a height' }).positive('Height must be greater than 0').optional().or(z.literal(0)),
  woodSpecies: z.string().min(1, 'Choose a wood species'),
  finish: z.string().min(1, 'Choose a finish'),
  quantity: z.number({ invalid_type_error: 'Enter a quantity' }).int('Quantity must be a whole number').positive('Quantity must be at least 1'),
  deliveryLocation: z.string().min(2, 'Enter a delivery location'),
  preferredDate: z.string().min(1, 'Choose a completion date'),
  budgetRange: z.string().min(1, 'Choose a budget range'),
  inspirationImage: z.instanceof(FileList).optional(),
  additionalNotes: z.string().max(500, 'Notes can be up to 500 characters').optional(),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

const initialFormValues: QuoteFormValues = {
  name: '',
  email: '',
  phone: '',
  category: '',
  productType: '',
  product: '',
  colour: '',
  legStyle: '',
  accessories: '',
  width: 0,
  depth: 0,
  height: 0,
  woodSpecies: '',
  finish: '',
  quantity: 1,
  deliveryLocation: '',
  preferredDate: '',
  budgetRange: '',
  inspirationImage: undefined,
  additionalNotes: '',
};

interface QuoteFormProps {
  className?: string;
  defaultValues?: Partial<QuoteFormValues>;
}

interface QuoteFormProps {
  className?: string;
  defaultValues?: Partial<QuoteFormValues>;
  onSuccess?: () => void;
}

export function QuoteForm({ className = '', defaultValues, onSuccess }: QuoteFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mergedDefaultValues = useMemo(
    () => ({
      ...initialFormValues,
      ...defaultValues,
    }),
    [defaultValues],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: mergedDefaultValues,
  });

  useEffect(() => {
    reset(mergedDefaultValues);
  }, [mergedDefaultValues, reset]);

  const imageField = register('inspirationImage');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(values: QuoteFormValues) {
    setStatus('submitting');
    setFeedbackMessage('');
    const quoteRequestId = crypto.randomUUID();
    const estimatedPrice = getEstimatedPriceRange(values);
    const payload = {
      id: quoteRequestId,
      full_name: values.name,
      email: values.email,
      phone: values.phone,
      project_type: values.productType,
      room_type: values.category,
      dimensions: `${values.width} x ${values.depth} x ${values.height}`,
      budget: values.budgetRange?.toString() ?? null,
      notes: values.additionalNotes ?? '',
      configuration: {
        product: values.product ?? null,
        category: values.category,
        productType: values.productType,
        width: values.width ?? null,
        depth: values.depth ?? null,
        height: values.height ?? null,
        woodSpecies: values.woodSpecies,
        finish: values.finish,
        colour: values.colour ?? null,
        legStyle: values.legStyle ?? null,
        accessories: values.accessories ?? null,
        quantity: values.quantity,
        deliveryLocation: values.deliveryLocation,
        preferredDate: values.preferredDate,
        budgetRange: values.budgetRange,
        inspirationImage: values.inspirationImage?.[0]?.name ?? null,
      },
    };

    const { error } = await supabase.from('quote_requests').insert(payload);

    if (error) {
      setStatus('error');
      setFeedbackMessage(
        error.message || 'There was a problem submitting your request. Please try again or contact the studio directly.',
      );
      return;
    }

    // save configurator selection for admin review
    const configuratorPayload = {
      quote_request_id: quoteRequestId,
      material: values.woodSpecies ?? null,
      finish: values.finish ?? null,
      colour: values.colour ?? null,
      accessories: values.accessories ? values.accessories.split(',').map((s) => s.trim()) : [],
      estimated_price: String(estimatedPrice),
    };

    const { error: selectionError } = await supabase.from('configurator_selections').insert(configuratorPayload);

    if (selectionError) {
      setStatus('error');
      setFeedbackMessage(selectionError.message || 'There was a problem saving your configurator selections.');
      return;
    }

    setStatus('success');
    setFeedbackMessage('Your quote request has been received. Our team will review your brief and follow up within 1–2 business days.');
    reset({
      name: '',
      email: '',
      phone: '',
      category: '',
      productType: '',
      product: '',
      width: 0,
      depth: 0,
      height: 0,
      woodSpecies: '',
      finish: '',
      colour: '',
      legStyle: '',
      accessories: '',
      quantity: 1,
      deliveryLocation: '',
      preferredDate: '',
      budgetRange: '',
      additionalNotes: '',
      inspirationImage: undefined,
    });
    setPreviewUrl(null);

    try {
      await emailService.sendEmail({
        to: import.meta.env.VITE_EMAIL_TO || '',
        subject: `New quote request from ${values.name}`,
        body: `Name: ${values.name}\nEmail: ${values.email}\nPhone: ${values.phone}\nCategory: ${values.category}\nType: ${values.productType}\nBudget: ${values.budgetRange}\nNotes: ${values.additionalNotes || 'None'}`,
      });
    } catch (err) {
      console.error('Quote notification email failed:', err);
    }

    if (onSuccess) onSuccess();
  }

  return (
    <Card className={cn('bg-white', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section aria-labelledby="quote-personal-heading" className="rounded-[1.5rem] border border-bark/10 bg-sand/60 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Section 1</p>
                  <h2 id="quote-personal-heading" className="mt-3 text-xl font-semibold text-bark">Customer details</h2>
                </div>
                <div className="text-sm text-bark/70">Required</div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Full name
                  <input
                    {...register('name')}
                    aria-invalid={!!errors.name}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="text"
                    placeholder="Your full name"
                  />
                  {errors.name ? <span className="mt-2 block text-sm text-rose-600">{errors.name.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Email address
                  <input
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="email"
                    placeholder="you@example.com"
                  />
                  {errors.email ? <span className="mt-2 block text-sm text-rose-600">{errors.email.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Phone number
                  <input
                    {...register('phone')}
                    aria-invalid={!!errors.phone}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="tel"
                    placeholder="0803 429 1245"
                  />
                  {errors.phone ? <span className="mt-2 block text-sm text-rose-600">{errors.phone.message}</span> : null}
                </label>
              </div>
            </section>

            <section aria-labelledby="quote-project-heading" className="rounded-[1.5rem] border border-bark/10 bg-sand/60 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Section 2</p>
                  <h2 id="quote-project-heading" className="mt-3 text-xl font-semibold text-bark">Project details</h2>
                </div>
                <div className="text-sm text-bark/70">Furniture scope</div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Furniture category
                  <select
                    {...register('category')}
                    aria-invalid={!!errors.category}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  >
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {categories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.category ? <span className="mt-2 block text-sm text-rose-600">{errors.category.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Product type
                  <select
                    {...register('productType')}
                    aria-invalid={!!errors.productType}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  >
                    <option value="" disabled>
                      Choose a product type
                    </option>
                    {productTypes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.productType ? <span className="mt-2 block text-sm text-rose-600">{errors.productType.message}</span> : null}
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block text-sm font-medium text-bark">
                  Width (cm) <span className="text-bark/50">(Optional)</span>
                  <input
                    {...register('width', { valueAsNumber: true })}
                    aria-invalid={!!errors.width}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="number"
                    min={0}
                    placeholder="120"
                  />
                  {errors.width ? <span className="mt-2 block text-sm text-rose-600">{errors.width.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Depth (cm) <span className="text-bark/50">(Optional)</span>
                  <input
                    {...register('depth', { valueAsNumber: true })}
                    aria-invalid={!!errors.depth}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="number"
                    min={0}
                    placeholder="60"
                  />
                  {errors.depth ? <span className="mt-2 block text-sm text-rose-600">{errors.depth.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Height (cm) <span className="text-bark/50">(Optional)</span>
                  <input
                    {...register('height', { valueAsNumber: true })}
                    aria-invalid={!!errors.height}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="number"
                    min={0}
                    placeholder="75"
                  />
                  {errors.height ? <span className="mt-2 block text-sm text-rose-600">{errors.height.message}</span> : null}
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Wood species
                  <select
                    {...register('woodSpecies')}
                    aria-invalid={!!errors.woodSpecies}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  >
                    <option value="" disabled>
                      Choose a wood species
                    </option>
                    {woodSpecies.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.woodSpecies ? <span className="mt-2 block text-sm text-rose-600">{errors.woodSpecies.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Finish
                  <select
                    {...register('finish')}
                    aria-invalid={!!errors.finish}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  >
                    <option value="" disabled>
                      Choose a finish
                    </option>
                    {finishes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.finish ? <span className="mt-2 block text-sm text-rose-600">{errors.finish.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Quantity
                  <input
                    {...register('quantity', { valueAsNumber: true })}
                    aria-invalid={!!errors.quantity}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="1"
                  />
                  {errors.quantity ? <span className="mt-2 block text-sm text-rose-600">{errors.quantity.message}</span> : null}
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Delivery location
                  <input
                    {...register('deliveryLocation')}
                    aria-invalid={!!errors.deliveryLocation}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="text"
                    placeholder="City, neighbourhood, or venue"
                  />
                  {errors.deliveryLocation ? <span className="mt-2 block text-sm text-rose-600">{errors.deliveryLocation.message}</span> : null}
                </label>
                <label className="block text-sm font-medium text-bark">
                  Preferred completion date
                  <input
                    {...register('preferredDate')}
                    aria-invalid={!!errors.preferredDate}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    type="date"
                  />
                  {errors.preferredDate ? <span className="mt-2 block text-sm text-rose-600">{errors.preferredDate.message}</span> : null}
                </label>
              </div>
              <label className="block text-sm font-medium text-bark">
                Budget range
                <select
                  {...register('budgetRange')}
                  aria-invalid={!!errors.budgetRange}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                >
                  <option value="" disabled>
                    Choose a budget range
                  </option>
                  {budgetRanges.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.budgetRange ? <span className="mt-2 block text-sm text-rose-600">{errors.budgetRange.message}</span> : null}
              </label>
            </section>
          </div>

          <div className="space-y-6">
            <section aria-labelledby="quote-upload-heading" className="rounded-[1.5rem] border border-bark/10 bg-sand/60 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oak-700">Section 3</p>
                  <h2 id="quote-upload-heading" className="mt-3 text-xl font-semibold text-bark">Visual inspiration</h2>
                </div>
                <div className="text-sm text-bark/70">Optional</div>
              </div>
              <label className="block text-sm font-medium text-bark">
                Inspiration image
                <input
                  {...imageField}
                  onChange={(event) => {
                    imageField.onChange(event);
                    const file = event.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    } else {
                      setPreviewUrl(null);
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-bark file:px-4 file:py-2 file:text-sand focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  type="file"
                  accept="image/*"
                />
                {errors.inspirationImage ? <span className="mt-2 block text-sm text-rose-600">{errors.inspirationImage.message}</span> : null}
              </label>
              {previewUrl ? (
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-bark/10 bg-white">
                  <img src={previewUrl} alt="Inspiration preview" loading="lazy" decoding="async" width="700" height="280" className="h-56 w-full object-cover" />
                </div>
              ) : null}
              <label className="block text-sm font-medium text-bark">
                Additional notes
                <textarea
                  {...register('additionalNotes')}
                  aria-invalid={!!errors.additionalNotes}
                  className="mt-2 min-h-[170px] w-full resize-y rounded-xl border border-bark/10 bg-white px-4 py-3 text-base text-bark outline-none transition placeholder:text-bark/40 focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="Share design references, material priorities, or site details."
                />
                {errors.additionalNotes ? <span className="mt-2 block text-sm text-rose-600">{errors.additionalNotes.message}</span> : null}
              </label>
            </section>

            <div className="space-y-4 rounded-[1.5rem] border border-bark/10 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-oak-700">Submission status</p>
              <div className="space-y-3">
                {status === 'success' ? (
                  <div className="rounded-[1.5rem] border border-oak-100 bg-oak-50 p-4 text-oak-900">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="mt-0.5 text-oak-700" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Request submitted</p>
                        <p className="mt-1 text-sm leading-6 text-bark/75">{feedbackMessage}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {status === 'error' ? (
                  <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 p-4 text-rose-900">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="mt-0.5 text-rose-700" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Submission failed</p>
                        <p className="mt-1 text-sm leading-6 text-bark/75">{feedbackMessage}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {status === 'submitting' ? (
                  <div className="rounded-[1.5rem] border border-bark/10 bg-sand/70 p-4 text-bark/75">Sending your request…</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            loading={isSubmitting}
            className="w-full sm:w-auto"
            icon={<ArrowUpRight size={17} aria-hidden="true" />}
          >
            {status === 'success' ? 'Send another request' : 'Send quote request'}
          </Button>
          <p className="max-w-2xl text-sm leading-7 text-bark/70">
            A more detailed brief helps us respond with accurate material, timeline, and cost guidance.
          </p>
        </div>
      </form>
    </Card>
  );
}
