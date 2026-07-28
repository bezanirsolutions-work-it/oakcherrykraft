export type PriceEstimatorConfiguration = {
  productType?: string;
  width?: number;
  depth?: number;
  height?: number;
  woodSpecies?: string;
  finish?: string;
  accessories?: string | string[];
};

const productTypeScore: Record<string, number> = {
  Table: 1,
  Seating: 1.05,
  Storage: 1.1,
  Shelving: 1.15,
  Bed: 1.3,
  'Custom installation': 1.5,
};

const woodSpeciesScore: Record<string, number> = {
  Oak: 1,
  Cherry: 1.1,
  Walnut: 1.2,
  Mahogany: 1.35,
  Teak: 1.45,
  'Mixed species': 1.25,
};

const finishScore: Record<string, number> = {
  'Natural oil': 1,
  'Matte lacquer': 1.05,
  'Satin lacquer': 1.08,
  'Hand-rubbed wax': 1.12,
  'Raw edge': 1.15,
  Beeswax: 1.1,
  'Resin Finish': 1.2,
  'Rough Wood Finish': 1.18,
};

const accessoriesScore = (accessories?: string | string[]) => {
  if (!accessories) return 1;
  const count = Array.isArray(accessories)
    ? accessories.filter(Boolean).length
    : accessories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean).length;

  return 1 + Math.min(count, 5) * 0.07;
};

const normalizeDimension = (value: number | undefined, fallback: number) => {
  if (!value || value <= 0) {
    return fallback;
  }

  return value;
};

export function getEstimatedPriceScore(configuration: PriceEstimatorConfiguration) {
  const baseScore = 1;
  const typeFactor = productTypeScore[configuration.productType ?? ''] ?? 1.05;
  const woodFactor = woodSpeciesScore[configuration.woodSpecies ?? ''] ?? 1.1;
  const finishFactor = finishScore[configuration.finish ?? ''] ?? 1.08;
  const accessoryFactor = accessoriesScore(configuration.accessories);

  const width = normalizeDimension(configuration.width, 120);
  const depth = normalizeDimension(configuration.depth, 60);
  const height = normalizeDimension(configuration.height, 75);

  const dimensionalFactor = Math.sqrt((width * depth * height) / 540000) || 1;

  return baseScore * typeFactor * woodFactor * finishFactor * accessoryFactor * dimensionalFactor;
}

export function getEstimatedPriceRange(configuration: PriceEstimatorConfiguration) {
  const score = getEstimatedPriceScore(configuration);

  if (score < 2.5) {
    return '₦100,000 – ₦500,000';
  }

  if (score < 4.2) {
    return '₦500,000 – ₦1,000,000';
  }

  if (score < 5.8) {
    return '₦1,000,000 – ₦2,000,000';
  }

  if (score < 7.5) {
    return '₦2,000,000 – ₦5,000,000';
  }

  if (score < 9.5) {
    return '₦5,000,000 – ₦10,000,000';
  }

  return '₦10,000,000+';
}
