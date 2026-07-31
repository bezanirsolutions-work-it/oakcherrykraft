const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '.env');
const envText = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(Boolean).map((line) => {
    const match = line.match(/^(.*?)=(.*)$/);
    return match ? [match[1], match[2]] : null;
  }).filter(Boolean)
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
      console.error('query error', error);
      process.exit(1);
    }
    console.log(JSON.stringify({ row: data?.[0] ?? null }, null, 2));
  } catch (err) {
    console.error('unexpected error', err);
    process.exit(1);
  }
})();
