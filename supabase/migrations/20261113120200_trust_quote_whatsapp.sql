-- =====================================================================
-- CONVERSION FEATURES
--   seller_brand_authorizations  "Authorised dealer" badges per brand
--   seller_reviews + seller_ratings view
--   instant_bom_quote()          BOM -> priced quote in one call
--   notification_outbox          WhatsApp queue fed by order/quote events
-- =====================================================================

-- ---------- authorised dealer badges ---------------------------------
-- The table already exists (2025-08 migration). There, status = 'active'
-- means verified. We keep that meaning and add a review workflow:
--   pending -> active | rejected ; active -> expired
-- seller_id here is the seller's companies.id (auth uid).
ALTER TABLE public.seller_brand_authorizations ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE public.seller_brand_authorizations ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.seller_brand_authorizations ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.seller_brand_authorizations ADD COLUMN IF NOT EXISTS review_note text;

DROP POLICY IF EXISTS "verified authorizations are public" ON public.seller_brand_authorizations;
DROP POLICY IF EXISTS "sellers see their own submissions" ON public.seller_brand_authorizations;
CREATE POLICY "sellers see their own submissions" ON public.seller_brand_authorizations
  FOR SELECT TO authenticated USING (seller_id = auth.uid() OR public.is_platform_admin());
DROP POLICY IF EXISTS "sellers submit their own" ON public.seller_brand_authorizations;
CREATE POLICY "sellers submit their own" ON public.seller_brand_authorizations
  FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS "admins review" ON public.seller_brand_authorizations;
CREATE POLICY "admins review" ON public.seller_brand_authorizations
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- ---------- reviews --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_order_id  uuid NOT NULL UNIQUE REFERENCES public.seller_orders(id) ON DELETE CASCADE,
  seller_id        uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  buyer_id         uuid NOT NULL,
  rating           smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  on_time          boolean,
  genuine_product  boolean,
  comment          text CHECK (char_length(comment) <= 1000),
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews are public" ON public.seller_reviews;
CREATE POLICY "reviews are public" ON public.seller_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "buyers review delivered orders" ON public.seller_reviews;
CREATE POLICY "buyers review delivered orders" ON public.seller_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.seller_orders so JOIN public.orders o ON o.id = so.order_id
      WHERE so.id = seller_order_id AND so.seller_id = seller_reviews.seller_id
        AND o.buyer_id = auth.uid() AND so.status = 'delivered'));

CREATE OR REPLACE VIEW public.seller_trust AS
SELECT c.id AS seller_id,
       c.gst_verified,
       c.bank_verified,
       round(avg(r.rating)::numeric, 1)                       AS avg_rating,
       count(r.id)                                            AS review_count,
       round(100.0 * avg(CASE WHEN r.on_time IS NULL THEN NULL WHEN r.on_time THEN 1 ELSE 0 END), 0) AS on_time_pct,
       coalesce((SELECT array_agg(b.name ORDER BY b.name)
                   FROM public.seller_brand_authorizations a
                   JOIN public.brands b ON b.id = a.brand_id
                  WHERE a.seller_id = c.id AND a.status = 'active'
                    AND (a.valid_until IS NULL OR a.valid_until >= current_date)),
                '{}')                                         AS authorised_brands
FROM public.companies c
LEFT JOIN public.seller_reviews r ON r.seller_id = c.id
WHERE c.is_vendor = true OR c.role = 'seller'
GROUP BY c.id;
GRANT SELECT ON public.seller_trust TO anon, authenticated;

-- ---------- instant BOM quote ----------------------------------------
-- For every line of a BOM, find the cheapest live offer for the same part
-- (same model number / matched product) across all sellers, priced for the
-- buyer at that quantity. Falls back to full-text search on the description.
CREATE OR REPLACE FUNCTION public.instant_bom_quote(p_bom_id uuid)
RETURNS TABLE (
  bom_item_id     uuid,
  line_number     integer,
  description     text,
  quantity        numeric,
  product_id      uuid,
  product_name    text,
  model_number    text,
  seller_id       uuid,
  seller_name     text,
  unit_price      numeric,
  line_total      numeric,
  in_stock        boolean,
  lead_time_days  integer,
  dispatch_city   text,
  match_type      text,
  offers_count    integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = p_bom_id
                 AND (buyer_id = auth.uid() OR public.is_platform_admin())) THEN
    RAISE EXCEPTION 'BOM not found';
  END IF;

  RETURN QUERY
  WITH items AS (
    SELECT bi.id, bi.line_number, bi.description,
           greatest(coalesce(bi.quantity, 1), 1)::numeric AS qty,
           mp.model_number AS m_model, mp.brand_id AS m_brand
    FROM public.bom_items bi
    LEFT JOIN public.products mp ON mp.id = bi.matched_product_id
    WHERE bi.bom_id = p_bom_id
  ),
  candidates AS (
    -- exact part matches (same model number, any seller)
    SELECT i.id AS item_id, p.id AS pid, 'exact'::text AS mt
    FROM items i JOIN public.products p
      ON i.m_model IS NOT NULL AND lower(p.model_number) = lower(i.m_model)
     AND (i.m_brand IS NULL OR p.brand_id = i.m_brand)
    UNION
    -- text matches for unmatched lines
    SELECT i.id, p.id, 'similar'
    FROM items i
    CROSS JOIN LATERAL (
      SELECT p.id FROM public.products p
      WHERE i.m_model IS NULL
        AND p.search_vector @@ websearch_to_tsquery('simple', i.description)
      ORDER BY ts_rank(p.search_vector, websearch_to_tsquery('simple', i.description)) DESC
      LIMIT 5) p
  ),
  offers AS (
    SELECT c.item_id, c.mt, p.id AS pid, p.name, p.model_number, p.vendor_id,
           co.name AS seller_name,
           public.unit_price_for(p.id, i.qty::integer, auth.uid()) AS price,
           (p.stock_quantity IS NULL OR p.stock_quantity >= i.qty) AS in_stock,
           p.lead_time_days, p.dispatch_city, i.qty
    FROM candidates c
    JOIN items i ON i.id = c.item_id
    JOIN public.products p ON p.id = c.pid
    LEFT JOIN public.companies co ON co.id = p.vendor_id
    WHERE coalesce(p.status, 'active') = 'active' AND p.price > 0
  ),
  ranked AS (
    SELECT o.*, row_number() OVER (PARTITION BY o.item_id
             ORDER BY o.mt = 'exact' DESC, o.in_stock DESC, o.price ASC,
                      coalesce(o.lead_time_days, 99) ASC) AS rn,
           count(*) OVER (PARTITION BY o.item_id)::integer AS n
    FROM offers o
  )
  SELECT i.id, i.line_number, i.description, i.qty,
         r.pid, r.name, r.model_number, r.vendor_id, r.seller_name,
         r.price, round(r.price * i.qty, 2), r.in_stock,
         r.lead_time_days, r.dispatch_city,
         coalesce(r.mt, 'none'), coalesce(r.n, 0)
  FROM items i
  LEFT JOIN ranked r ON r.item_id = i.id AND r.rn = 1
  ORDER BY i.line_number;
END $$;
REVOKE ALL ON FUNCTION public.instant_bom_quote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.instant_bom_quote(uuid) TO authenticated;

-- ---------- WhatsApp notifications -----------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_number text;     -- E.164, e.g. 919880000000
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_opt_in boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id            bigserial PRIMARY KEY,
  channel       text NOT NULL DEFAULT 'whatsapp',
  recipient_id  uuid NOT NULL,
  template      text NOT NULL,             -- Meta-approved template name
  params        jsonb NOT NULL DEFAULT '[]',
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  attempts      smallint NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz
);
CREATE INDEX IF NOT EXISTS idx_outbox_queued ON public.notification_outbox(created_at) WHERE status = 'queued';
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read outbox" ON public.notification_outbox;
CREATE POLICY "admins read outbox" ON public.notification_outbox
  FOR SELECT TO authenticated USING (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.enqueue_whatsapp(p_recipient uuid, p_template text, p_params jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notification_outbox (recipient_id, template, params)
  SELECT p_recipient, p_template, p_params
  WHERE EXISTS (SELECT 1 FROM public.companies
                WHERE id = p_recipient AND whatsapp_opt_in AND whatsapp_number IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.enqueue_whatsapp(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_seller_order_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_buyer uuid;
BEGIN
  SELECT buyer_id INTO v_buyer FROM public.orders WHERE id = NEW.order_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_whatsapp(NEW.seller_id, 'new_order_seller',
      jsonb_build_array(left(NEW.id::text, 8), to_char(NEW.total_amount, 'FM99,99,99,990')));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.enqueue_whatsapp(v_buyer, 'order_status_buyer',
      jsonb_build_array(left(NEW.order_id::text, 8), NEW.status,
                        coalesce(NEW.tracking_url, NEW.tracking_number, '')));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_seller_order_events ON public.seller_orders;
CREATE TRIGGER trg_notify_seller_order_events
  AFTER INSERT OR UPDATE OF status ON public.seller_orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_order_events();

CREATE OR REPLACE FUNCTION public.notify_quote_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_buyer uuid; v_rfq text;
BEGIN
  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    SELECT buyer_id, coalesce(rfq_number, left(id::text, 8)) INTO v_buyer, v_rfq
      FROM public.rfqs WHERE id = NEW.rfq_id;
    PERFORM public.enqueue_whatsapp(v_buyer, 'new_quote_buyer',
      jsonb_build_array(v_rfq, to_char(coalesce(NEW.grand_total, NEW.total_amount, 0), 'FM99,99,99,990')));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_quote_submitted ON public.seller_quotes;
CREATE TRIGGER trg_notify_quote_submitted
  AFTER UPDATE OF status ON public.seller_quotes
  FOR EACH ROW EXECUTE FUNCTION public.notify_quote_submitted();

-- ---------- storage for dealer certificates (private) ----------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('dealer-certificates', 'dealer-certificates', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "sellers upload own dealer certs" ON storage.objects;
CREATE POLICY "sellers upload own dealer certs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dealer-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "owners and admins read dealer certs" ON storage.objects;
CREATE POLICY "owners and admins read dealer certs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dealer-certificates'
         AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_platform_admin()));

-- Sellers may re-submit a rejected/expired authorization.
DROP POLICY IF EXISTS "sellers resubmit their own" ON public.seller_brand_authorizations;
CREATE POLICY "sellers resubmit their own" ON public.seller_brand_authorizations
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() AND status IN ('rejected', 'expired', 'pending'))
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');
