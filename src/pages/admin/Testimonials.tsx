import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button, Card, EmptyState, LoadingState, SectionHeader } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database';

type TestimonialRow = Database['public']['Tables']['testimonials']['Row'];

type TestimonialFormValues = Omit<TestimonialRow, 'id' | 'created_at'> & {
  name: string;
  role: string;
  company: string;
  photo_url: string;
  rating: number;
  testimonial: string;
  featured: boolean;
  display_order: number;
};

const blankTestimonial: TestimonialFormValues = {
  name: '',
  role: '',
  company: '',
  photo_url: '',
  rating: 5,
  testimonial: '',
  featured: false,
  display_order: 0,
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formValues, setFormValues] = useState<TestimonialFormValues>(blankTestimonial);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialRow | null>(null);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTestimonials(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTestimonials();
  }, [loadTestimonials]);

  const filteredTestimonials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return testimonials;

    return testimonials.filter((item) =>
      [item.name, item.role ?? '', item.company ?? '', item.testimonial].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, testimonials]);

  const resetForm = () => {
    setSelectedTestimonial(null);
    setFormValues(blankTestimonial);
    setSaveMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        name: formValues.name || 'Anonymous',
        role: formValues.role || null,
        company: formValues.company || null,
        photo_url: formValues.photo_url || null,
        rating: formValues.rating ?? 0,
        testimonial: formValues.testimonial,
        featured: formValues.featured,
        display_order: formValues.display_order ?? 0,
      };

      if (selectedTestimonial) {
        const { error: updateError } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', selectedTestimonial.id);
        if (updateError) throw updateError;
        setSaveMessage('Testimonial updated successfully.');
      } else {
        const { error: insertError } = await supabase.from('testimonials').insert(payload);
        if (insertError) throw insertError;
        setSaveMessage('Testimonial created successfully.');
      }

      await loadTestimonials();
      resetForm();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Unable to save testimonial.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (testimonial: TestimonialRow) => {
    setSelectedTestimonial(testimonial);
    setFormValues({
      name: testimonial.name,
      role: testimonial.role ?? '',
      company: testimonial.company ?? '',
      photo_url: testimonial.photo_url ?? '',
      rating: testimonial.rating ?? 5,
      testimonial: testimonial.testimonial,
      featured: testimonial.featured ?? false,
      display_order: testimonial.display_order ?? 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (testimonial: TestimonialRow) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { error: deleteError } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonial.id);

      if (deleteError) throw deleteError;
      setSaveMessage('Testimonial deleted successfully.');
      await loadTestimonials();
      resetForm();
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Unable to delete testimonial.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Testimonials | Oak Cherry Kraft Admin</title>
      </Helmet>

      <section className="rounded-[2rem] border border-bark/10 bg-white p-8 shadow-soft">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-bark/60">Testimonials</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-bark">Manage testimonials</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-bark/70">
              Add, update, and order client stories that appear on the homepage and studio site.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-bark/60">Quick search</p>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search testimonials"
                className="mt-3 w-full rounded-full border border-bark/10 bg-white px-4 py-3 text-sm text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
              />
            </div>
            <Button variant="secondary" onClick={resetForm} className="w-full">
              {selectedTestimonial ? 'Cancel edit' : 'Clear form'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-6">
            <SectionHeader eyebrow={selectedTestimonial ? 'Edit testimonial' : 'New testimonial'} title={selectedTestimonial ? 'Update testimonial details' : 'Add a client story'} />
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Name
                  <input
                    value={formValues.name}
                    onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    placeholder="Client name"
                  />
                </label>
                <label className="block text-sm font-medium text-bark">
                  Role or title
                  <input
                    value={formValues.role}
                    onChange={(event) => setFormValues((current) => ({ ...current, role: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    placeholder="Role or client title"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-bark">
                  Company
                  <input
                    value={formValues.company}
                    onChange={(event) => setFormValues((current) => ({ ...current, company: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    placeholder="Company or project"
                  />
                </label>
                <label className="block text-sm font-medium text-bark">
                  Photo URL
                  <input
                    value={formValues.photo_url}
                    onChange={(event) => setFormValues((current) => ({ ...current, photo_url: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-bark">
                Testimonial
                <textarea
                  value={formValues.testimonial}
                  onChange={(event) => setFormValues((current) => ({ ...current, testimonial: event.target.value }))}
                  required
                  rows={5}
                  className="mt-2 w-full rounded-[1.25rem] border border-bark/10 bg-sand/70 px-4 py-4 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  placeholder="Client story or quote"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block text-sm font-medium text-bark">
                  Rating
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formValues.rating ?? 5}
                    onChange={(event) => setFormValues((current) => ({ ...current, rating: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  />
                </label>
                <label className="block text-sm font-medium text-bark">
                  Featured
                  <select
                    value={formValues.featured ? 'yes' : 'no'}
                    onChange={(event) => setFormValues((current) => ({ ...current, featured: event.target.value === 'yes' }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-bark">
                  Display order
                  <input
                    type="number"
                    min={0}
                    value={formValues.display_order ?? 0}
                    onChange={(event) => setFormValues((current) => ({ ...current, display_order: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-bark/10 bg-sand/70 px-4 py-3 text-base text-bark outline-none transition focus:border-oak-600 focus:ring-4 focus:ring-oak-200"
                  />
                </label>
              </div>

              {saveMessage ? <p className="text-sm text-bark/70">{saveMessage}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={isSaving}>
                  {selectedTestimonial ? 'Save changes' : 'Create testimonial'}
                </Button>
                <Button variant="secondary" onClick={resetForm} disabled={isSaving}>
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          <Card className="space-y-5">
            <SectionHeader eyebrow="Existing testimonials" title="Client stories" />
            {loading ? (
              <LoadingState />
            ) : error ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
            ) : testimonials.length === 0 ? (
              <EmptyState title="No testimonials found" description="Create a testimonial to display on the homepage." />
            ) : (
              <div className="space-y-4">
                {filteredTestimonials.map((testimonial) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.5rem] border border-bark/10 bg-sand p-5"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-bark">{testimonial.name}</p>
                        <p className="text-sm text-bark/70">{testimonial.role ?? testimonial.company ?? 'Client'}</p>
                      </div>
                      {testimonial.featured ? (
                        <div className="rounded-full bg-oak-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-oak-700">
                          Featured
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-bark/75">{testimonial.testimonial}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1 text-sm text-bark/60">
                        <Star size={14} />
                        {testimonial.rating ?? 0}/5
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(testimonial)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(testimonial)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}
