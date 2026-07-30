import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const sources = [
  { input: 'public/assets/hero/GENERATED.png', output: 'public/assets/hero/GENERATED.webp', width: 1600, quality: 80 },
  { input: 'public/assets/hero/intro-picture.png', output: 'public/assets/hero/intro-picture.webp', width: 1400, quality: 80 },
  { input: 'public/assets/living-room-cover.jpeg', output: 'public/assets/living-room-cover.webp', width: 1400, quality: 80 },
  { input: 'public/assets/bedroom-furniture-cover.jpeg', output: 'public/assets/bedroom-furniture-cover.webp', width: 1400, quality: 80 },
  { input: 'public/assets/office-furniture-cover.jpeg', output: 'public/assets/office-furniture-cover.webp', width: 1400, quality: 80 },
  { input: 'public/assets/19.jpeg', output: 'public/assets/19.webp', width: 1400, quality: 80 },
  { input: 'public/assets/outdoor-furniture.jpeg', output: 'public/assets/outdoor-furniture.webp', width: 1400, quality: 80 },
  { input: 'public/assets/about-page.jpeg', output: 'public/assets/about-page.webp', width: 1400, quality: 80 },
];

for (const entry of sources) {
  mkdirSync(resolve(dirname(entry.output)), { recursive: true });
  await sharp(entry.input)
    .resize({ width: entry.width, withoutEnlargement: true })
    .webp({ quality: entry.quality })
    .toFile(entry.output);
  console.log(`Created ${entry.output}`);
}
