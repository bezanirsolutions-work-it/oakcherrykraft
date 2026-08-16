-- 013_fix_admin_function_and_policies.sql
-- Fix the is_admin() function and profiles RLS policies to work with the refactored schema
-- where profiles.id = auth.users.id (instead of using a separate user_id column)

-- Check if user_id column exists and handle accordingly
DO $$
BEGIN
  -- Drop existing policies that might reference user_id
  DROP POLICY IF EXISTS auth_select_own_profile ON public.profiles;
  DROP POLICY IF EXISTS auth_update_own_profile ON public.profiles;
  
  -- Drop the old is_admin() function
  DROP FUNCTION IF EXISTS public.is_admin();
  
  -- Check if user_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='user_id'
  ) THEN
    -- Old schema: use user_id
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    );
    $$;
    
    CREATE POLICY auth_select_own_profile
    ON public.profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
    
    CREATE POLICY auth_update_own_profile
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  ELSE
    -- New schema: use id
    CREATE OR REPLACE FUNCTION public.is_admin()
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
    $$;
    
    CREATE POLICY auth_select_own_profile
    ON public.profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL AND id = auth.uid());
    
    CREATE POLICY auth_update_own_profile
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() IS NOT NULL AND id = auth.uid())
    WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());
  END IF;
END $$;
