import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  photo_url: string | null;
  rating: number | null;
  testimonial: string;
  featured: boolean | null;
  display_order: number | null;
  created_at: string | null;
}

interface UseTestimonialsReturn {
  testimonials: Testimonial[];
  loading: boolean;
  error: string | null;
  fetchTestimonials: () => Promise<void>;
}

export function useTestimonials(): UseTestimonialsReturn {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTestimonials((data ?? []).map((item) => ({
        ...item,
        rating: item.rating ?? null,
        featured: item.featured ?? false,
        display_order: item.display_order ?? 0,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load testimonials');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTestimonials();
  }, [fetchTestimonials]);

  return {
    testimonials,
    loading,
    error,
    fetchTestimonials,
  };
}
