-- =====================================================================
-- B2B PRICING + SERVER-SIDE CHECKOUT
--   product_price_tiers   quantity breaks per product
--   buyer_seller_rates    per-account discount a seller grants a buyer
--   unit_price_for()      single source of truth for a price
--   place_order()         cart -> order, priced & validated in the DB
--   accept_quote_items()  RFQ quote -> order, validated in the DB
--   mark_order_paid()     used only by the Razorpay webhook
-- =====================================================================

-- ---------- delivery promise on products -----------------------------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time_days integer
  CHECK (lead_time_days IS NULL OR lead_time_days BETWEEN 0 AND 180);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS dispatch_city text;

-- ---------- quantity breaks ------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_price_tiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_qty     integer NOT NULL CHECK (min_qty >= 2),
  unit_price  numeric(12,2) NOT NULL CHECK (unit_price > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_qty)
);
CREATE INDEX IF NOT EXISTS idx_price_tiers_product ON public.product_price_tiers(product_id, min_qty);
ALTER TABLE public.product_price_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tiers readable by all" ON public.product_price_tiers;
CREATE POLICY "tiers readable by all" ON public.product_price_tiers
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "tiers managed by product owner" ON public.product_price_tiers;
CREATE POLICY "tiers managed by product owner" ON public.product_price_tiers
  FOR ALL TO authenticated
  USING (public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_id AND p.vendor_id = auth.uid()))
  WITH CHECK (public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_id AND p.vendor_id = auth.uid()));

-- ---------- per-account rates ----------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_seller_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  buyer_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  discount_pct  numeric(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 50),
  note          text,
  valid_until   date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, buyer_id)
);
ALTER TABLE public.buyer_seller_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rates visible to both parties" ON public.buyer_seller_rates;
CREATE POLICY "rates visible to both parties" ON public.buyer_seller_rates
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid() OR public.is_platform_admin());
DROP POLICY IF EXISTS "rates managed by seller" ON public.buyer_seller_rates;
CREATE POLICY "rates managed by seller" ON public.buyer_seller_rates
  FOR ALL TO authenticated
  USING (seller_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_platform_admin());

-- ---------- the one pricing function ---------------------------------
CREATE OR REPLACE FUNCTION public.unit_price_for(p_product_id uuid, p_qty integer, p_buyer_id uuid DEFAULT auth.uid())
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT p.id, p.vendor_id,
           coalesce((SELECT t.unit_price FROM public.product_price_tiers t
                     WHERE t.product_id = p.id AND t.min_qty <= p_qty
                     ORDER BY t.min_qty DESC LIMIT 1), p.price) AS price
    FROM public.products p WHERE p.id = p_product_id
  )
  SELECT round(b.price * (1 - coalesce(r.discount_pct, 0) / 100.0), 2)
  FROM base b
  LEFT JOIN public.buyer_seller_rates r
    ON r.seller_id = b.vendor_id AND r.buyer_id = p_buyer_id
   AND (r.valid_until IS NULL OR r.valid_until >= current_date);
$$;
GRANT EXECUTE ON FUNCTION public.unit_price_for(uuid, integer, uuid) TO anon, authenticated;

-- ---------- place_order ----------------------------------------------
-- p_items:  [{ "product_id": uuid, "quantity": int }, ...]
-- p_buyer:  { email, phone, gstin, company_name }
-- p_payment_method: 'razorpay' | 'bank_transfer'
CREATE OR REPLACE FUNCTION public.place_order(
  p_items             jsonb,
  p_shipping          jsonb,
  p_buyer             jsonb,
  p_payment_method    text DEFAULT 'razorpay',
  p_payment_reference text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_order_id  uuid;
  v_total     numeric(14,2) := 0;
  v_sellers   integer;
  r           record;
  v_so_id     uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '28000';
  END IF;
  IF p_payment_method NOT IN ('razorpay', 'bank_transfer') THEN
    RAISE EXCEPTION 'Unknown payment method';
  END IF;
  IF p_payment_method = 'bank_transfer' AND coalesce(trim(p_payment_reference), '') = '' THEN
    RAISE EXCEPTION 'UTR number is required for bank transfer';
  END IF;
  IF p_payment_proof_url IS NOT NULL AND p_payment_proof_url NOT LIKE v_uid::text || '/%' THEN
    RAISE EXCEPTION 'Invalid payment proof path';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  IF jsonb_array_length(p_items) > 200 THEN
    RAISE EXCEPTION 'Too many lines in one order (max 200)';
  END IF;

  -- Normalise cart lines and price them from the database, locking rows.
  CREATE TEMP TABLE _lines ON COMMIT DROP AS
  SELECT (e->>'product_id')::uuid AS product_id,
         sum((e->>'quantity')::integer)::integer AS quantity
  FROM jsonb_array_elements(p_items) e
  GROUP BY 1;

  IF EXISTS (SELECT 1 FROM _lines WHERE quantity IS NULL OR quantity < 1 OR quantity > 100000) THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF EXISTS (SELECT 1 FROM _lines l
             WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = l.product_id)) THEN
    RAISE EXCEPTION 'A product in your cart no longer exists';
  END IF;

  FOR r IN
    SELECT l.product_id, l.quantity, p.name, p.status, p.stock_quantity,
           p.min_order_quantity, p.vendor_id, p.price
    FROM _lines l
    JOIN public.products p ON p.id = l.product_id
    ORDER BY l.product_id
    FOR UPDATE OF p
  LOOP
    IF r.status IS NOT NULL AND r.status <> 'active' THEN
      RAISE EXCEPTION '% is not available right now', r.name;
    END IF;
    IF r.vendor_id IS NULL THEN
      RAISE EXCEPTION '% has no seller assigned', r.name;
    END IF;
    IF r.price IS NULL OR r.price <= 0 THEN
      RAISE EXCEPTION '% is quote-only. Please raise an RFQ.', r.name;
    END IF;
    IF r.min_order_quantity IS NOT NULL AND r.quantity < r.min_order_quantity THEN
      RAISE EXCEPTION '% has a minimum order of %', r.name, r.min_order_quantity;
    END IF;
    IF r.stock_quantity IS NOT NULL AND r.stock_quantity < r.quantity THEN
      RAISE EXCEPTION 'Only % units of % in stock', r.stock_quantity, r.name;
    END IF;
  END LOOP;

  CREATE TEMP TABLE _priced ON COMMIT DROP AS
  SELECT l.product_id, l.quantity, p.vendor_id,
         public.unit_price_for(l.product_id, l.quantity, v_uid) AS unit_price
  FROM _lines l JOIN public.products p ON p.id = l.product_id;

  SELECT sum(unit_price * quantity), count(DISTINCT vendor_id)
    INTO v_total, v_sellers FROM _priced;

  INSERT INTO public.orders (
    buyer_id, total_amount, shipping_address, status, payment_status,
    payment_method, payment_reference, payment_proof_url,
    buyer_gstin, buyer_company_name, buyer_email, buyer_phone, is_multi_seller)
  VALUES (
    v_uid, v_total, p_shipping, 'pending', 'pending',
    p_payment_method, nullif(trim(p_payment_reference), ''), p_payment_proof_url,
    nullif(p_buyer->>'gstin', ''), nullif(p_buyer->>'company_name', ''),
    p_buyer->>'email', p_buyer->>'phone', v_sellers > 1)
  RETURNING id INTO v_order_id;

  FOR r IN SELECT vendor_id, sum(unit_price * quantity) AS subtotal
           FROM _priced GROUP BY vendor_id LOOP
    INSERT INTO public.seller_orders (order_id, seller_id, status, subtotal,
                                      tax_amount, shipping_amount, total_amount)
    VALUES (v_order_id, r.vendor_id, 'pending', r.subtotal, 0, 0, r.subtotal)
    RETURNING id INTO v_so_id;

    INSERT INTO public.order_items (order_id, seller_order_id, product_id,
                                    quantity, unit_price, total_price)
    SELECT v_order_id, v_so_id, product_id, quantity, unit_price, unit_price * quantity
    FROM _priced WHERE vendor_id = r.vendor_id;
  END LOOP;

  -- Reserve stock (only for products that track it).
  UPDATE public.products p
     SET stock_quantity = p.stock_quantity - pr.quantity
    FROM _priced pr
   WHERE p.id = pr.product_id AND p.stock_quantity IS NOT NULL;

  RETURN jsonb_build_object('order_id', v_order_id, 'total_amount', v_total,
                            'seller_count', v_sellers);
END $$;
REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, jsonb, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, jsonb, text, text, text) TO authenticated;

-- ---------- accept_quote_items (RFQ -> order) ------------------------
-- p_quote_item_ids: uuid[] of seller_quote_items the buyer is accepting
CREATE OR REPLACE FUNCTION public.accept_quote_items(p_rfq_id uuid, p_quote_item_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_order_id uuid;
  v_total    numeric(14,2);
  v_sellers  integer;
  r          record;
  v_so_id    uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rfqs WHERE id = p_rfq_id
                 AND (buyer_id = v_uid OR public.is_platform_admin())) THEN
    RAISE EXCEPTION 'RFQ not found';
  END IF;
  IF coalesce(array_length(p_quote_item_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one quoted item';
  END IF;

  CREATE TEMP TABLE _qi ON COMMIT DROP AS
  SELECT qi.*, q.seller_id
  FROM public.seller_quote_items qi
  JOIN public.seller_quotes q ON q.id = qi.quote_id
  WHERE qi.id = ANY (p_quote_item_ids)
    AND q.rfq_id = p_rfq_id
    AND q.status IN ('submitted', 'revised', 'partially_accepted');

  IF (SELECT count(*) FROM _qi) <> array_length(p_quote_item_ids, 1) THEN
    RAISE EXCEPTION 'Some quoted items are invalid, expired or belong to another RFQ';
  END IF;

  SELECT sum(total_price), count(DISTINCT seller_id) INTO v_total, v_sellers FROM _qi;

  INSERT INTO public.orders (buyer_id, rfq_id, total_amount, status, payment_status, is_multi_seller)
  SELECT buyer_id, p_rfq_id, v_total, 'pending', 'pending', v_sellers > 1
  FROM public.rfqs WHERE id = p_rfq_id
  RETURNING id INTO v_order_id;

  FOR r IN SELECT seller_id, min(quote_id::text)::uuid AS quote_id,
                  sum(total_price) AS total, sum(coalesce(tax_amount, 0)) AS tax
           FROM _qi GROUP BY seller_id LOOP
    INSERT INTO public.seller_orders (order_id, seller_id, rfq_id, quote_id, status,
                                      subtotal, tax_amount, total_amount)
    VALUES (v_order_id, r.seller_id, p_rfq_id, r.quote_id, 'pending',
            r.total - r.tax, r.tax, r.total)
    RETURNING id INTO v_so_id;

    INSERT INTO public.order_items (order_id, seller_order_id, product_id, quantity, unit_price, total_price)
    SELECT v_order_id, v_so_id, product_id, quoted_quantity, unit_price, total_price
    FROM _qi WHERE seller_id = r.seller_id;
  END LOOP;

  UPDATE public.seller_quote_items SET status = 'accepted' WHERE id = ANY (p_quote_item_ids);
  UPDATE public.seller_quotes q SET status = 'accepted'
   WHERE q.id IN (SELECT DISTINCT quote_id FROM _qi);
  UPDATE public.rfqs SET status = 'converted' WHERE id = p_rfq_id;

  RETURN v_order_id;
END $$;
REVOKE ALL ON FUNCTION public.accept_quote_items(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_quote_items(uuid, uuid[]) TO authenticated;

-- ---------- mark_order_paid (webhook only) ---------------------------
CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_razorpay_order_id text, p_razorpay_payment_id text, p_amount_paise bigint)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders
   WHERE razorpay_order_id = p_razorpay_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown Razorpay order %', p_razorpay_order_id; END IF;
  IF v_order.payment_status = 'completed' THEN RETURN v_order.id; END IF;  -- idempotent
  IF round(v_order.total_amount * 100) <> p_amount_paise THEN
    RAISE EXCEPTION 'Amount mismatch on order %: expected % paise, got %',
      v_order.id, round(v_order.total_amount * 100), p_amount_paise;
  END IF;

  UPDATE public.orders SET
    payment_status = 'completed', razorpay_payment_id = p_razorpay_payment_id,
    payment_reference = p_razorpay_payment_id, payment_verified_at = now(),
    escrow_status = 'received', escrow_amount = v_order.total_amount, escrow_received_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.escrow_transactions (order_id, transaction_type, amount, reference_type,
                                          reference_number, description, status)
  VALUES (v_order.id, 'buyer_payment', v_order.total_amount, 'razorpay',
          p_razorpay_payment_id, 'Razorpay payment captured', 'completed');
  RETURN v_order.id;
END $$;
REVOKE ALL ON FUNCTION public.mark_order_paid(text, text, bigint) FROM PUBLIC, anon, authenticated;

-- ---------- price_cart: what the buyer will actually pay -------------
-- Used by the cart/checkout UI so displayed prices match place_order().
CREATE OR REPLACE FUNCTION public.price_cart(p_items jsonb)
RETURNS TABLE (product_id uuid, quantity integer, unit_price numeric, list_price numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH l AS (
    SELECT (e->>'product_id')::uuid AS pid, sum((e->>'quantity')::integer)::integer AS qty
    FROM jsonb_array_elements(p_items) e GROUP BY 1
  )
  SELECT l.pid, l.qty, public.unit_price_for(l.pid, greatest(l.qty, 1), auth.uid()), p.price
  FROM l JOIN public.products p ON p.id = l.pid;
$$;
GRANT EXECUTE ON FUNCTION public.price_cart(jsonb) TO anon, authenticated;

-- Buyers who have ordered from the calling seller (for account rates).
CREATE OR REPLACE FUNCTION public.seller_past_buyers()
RETURNS TABLE (buyer_id uuid, name text, order_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.buyer_id,
         coalesce(max(o.buyer_company_name), max(c.name), max(o.buyer_email)) AS name,
         count(DISTINCT o.id)
  FROM public.seller_orders so
  JOIN public.orders o ON o.id = so.order_id
  LEFT JOIN public.companies c ON c.id = o.buyer_id
  WHERE so.seller_id = auth.uid() AND o.buyer_id IS NOT NULL
  GROUP BY o.buyer_id
  ORDER BY 3 DESC
  LIMIT 500;
$$;
REVOKE ALL ON FUNCTION public.seller_past_buyers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_past_buyers() TO authenticated;
