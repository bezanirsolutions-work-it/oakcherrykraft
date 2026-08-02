import { getProductImage as getCanonicalProductImage } from './imageUtils';

export interface ProductRow {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  name: string | null;
  slug: string | null;
  category: string | null;
  description: string | null;
  material: string | null;
  finish: string | null;
  colour: string | null;
  dimensions: string | null;
  price: number | string | null;
  price_label: string | null;
  image_url: string | null;
  cover_image: string | null;
  image_urls: string[] | null;
  features: string[] | null;
  specifications: string[] | null;
  status: string | null;
  is_active: boolean | null;
}

export type Product = ProductRow;

export const getProductImage = (
  product: Partial<ProductRow> | null | undefined,
  placeholder = '/assets/hero/intro-picture.webp'
): string => getCanonicalProductImage(product as Partial<{ cover_image?: string | null; image_url?: string | null; image_urls?: Array<string | null | undefined> }> | null | undefined, placeholder);

export const normalizeProduct = (row: Partial<ProductRow> | null | undefined): Product | null => {
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

export const normalizeProducts = (rows: Array<Partial<ProductRow> | null> | null | undefined): Product[] =>
  (rows ?? []).map((row) => normalizeProduct(row)).filter((product): product is Product => product !== null);

export const productSelectColumns =
  'id,created_at,updated_at,name,slug,category,description,material,finish,colour,dimensions,price,price_label,image_url,cover_image,image_urls,features,specifications,status,is_active';

export const featuredProductSelectColumns = productSelectColumns;
