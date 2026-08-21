/**
 * Oak Cherry Kraft Product Category Architecture
 *
 * This is the single authoritative source for the product/space category hierarchy.
 * All consumers (homepage, products page, admin, chatbot, etc.) derive from this definition.
 */

// ============================================================================
// CATEGORY DEFINITION
// ============================================================================

export interface ProductCategoryDef {
  slug: string;
  displayLabel: string;
  parent?: 'residential' | 'commercial';
  description?: string;
}

export interface ProductCategoryGroup {
  groupSlug: 'residential' | 'commercial';
  groupLabel: string;
  categories: ProductCategoryDef[];
}

/**
 * Canonical category hierarchy.
 * Slugs are stable, used for routing.
 * Display labels are what users see.
 */
export const CATEGORY_HIERARCHY: ProductCategoryGroup[] = [
  {
    groupSlug: 'residential',
    groupLabel: 'Residential',
    categories: [
      { slug: 'entryway-and-foyer', displayLabel: 'Entryway & Foyers', parent: 'residential' },
      { slug: 'living-spaces', displayLabel: 'Living Spaces', parent: 'residential' },
      { slug: 'dining', displayLabel: 'Dining', parent: 'residential' },
      { slug: 'kitchen', displayLabel: 'Kitchen', parent: 'residential' },
      { slug: 'bedrooms', displayLabel: 'Bedroom', parent: 'residential' },
      { slug: 'bathroom-and-vanity', displayLabel: 'Bathroom & Vanity', parent: 'residential' },
      { slug: 'hallways-and-passageways', displayLabel: 'Hallways & Passages', parent: 'residential' },
      { slug: 'ante-room', displayLabel: 'Anteroom', parent: 'residential' },
      { slug: 'outdoor-living', displayLabel: 'Outdoor Living', parent: 'residential' },
    ],
  },
  {
    groupSlug: 'commercial',
    groupLabel: 'Commercial',
    categories: [
      { slug: 'offices', displayLabel: 'Offices', parent: 'commercial' },
      { slug: 'restaurants', displayLabel: 'Restaurants', parent: 'commercial' },
      { slug: 'lounges', displayLabel: 'Lounges', parent: 'commercial' },
    ],
  },
];

// ============================================================================
// DERIVED CONSTANTS
// ============================================================================

/**
 * Flat list of all category slugs for validation/type checking.
 */
const ALL_CATEGORY_SLUGS_ARRAY = CATEGORY_HIERARCHY.flatMap((group) =>
  group.categories.map((cat) => cat.slug)
);

export const ALL_CATEGORY_SLUGS = ALL_CATEGORY_SLUGS_ARRAY as unknown as readonly string[];

export type ProductCategorySlug = typeof ALL_CATEGORY_SLUGS_ARRAY[number];

/**
 * Map of slug → ProductCategoryDef for fast lookup.
 */
export const CATEGORY_SLUG_MAP = new Map(
  CATEGORY_HIERARCHY.flatMap((group) =>
    group.categories.map((cat) => [cat.slug, cat] as const)
  )
);

/**
 * Map of displayLabel → slug for reverse lookup.
 */
export const CATEGORY_LABEL_MAP = new Map(
  CATEGORY_HIERARCHY.flatMap((group) =>
    group.categories.map((cat) => [cat.displayLabel.toLowerCase(), cat.slug] as const)
  )
);

// ============================================================================
// LEGACY PRODUCT CATEGORY MAPPING
// ============================================================================

/**
 * Maps old product category values to new canonical slugs.
 * Used for backward compatibility when reading existing products from the database.
 */
const LEGACY_PRODUCT_CATEGORY_MAP: Record<string, ProductCategorySlug> = {
  // Old canonical categories
  'dining': 'dining',
  'living room': 'living-spaces',
  'bedroom': 'bedrooms',
  'office': 'offices',
  'kitchen': 'kitchen',
  'outdoor': 'outdoor-living',

  // Old product type categories
  'dining tables': 'dining',
  'coffee tables': 'living-spaces',
  'tv units': 'living-spaces',
  'tv unit': 'living-spaces',
  'wardrobes': 'bedrooms',
  'wardrobe': 'bedrooms',
  'bedroom furniture': 'bedrooms',
  'office furniture': 'offices',
  'kitchen cabinets': 'kitchen',
  'kitchen furniture': 'kitchen',
  'shelving': 'living-spaces',
  'outdoor furniture': 'outdoor-living',
  'custom furniture': 'dining', // Fallback; custom furniture should be reclassified
  'custom': 'dining',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes a string to a slug format (lowercase, hyphens, no special chars).
 */
export const normalizeToSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

/**
 * Gets a category definition by slug.
 * Returns null if the slug is not found.
 */
export const getCategoryBySlug = (slug: string | null | undefined): ProductCategoryDef | null => {
  if (!slug) return null;
  const normalized = normalizeToSlug(slug);
  return CATEGORY_SLUG_MAP.get(normalized as ProductCategorySlug) ?? null;
};

/**
 * Gets a canonical slug from either a current slug or a legacy value.
 * Returns null if the value cannot be mapped.
 */
export const getCanonicalCategorySlug = (value: string | null | undefined): ProductCategorySlug | null => {
  if (!value) return null;

  const trimmed = value.trim();

  // Try direct slug lookup
  const normalized = normalizeToSlug(trimmed);
  if (CATEGORY_SLUG_MAP.has(normalized as ProductCategorySlug)) {
    return normalized as ProductCategorySlug;
  }

  // Try legacy mapping
  const legacy = LEGACY_PRODUCT_CATEGORY_MAP[trimmed.toLowerCase()];
  if (legacy) return legacy;

  // Try legacy mapping with normalized form
  const legacyNormalized = LEGACY_PRODUCT_CATEGORY_MAP[normalized.toLowerCase()];
  if (legacyNormalized) return legacyNormalized;

  return null;
};

/**
 * Gets the display label for a category slug.
 * Returns the slug itself if not found (for debugging).
 */
export const getCategoryDisplayLabel = (slug: string | null | undefined): string => {
  if (!slug) return '';
  const category = getCategoryBySlug(slug);
  return category?.displayLabel ?? slug;
};

/**
 * Gets the parent group (residential/commercial) for a category slug.
 * Returns null if not found.
 */
export const getCategoryGroup = (slug: string | null | undefined): 'residential' | 'commercial' | null => {
  if (!slug) return null;
  const category = getCategoryBySlug(slug);
  return category?.parent ?? null;
};

/**
 * Gets all categories for a specific group.
 */
export const getCategoriesByGroup = (group: 'residential' | 'commercial'): ProductCategoryDef[] => {
  return CATEGORY_HIERARCHY.find((g) => g.groupSlug === group)?.categories ?? [];
};

/**
 * Generates a product detail URL path component.
 * Example: /products/dining/product-slug
 */
export const getProductCategoryPath = (categorySlug: string | null | undefined): string => {
  const canonical = getCanonicalCategorySlug(categorySlug);
  return canonical ?? '';
};

// ============================================================================
// LEGACY EXPORTS (BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Backward compatibility: old flat array for gradual migration.
 * Prefer CATEGORY_HIERARCHY or specific category lookup functions.
 */
export const PRODUCT_CATEGORIES = Array.from(CATEGORY_SLUG_MAP.keys());
export type ProductCategory = ProductCategorySlug;

export const normalizeProductCategorySlug = normalizeToSlug;

export const getProductCategoryFromSlug = getCategoryBySlug;

export const getCanonicalProductCategory = getCanonicalCategorySlug;
