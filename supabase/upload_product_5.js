import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = process.env.VITE_SUPABASE_IMAGE_BUCKET || 'product-images';
const IMAGE_FILE = '5.jpeg';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const filePath = path.resolve(process.cwd(), IMAGE_FILE);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const fileData = fs.readFileSync(filePath);
const filename = path.basename(filePath);
const productId = `carved-handrail-floating-staircase-${Date.now()}`;
const storagePath = `products/${productId}/${Date.now()}-${filename}`;

async function run() {
  console.log('Uploading image to bucket:', BUCKET);
  const uploadResult = await supabase.storage.from(BUCKET).upload(storagePath, fileData, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  });

  if (uploadResult.error) {
    console.error('Upload failed:', uploadResult.error);
    process.exit(1);
  }

  const publicUrlResult = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  if (publicUrlResult.error || !publicUrlResult.data?.publicUrl) {
    console.error('Unable to get public URL:', publicUrlResult.error);
    process.exit(1);
  }

  const imageUrl = publicUrlResult.data.publicUrl;
  console.log('Uploaded image URL:', imageUrl);

  const newProduct = {
    name: 'Carved Handrail Floating Wooden Staircase',
    slug: 'carved-handrail-floating-wooden-staircase',
    category: 'custom furniture',
    description: 'A modern custom architectural staircase featuring thick, floating solid wood treads mounted on a dark metal spine frame. It is complemented by a wall-mounted handrail and an outer guardrail, both featuring intricate decorative wave-pattern carvings along the top surface, supported by black wrought iron balusters and a dark turned newel post.',
    summary: 'Floating wood staircase with carved handrail, warm honey teak tones, and charcoal black metal accents.',
    material: 'Teak',
    finish: 'Satin',
    colour: 'Warm Honey Teak / Golden Brown with Charcoal Black Accents',
    price_label: 'Call for Quote',
    price: 0,
    wood: 'Teak',
    status: 'published',
    is_active: true,
    image: imageUrl,
    cover_image: imageUrl,
    image_urls: [imageUrl],
  };

  const { data, error } = await supabase.from('products').insert([newProduct]).select('*').single();
  if (error) {
    console.error('Product insert failed:', error);
    process.exit(1);
  }

  console.log('Product created:', data);
}

run().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});