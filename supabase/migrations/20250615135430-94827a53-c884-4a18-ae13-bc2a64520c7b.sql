
-- Add columns to orders for UTR/payment reference number and payment proof file
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_proof_url text;

-- Optionally, record in the invoice table (already exists)
-- No changes required there unless you want additional invoice fields.

-- Make sure the admin can see all new/pending orders as per your existing admin orders view.

