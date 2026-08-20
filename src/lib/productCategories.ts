export const PRODUCT_CATEGORIES = [
  'Dining',
  'Living Room',
  'Bedroom',
  'Office',
  'Kitchen',
  'Outdoor',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const normalizeProductCategorySlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export const getProductCategoryFromSlug = (value: string | null | undefined): ProductCategory | null => {
  if (!value) return null;

  const normalizedSlug = normalizeProductCategorySlug(value);
  return PRODUCT_CATEGORIES.find(
    (category) => normalizeProductCategorySlug(category) === normalizedSlug
  ) ?? null;
};

const LEGACY_PRODUCT_CATEGORY_MAP: Record<string, ProductCategory> = {
  'dining tables': 'Dining',
  'coffee tables': 'Living Room',
  'tv units': 'Living Room',
  wardrobes: 'Bedroom',
  'bedroom furniture': 'Bedroom',
  'office furniture': 'Office',
  'kitchen cabinets': 'Kitchen',
  'outdoor furniture': 'Outdoor',
};

export const getCanonicalProductCategory = (value: string | null | undefined): ProductCategory | null => {
  if (!value) return null;

  return getProductCategoryFromSlug(value) ?? LEGACY_PRODUCT_CATEGORY_MAP[value.trim().toLowerCase()] ?? null;
};
