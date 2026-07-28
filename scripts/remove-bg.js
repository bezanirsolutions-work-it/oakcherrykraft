// Simple white-background remover using sharp (ES module)
// Usage: run `npm install sharp` then `node scripts/remove-bg.js`

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const INPUT = path.join(process.cwd(), 'public', 'assets', 'hero', 'intro-picture.png');
const OUTPUT = path.join(process.cwd(), 'public', 'assets', 'hero', 'intro-picture-transparent.png');

if (!fs.existsSync(INPUT)) {
  console.error('Input file not found:', INPUT);
  process.exit(2);
}

try {
  const img = sharp(INPUT);
  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const src = data;

  const out = Buffer.alloc(width * height * 4);
  const threshold = 240; // RGB values above this considered background (tweak if needed)

  for (let i = 0, j = 0; i < src.length; i += channels, j += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const aSrc = channels === 4 ? src[i + 3] : 255;

    const isWhite = r >= threshold && g >= threshold && b >= threshold;

    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = isWhite ? 0 : aSrc;
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(OUTPUT);
  console.log('Wrote transparent image:', OUTPUT);
} catch (err) {
  console.error('Error processing image:', err);
  process.exit(1);
}
