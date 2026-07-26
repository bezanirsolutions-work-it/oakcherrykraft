-- Supabase Storage policies for the product-images bucket
-- These policies keep RLS enabled and allow authenticated admins to manage images.

-- 1) Allow authenticated users to view objects in the bucket
create policy if not exists "Authenticated users can view product images"
on storage.objects for select
to authenticated
using (bucket_id = 'product-images');

-- 2) Allow authenticated users to insert objects into the bucket
create policy if not exists "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

-- 3) Allow authenticated users to update objects in the bucket
create policy if not exists "Authenticated users can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

-- 4) Allow authenticated users to delete objects from the bucket
create policy if not exists "Authenticated users can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');
