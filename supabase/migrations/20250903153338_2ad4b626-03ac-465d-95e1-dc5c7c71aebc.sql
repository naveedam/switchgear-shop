
-- 1) Storage policies for payment-proofs bucket
-- Assumes bucket "payment-proofs" already exists and is private.
-- Policy pattern: users can only upload/select inside a folder named after their auth.uid()

-- Allow authenticated users to upload into their own folder in payment-proofs
create policy "Users can upload their own payment proofs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Allow authenticated users to read their own payment proofs
create policy "Users can view their own payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Allow admins to view all payment proofs
create policy "Admins can view all payment proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.companies c
    where c.id = auth.uid()
      and c.role = 'admin'
  )
);

-- (Optional) Allow admins to manage (update/delete) payment proofs if needed
-- Uncomment if admin needs to delete/replace files
-- create policy "Admins can manage payment proofs"
-- on storage.objects
-- for all
-- to authenticated
-- using (
--   bucket_id = 'payment-proofs'
--   and exists (
--     select 1 from public.companies c
--     where c.id = auth.uid()
--       and c.role = 'admin'
--   )
-- )
-- with check (
--   bucket_id = 'payment-proofs'
--   and exists (
--     select 1 from public.companies c
--     where c.id = auth.uid()
--       and c.role = 'admin'
--   )
-- );


-- 2) Admin visibility into carts and cart items

-- Allow admins to list all shopping carts
create policy "Admins can view all carts"
on public.shopping_carts
for select
to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = auth.uid()
      and c.role = 'admin'
  )
);

-- Allow admins to view all cart items
create policy "Admins can view all cart items"
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = auth.uid()
      and c.role = 'admin'
  )
);

-- Allow admins to delete any cart items (enables "Clear Cart")
create policy "Admins can delete cart items"
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1 from public.companies c
    where c.id = auth.uid()
      and c.role = 'admin'
  )
);
  