import { supabase } from './supabase';
import { getProductImage as getCanonicalProductImage } from './imageUtils';
import type { Database } from './database';

export type Product = Database['public']['Tables']['products']['Row'];

const RECENTLY_VIEWED_KEY = 'oakcherrykraft:recently-viewed-products';

export const getProductImage = (
  product: Partial<Product> | null | undefined,
  placeholder = '/assets/hero/intro-picture.webp'
): string =>
  getCanonicalProductImage(
    product as Partial<{ cover_image?: string | null; image_url?: string | null; image_urls?: Array<string | null | undefined> }> | null | undefined,
    placeholder
  );

export const normalizeProduct = (row: Partial<Product> | null | undefined): Product | null => {
  if (!row?.id) return null;

  return {
    id: row.id,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    name: row.name ?? null,
    slug: row.slug ?? null,
    category: row.category ?? null,
    description: row.description ?? null,
    material: row.material ?? null,
    finish: row.finish ?? null,
    colour: row.colour ?? null,
    dimensions: row.dimensions ?? null,
    price: row.price ?? null,
    price_label: row.price_label ?? null,
    image_url: row.image_url ?? null,
    cover_image: row.cover_image ?? null,
    image_urls: row.image_urls ?? null,
    features: row.features ?? null,
    specifications: row.specifications ?? null,
    status: row.status ?? null,
    is_active: row.is_active ?? null,
  };
};

export const normalizeProducts = (rows: Array<Partial<Product> | null> | null | undefined): Product[] =>
  (rows ?? []).map((row) => normalizeProduct(row)).filter((product): product is Product => product !== null);

export const productSelectColumns =
  'id,created_at,updated_at,name,slug,category,description,material,finish,colour,dimensions,price,price_label,image_url,cover_image,image_urls,features,specifications,status,is_active';

export const featuredProductSelectColumns = productSelectColumns;

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  if (!slug) return null;

  const { data, error } = await supabase
    .from('products')
    .select(productSelectColumns)
    .eq('slug', slug)
    .eq('is_active', true)
    .in('status', ['published', 'available'])
    .maybeSingle();

  if (error) throw error;
  return normalizeProduct(data);
};

export const fetchProductsBySlugs = async (slugs: string[]): Promise<Product[]> => {
  if (slugs.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select(productSelectColumns)
    .in('slug', slugs)
    .eq('is_active', true)
    .in('status', ['published', 'available']);

  if (error) throw error;
  const products = normalizeProducts(data);
  return slugs.map((slug) => products.find((item) => item.slug === slug)).filter((item): item is Product => item !== undefined);
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) return [];

  const { data, error } = await supabase
    .from('products')
    .select(productSelectColumns)
    .eq('category', normalizedCategory)
    .eq('is_active', true)
    .in('status', ['published', 'available'])
    .order('display_order', { ascending: true });

  if (error) throw error;
  return normalizeProducts(data);
};

export const fetchRelatedProducts = async (category: string | null, excludeSlug: string | null): Promise<Product[]> => {
  if (!category) {
    return [];
  }

  const products = await fetchProductsByCategory(category);
  const filtered = products.filter((product) => product.slug && product.slug !== excludeSlug);
  if (filtered.length >= 4) {
    return filtered.slice(0, 4);
  }

  return filtered;
};

export const getRecentlyViewedProductSlugs = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value) => typeof value === 'string');
  } catch {
    return [];
  }
};

export const saveRecentlyViewedProductSlug = (slug: string) => {
  if (typeof window === 'undefined') return;
  if (!slug) return;

  try {
    const saved = getRecentlyViewedProductSlugs().filter((value) => value !== slug);
    const next = [slug, ...saved].slice(0, 8);
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore write failures
  }
};

export const fetchRecentlyViewedProducts = async (limit = 4): Promise<Product[]> => {
  const slugs = getRecentlyViewedProductSlugs().filter(Boolean).slice(0, limit);
  if (slugs.length === 0) return [];
  return fetchProductsBySlugs(slugs);
};
