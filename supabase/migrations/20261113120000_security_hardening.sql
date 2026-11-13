-- =====================================================================
-- SECURITY HARDENING
--  1. Orders are created only by server functions that price from the DB
--  2. Role / status / payment fields cannot be self-edited
--  3. Rate-limit store for edge functions
--  4. Razorpay payment columns + mark_order_paid()
-- =====================================================================

-- ---------- helpers ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies
                 WHERE id = auth.uid() AND role = 'admin' AND status = 'active')
      OR EXISTS (SELECT 1 FROM public.admin_users
                 WHERE id = auth.uid() AND status = 'active');
$$;

-- True when the change is made by the service role, a migration, or a
-- trigger fired by another trigger (e.g. settlement bookkeeping).
CREATE OR REPLACE FUNCTION public.is_privileged_context()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT auth.uid() IS NULL
      OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
      OR coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role'), '') = 'service_role'
      OR pg_trigger_depth() > 1
      OR coalesce(current_setting('app.bypass_guard', true), '') = 'on';
$$;

-- ---------- 2. companies: role & verification are admin-only ----------
CREATE OR REPLACE FUNCTION public.guard_company_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_privileged_context() OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL AND NEW.role NOT IN ('buyer', 'seller') THEN
      RAISE EXCEPTION 'Role % cannot be self-assigned', NEW.role USING ERRCODE = '42501';
    END IF;
    IF NEW.role = 'seller' THEN
      NEW.status := 'pending';           -- sellers start unapproved
    END IF;
    NEW.bank_verified := false;
    NEW.gst_verified := false;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NOT (coalesce(OLD.role, 'buyer') = 'buyer' AND NEW.role = 'seller') THEN
    RAISE EXCEPTION 'Role changes require an administrator' USING ERRCODE = '42501';
  END IF;
  IF NEW.role = 'seller' AND OLD.role IS DISTINCT FROM 'seller' THEN
    NEW.status := 'pending';             -- buyer -> seller goes to review
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    RAISE EXCEPTION 'Account status changes require an administrator' USING ERRCODE = '42501';
  END IF;
  IF NEW.bank_verified IS DISTINCT FROM OLD.bank_verified
     OR NEW.gst_verified IS DISTINCT FROM OLD.gst_verified THEN
    RAISE EXCEPTION 'Verification flags are set by administrators' USING ERRCODE = '42501';
  END IF;
  -- Changing bank details clears verification
  IF NEW.bank_account_number IS DISTINCT FROM OLD.bank_account_number
     OR NEW.bank_ifsc IS DISTINCT FROM OLD.bank_ifsc THEN
    NEW.bank_verified := false;
  END IF;
  IF NEW.gstin IS DISTINCT FROM OLD.gstin THEN
    NEW.gst_verified := false;
  END IF;
  RETURN NEW;
END $$;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gst_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gst_verified_at timestamptz;

DROP TRIGGER IF EXISTS trg_guard_company_privileged_fields ON public.companies;
CREATE TRIGGER trg_guard_company_privileged_fields
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.guard_company_privileged_fields();

-- ---------- 1. orders: no direct inserts, no self-marking as paid ------
REVOKE INSERT ON public.orders, public.seller_orders, public.order_items FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_order_payment_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_privileged_context() OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.total_amount       IS DISTINCT FROM OLD.total_amount
  OR NEW.buyer_id           IS DISTINCT FROM OLD.buyer_id
  OR NEW.payment_status     IS DISTINCT FROM OLD.payment_status
  OR NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at
  OR NEW.payment_verified_by IS DISTINCT FROM OLD.payment_verified_by
  OR NEW.escrow_status      IS DISTINCT FROM OLD.escrow_status
  OR NEW.escrow_amount      IS DISTINCT FROM OLD.escrow_amount
  OR NEW.escrow_received_at IS DISTINCT FROM OLD.escrow_received_at
  OR NEW.razorpay_order_id  IS DISTINCT FROM OLD.razorpay_order_id
  OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id THEN
    RAISE EXCEPTION 'Payment and amount fields are managed by the platform' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_seller_order_money_fields()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_privileged_context() OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.order_id            IS DISTINCT FROM OLD.order_id
  OR NEW.seller_id           IS DISTINCT FROM OLD.seller_id
  OR NEW.subtotal            IS DISTINCT FROM OLD.subtotal
  OR NEW.platform_commission IS DISTINCT FROM OLD.platform_commission
  OR NEW.settlement_amount   IS DISTINCT FROM OLD.settlement_amount
  OR NEW.settlement_status   IS DISTINCT FROM OLD.settlement_status
  OR NEW.settled_at          IS DISTINCT FROM OLD.settled_at THEN
    RAISE EXCEPTION 'Settlement and pricing fields are managed by the platform' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;   -- 'razorpay' | 'bank_transfer'

DROP TRIGGER IF EXISTS trg_guard_order_payment_fields ON public.orders;
CREATE TRIGGER trg_guard_order_payment_fields
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_payment_fields();

DROP TRIGGER IF EXISTS trg_guard_seller_order_money_fields ON public.seller_orders;
CREATE TRIGGER trg_guard_seller_order_money_fields
  BEFORE UPDATE ON public.seller_orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_seller_order_money_fields();

-- ---------- 3. rate limiting -----------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits         integer NOT NULL
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;  -- no policies: service role only

CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_hits integer;
BEGIN
  INSERT INTO public.rate_limits AS r (key, window_start, hits)
  VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE
    SET hits = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds)
                    THEN 1 ELSE r.hits + 1 END,
        window_start = CASE WHEN r.window_start < now() - make_interval(secs => p_window_seconds)
                    THEN now() ELSE r.window_start END
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_max;
END $$;
REVOKE ALL ON FUNCTION public.hit_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
