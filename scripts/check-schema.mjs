import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('Env vars found:', {
    url: !!process.env.VITE_SUPABASE_URL,
    key: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  });
  process.exit(1);
}

console.log('Connecting to Supabase at', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFix() {
  try {
    console.log('Testing connection...');
    
    // First, test if we can query the profiles table
    const { data, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error querying profiles table:', testError);
    } else {
      console.log('✓ Successfully connected to profiles table');
    }
    
    // Now test if we can query the live_chat_feedback table
    const { data: fbData, error: fbError } = await supabase
      .from('live_chat_feedback')
      .select('id')
      .limit(1);
    
    if (fbError) {
      console.error('Error querying live_chat_feedback table:', fbError.message);
      if (fbError.message.includes('user_id')) {
        console.log('\n⚠️  Confirmed: user_id column does not exist in profiles table');
        console.log('The profiles table uses refactored schema with id column');
      }
    } else {
      console.log('✓ Successfully queried live_chat_feedback table');
    }
    
    // Try to get the profiles table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');
    
    if (!schemaError && schemaData) {
      console.log('\nProfiles table columns:');
      schemaData.forEach(col => console.log('  -', col.column_name));
    }
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

executeFix();
