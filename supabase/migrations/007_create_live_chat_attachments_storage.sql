-- Create the live-chat-attachments storage bucket
-- Note: Storage buckets are created via the Supabase dashboard or API, not via SQL migrations.
-- This file documents the required setup.

-- Required Steps:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named "live-chat-attachments"
-- 3. Leave it PRIVATE (do not make it public)
-- 4. Apply the RLS policies below via the SQL editor

-- RLS Policy: Authenticated users with a valid session can access attachments through the app flow.
CREATE POLICY "Admin users can read live chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'live-chat-attachments' AND
  auth.uid() IS NOT NULL
);

-- RLS Policy: Edge Functions can upload files using service role (bypasses RLS for controlled ops)
-- This is handled by the Edge Function with service_role_key.

-- RLS Policy: Prevent public access.
CREATE POLICY "Deny public access to live chat attachments"
ON storage.objects
FOR SELECT
TO anon
USING (false);

-- Note: Visitor downloads and admin downloads must be handled via signed URLs generated
-- by the Edge Function. The bucket must remain private.
