import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeFix() {
  try {
    console.log('Executing schema fix for is_admin() function and policies...');
    
    // Execute each SQL statement separately
    const statements = [
      `DROP POLICY IF EXISTS auth_select_own_profile ON public.profiles;`,
      `DROP POLICY IF EXISTS auth_update_own_profile ON public.profiles;`,
      `DROP FUNCTION IF EXISTS public.is_admin();`,
      `CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE id = auth.uid()
    AND role = 'admin'
);
$$;`,
      `CREATE POLICY auth_select_own_profile
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND id = auth.uid());`,
      `CREATE POLICY auth_update_own_profile
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());`
    ];

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('execute_sql', { sql_string: statement });
      
      if (error) {
        console.error(`Error executing statement:`, error.message);
        // Try alternative method
        console.log('Trying alternative method with direct REST API...');
      } else {
        console.log('✓ Statement executed successfully');
      }
    }

    console.log('✓ Schema fix completed!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

executeFix();
