export interface ProductRow {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  name: string | null;
  slug: string | null;
  category: string | null;
  summary: string | null;
  description: string | null;
  material: string | null;
  finish: string | null;
  colour: string | null;
  dimensions: string | null;
  height: string | null;
  width: string | null;
  depth: string | null;
  dimensionUnit: string | null;
  price: string | null;
  price_label: string | null;
  wood: string | null;
  availability: string | null;
  image: string | null;
  cover_image: string | null;
  image_urls: string[] | null;
  features: string[] | null;
  specifications: string[] | null;
  status: string | null;
  is_active: boolean | null;
  featured: boolean | null;
  is_featured: boolean | null;
  featured_product: boolean | null;
}

export type Product = ProductRow;

export const normalizeProduct = (row: Partial<ProductRow> | null | undefined): Product | null => {
  if (!row?.id) return null;

  return {
    id: row.id,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    name: row.name ?? null,
    slug: row.slug ?? null,
    category: row.category ?? null,
    summary: row.summary ?? null,
    description: row.description ?? null,
    material: row.material ?? null,
    finish: row.finish ?? null,
    colour: row.colour ?? null,
    dimensions: row.dimensions ?? null,
    height: row.height ?? null,
    width: row.width ?? null,
    depth: row.depth ?? null,
    dimensionUnit: row.dimensionUnit ?? null,
    price: row.price ?? null,
    price_label: row.price_label ?? null,
    wood: row.wood ?? null,
    availability: row.availability ?? null,
    image: row.image ?? null,
    cover_image: row.cover_image ?? null,
    image_urls: row.image_urls ?? null,
    features: row.features ?? null,
    specifications: row.specifications ?? null,
    status: row.status ?? null,
    is_active: row.is_active ?? null,
    featured: row.featured ?? null,
    is_featured: row.is_featured ?? null,
    featured_product: row.featured_product ?? null,
  };
};

export const normalizeProducts = (rows: Array<Partial<ProductRow> | null> | null | undefined): Product[] =>
  (rows ?? []).map((row) => normalizeProduct(row)).filter((product): product is Product => product !== null);

export const productSelectColumns =
  'id,created_at,updated_at,name,slug,category,summary,description,material,finish,colour,dimensions,height,width,depth,dimensionUnit,price,price_label,wood,availability,image,cover_image,image_urls,features,specifications,status,is_active,featured,is_featured,featured_product';

export const featuredProductSelectColumns =
  'id,created_at,updated_at,name,category,summary,price,wood,availability,image,cover_image,image_urls,slug,status,is_active,featured,is_featured,featured_product';
