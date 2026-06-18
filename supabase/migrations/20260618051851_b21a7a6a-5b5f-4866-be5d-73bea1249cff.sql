
-- 1. Source enum
DO $$ BEGIN
  CREATE TYPE public.rfq_source AS ENUM ('whatsapp','email','phone','web','pdf','excel','image','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Compatibility enum
DO $$ BEGIN
  CREATE TYPE public.quote_compatibility_type AS ENUM ('exact','direct_replacement','new_generation','refurbished','alternative');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Extend rfqs
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS source public.rfq_source NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_company text,
  ADD COLUMN IF NOT EXISTS raw_message text,
  ADD COLUMN IF NOT EXISTS source_file_url text;

ALTER TABLE public.rfqs ALTER COLUMN buyer_id DROP NOT NULL;

-- 4. Extend rfq_items
ALTER TABLE public.rfq_items
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS product_family text,
  ADD COLUMN IF NOT EXISTS part_number text;

CREATE INDEX IF NOT EXISTS idx_rfq_items_part_number ON public.rfq_items(part_number);
CREATE INDEX IF NOT EXISTS idx_rfq_items_manufacturer ON public.rfq_items(manufacturer);

-- 5. Extend seller_quote_items
ALTER TABLE public.seller_quote_items
  ADD COLUMN IF NOT EXISTS quoted_part_number text,
  ADD COLUMN IF NOT EXISTS exact_match boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replacement_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS refurbished_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warranty_months integer,
  ADD COLUMN IF NOT EXISTS compatibility_notes text,
  ADD COLUMN IF NOT EXISTS compatibility_type public.quote_compatibility_type;

-- 6. Daily RFQ-YYYYMMDD-XXXX generator
CREATE OR REPLACE FUNCTION public.generate_intake_rfq_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_date text;
  v_prefix text;
  v_count int;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  v_prefix := 'RFQ-' || v_date || '-';
  SELECT COUNT(*) + 1 INTO v_count
    FROM public.rfqs
    WHERE rfq_number LIKE v_prefix || '%';
  RETURN v_prefix || LPAD(v_count::text, 4, '0');
END;
$fn$;

-- 7. Admin-visibility policy for intake RFQs (anonymous / no buyer_id)
DROP POLICY IF EXISTS "Admins manage all rfqs" ON public.rfqs;
CREATE POLICY "Admins manage all rfqs" ON public.rfqs
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage all rfq_items" ON public.rfq_items;
CREATE POLICY "Admins manage all rfq_items" ON public.rfq_items
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
