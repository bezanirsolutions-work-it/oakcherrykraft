import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    console.log("Executing schema fix...");

    // Execute the SQL fix by dropping and recreating the is_admin function and policies
    const { error: dropFnError } = await supabase.rpc("sql", {
      query: "DROP FUNCTION IF EXISTS public.is_admin();",
    }).catch(() => ({ error: { message: "Function not available" } }));

    console.log("Drop function result:", dropFnError);

    // Try alternative approach - directly execute through the Supabase API
    // This won't work with rpc since rpc expects a stored function
    // Instead, we'll just return a message that tells the user to manually fix it

    return new Response(
      JSON.stringify({
        message: "Schema fix cannot be executed through edge function",
        solution: "The is_admin() function needs to be updated in the Supabase SQL editor",
        recommended_fix: `
          DROP POLICY IF EXISTS admin_full_access_live_chat_feedback ON public.live_chat_feedback;
          DROP FUNCTION IF EXISTS public.is_admin();
          
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
          
          CREATE POLICY admin_full_access_live_chat_feedback
          ON public.live_chat_feedback
          FOR ALL
          USING (
            auth.uid() IS NOT NULL
            AND public.is_admin()
          )
          WITH CHECK (
            auth.uid() IS NOT NULL
            AND public.is_admin()
          );
        `,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
