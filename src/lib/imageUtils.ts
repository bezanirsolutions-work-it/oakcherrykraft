const DEFAULT_PLACEHOLDER = '/assets/hero/intro-picture.webp';

const isSafeImageSource = (value: string | null | undefined): value is string => {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return true;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }

  if (trimmed.startsWith('/')) {
    return true;
  }

  return !/^(?:about:|javascript:)/i.test(trimmed);
};

export const getSafeImageSrc = (
  src: string | null | undefined,
  fallback = DEFAULT_PLACEHOLDER
): string => {
  if (!isSafeImageSource(src)) {
    return fallback;
  }

  return src!.trim();
};

export const normalizeImageUrl = (
  value: string | null | undefined,
  _bucket?: string | null
): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!isSafeImageSource(trimmed)) {
    return null;
  }

  return trimmed.replace(/\\/g, '/');
};

export const normalizeProductImageFields = <T extends {
  cover_image?: string | null;
  image_url?: string | null;
  image_urls?: Array<string | null | undefined> | null;
}>(product: T | null | undefined) => {
  if (!product) {
    return product;
  }

  const normalizedImages = [product.cover_image, product.image_url, ...(product.image_urls ?? [])]
    .map((value) => normalizeImageUrl(value))
    .filter((value): value is string => Boolean(value));

  const firstImage = normalizedImages[0] ?? null;

  return {
    ...product,
    cover_image: firstImage,
    image_url: firstImage,
    image_urls: Array.from(new Set(normalizedImages)),
  };
};

export const getProductImage = (
  product: Partial<{
    cover_image?: string | null;
    image_url?: string | null;
    image_urls?: Array<string | null | undefined> | null;
  }> | null | undefined,
  placeholder = DEFAULT_PLACEHOLDER
): string => {
  const sources = [product?.cover_image, product?.image_url, ...(product?.image_urls ?? [])];

  for (const source of sources) {
    const normalized = normalizeImageUrl(source);
    if (normalized) {
      return getSafeImageSrc(normalized, placeholder);
    }
  }

  return placeholder;
};
