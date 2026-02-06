-- =========================================
-- B2B MARKETPLACE ESCROW / NODAL ACCOUNT SYSTEM
-- =========================================

-- Platform configuration for commission rates and escrow settings
CREATE TABLE public.platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO platform_config (key, value, description) VALUES
  ('default_commission_percent', '2.5', 'Default platform commission percentage'),
  ('tcs_rate_percent', '1.0', 'TCS rate for marketplace sellers (1% as per GST law)'),
  ('settlement_hold_days', '7', 'Number of days to hold funds after delivery before auto-settlement'),
  ('min_settlement_amount', '1000', 'Minimum amount required for settlement payout');

-- Escrow account balance tracking (aggregate view)
CREATE TABLE public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_type TEXT NOT NULL DEFAULT 'main' CHECK (account_type IN ('main', 'reserve')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pending_settlements DECIMAL(15, 2) NOT NULL DEFAULT 0,
  last_reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create main escrow account
INSERT INTO escrow_accounts (account_type, balance, pending_settlements) 
VALUES ('main', 0, 0);

-- Escrow transactions - tracks all money movements
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  seller_order_id UUID REFERENCES public.seller_orders(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'buyer_payment',      -- Money received from buyer
    'seller_settlement',  -- Money released to seller
    'platform_commission', -- Commission deducted
    'tcs_deduction',      -- TCS deducted from seller
    'refund_buyer',       -- Refund to buyer
    'adjustment',         -- Manual adjustment
    'reversal'            -- Reversal of previous transaction
  )),
  amount DECIMAL(15, 2) NOT NULL,
  reference_type TEXT,  -- 'utr', 'settlement_id', 'refund_id'
  reference_number TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller settlement eligibility and payouts
CREATE TYPE public.settlement_status AS ENUM (
  'pending',           -- Waiting for eligibility conditions
  'eligible',          -- Meets all criteria, ready for settlement
  'processing',        -- Settlement in progress
  'completed',         -- Settlement paid out
  'on_hold',           -- Manually held by admin
  'cancelled'          -- Settlement cancelled (e.g., refund)
);

CREATE TABLE public.seller_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_order_id UUID NOT NULL REFERENCES public.seller_orders(id),
  seller_id UUID NOT NULL REFERENCES public.companies(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  
  -- Amounts
  gross_amount DECIMAL(15, 2) NOT NULL,           -- Total seller order value
  platform_commission DECIMAL(15, 2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 2.5,
  tcs_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,   -- TCS deducted
  tcs_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  other_deductions DECIMAL(15, 2) NOT NULL DEFAULT 0,
  net_payable DECIMAL(15, 2) NOT NULL,            -- Final amount to seller
  
  -- Status and eligibility
  status settlement_status NOT NULL DEFAULT 'pending',
  eligibility_met_at TIMESTAMPTZ,
  
  -- Eligibility flags
  order_accepted BOOLEAN DEFAULT false,
  invoice_uploaded BOOLEAN DEFAULT false,
  shipment_confirmed BOOLEAN DEFAULT false,
  delivery_confirmed BOOLEAN DEFAULT false,
  hold_period_elapsed BOOLEAN DEFAULT false,
  
  -- Settlement details
  settlement_batch_id TEXT,
  settlement_reference TEXT,
  settled_at TIMESTAMPTZ,
  settled_by UUID,
  
  -- Bank details used for settlement
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  
  -- Notes and metadata
  admin_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform commission invoices to sellers
CREATE TABLE public.platform_commission_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES public.companies(id),
  settlement_id UUID REFERENCES public.seller_settlements(id),
  
  -- Invoice period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  total_order_value DECIMAL(15, 2) NOT NULL,
  commission_amount DECIMAL(15, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  cgst_amount DECIMAL(15, 2) DEFAULT 0,
  sgst_amount DECIMAL(15, 2) DEFAULT 0,
  igst_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  
  -- Invoice details
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid')),
  issued_at TIMESTAMPTZ,
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settlement audit log for compliance
CREATE TABLE public.settlement_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID REFERENCES public.seller_settlements(id),
  seller_order_id UUID REFERENCES public.seller_orders(id),
  order_id UUID REFERENCES public.orders(id),
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  amount DECIMAL(15, 2),
  performed_by UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add escrow-related columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'received', 'partially_settled', 'fully_settled', 'refunded')),
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS escrow_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID;

-- Add settlement-related columns to seller_orders
ALTER TABLE public.seller_orders 
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'eligible', 'processing', 'settled', 'on_hold')),
ADD COLUMN IF NOT EXISTS settlement_eligible_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(15, 2) DEFAULT 0;

-- Add bank details to companies for settlement payouts
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT false;

-- Function to calculate settlement amounts
CREATE OR REPLACE FUNCTION public.calculate_settlement_amounts(
  p_seller_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gross DECIMAL(15, 2);
  v_commission_rate DECIMAL(5, 2);
  v_tcs_rate DECIMAL(5, 2);
  v_commission DECIMAL(15, 2);
  v_tcs DECIMAL(15, 2);
  v_net DECIMAL(15, 2);
BEGIN
  -- Get seller order amount
  SELECT total_amount INTO v_gross
  FROM seller_orders
  WHERE id = p_seller_order_id;
  
  IF v_gross IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get commission and TCS rates from config
  SELECT (value::DECIMAL) INTO v_commission_rate
  FROM platform_config WHERE key = 'default_commission_percent';
  
  SELECT (value::DECIMAL) INTO v_tcs_rate
  FROM platform_config WHERE key = 'tcs_rate_percent';
  
  v_commission_rate := COALESCE(v_commission_rate, 2.5);
  v_tcs_rate := COALESCE(v_tcs_rate, 1.0);
  
  -- Calculate amounts
  v_commission := ROUND(v_gross * v_commission_rate / 100, 2);
  v_tcs := ROUND(v_gross * v_tcs_rate / 100, 2);
  v_net := v_gross - v_commission - v_tcs;
  
  RETURN jsonb_build_object(
    'gross_amount', v_gross,
    'commission_rate', v_commission_rate,
    'platform_commission', v_commission,
    'tcs_rate', v_tcs_rate,
    'tcs_amount', v_tcs,
    'net_payable', v_net
  );
END;
$$;

-- Function to check settlement eligibility
CREATE OR REPLACE FUNCTION public.check_settlement_eligibility(
  p_seller_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seller_order RECORD;
  v_hold_days INT;
  v_eligible BOOLEAN := true;
  v_reasons TEXT[] := '{}';
BEGIN
  -- Get seller order details
  SELECT 
    so.*,
    o.payment_status,
    o.escrow_status
  INTO v_seller_order
  FROM seller_orders so
  JOIN orders o ON o.id = so.order_id
  WHERE so.id = p_seller_order_id;
  
  IF v_seller_order IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reasons', ARRAY['Seller order not found']);
  END IF;
  
  -- Get hold period from config
  SELECT (value::INT) INTO v_hold_days
  FROM platform_config WHERE key = 'settlement_hold_days';
  v_hold_days := COALESCE(v_hold_days, 7);
  
  -- Check conditions
  -- 1. Payment must be received
  IF v_seller_order.escrow_status NOT IN ('received', 'partially_settled') THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Payment not received in escrow');
  END IF;
  
  -- 2. Order must be accepted
  IF v_seller_order.status NOT IN ('accepted', 'processing', 'shipped', 'delivered') THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Order not accepted by seller');
  END IF;
  
  -- 3. Invoice must be uploaded
  IF v_seller_order.seller_invoice_number IS NULL THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'GST invoice not uploaded');
  END IF;
  
  -- 4. Must be shipped or delivered
  IF v_seller_order.status NOT IN ('shipped', 'delivered') THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Order not shipped');
  END IF;
  
  -- 5. If delivered, check hold period
  IF v_seller_order.status = 'delivered' AND v_seller_order.delivered_at IS NOT NULL THEN
    IF v_seller_order.delivered_at + (v_hold_days || ' days')::INTERVAL > now() THEN
      v_eligible := false;
      v_reasons := array_append(v_reasons, 'Hold period not elapsed (' || v_hold_days || ' days after delivery)');
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'eligible', v_eligible,
    'reasons', v_reasons,
    'order_accepted', v_seller_order.status IN ('accepted', 'processing', 'shipped', 'delivered'),
    'invoice_uploaded', v_seller_order.seller_invoice_number IS NOT NULL,
    'shipped', v_seller_order.status IN ('shipped', 'delivered'),
    'delivered', v_seller_order.status = 'delivered',
    'hold_period_days', v_hold_days
  );
END;
$$;

-- Function to create or update settlement record
CREATE OR REPLACE FUNCTION public.create_or_update_settlement(
  p_seller_order_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settlement_id UUID;
  v_seller_order RECORD;
  v_amounts JSONB;
  v_eligibility JSONB;
  v_new_status settlement_status;
BEGIN
  -- Get seller order
  SELECT so.*, o.buyer_id
  INTO v_seller_order
  FROM seller_orders so
  JOIN orders o ON o.id = so.order_id
  WHERE so.id = p_seller_order_id;
  
  IF v_seller_order IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate amounts
  v_amounts := calculate_settlement_amounts(p_seller_order_id);
  
  -- Check eligibility
  v_eligibility := check_settlement_eligibility(p_seller_order_id);
  
  -- Determine status
  IF (v_eligibility->>'eligible')::BOOLEAN THEN
    v_new_status := 'eligible';
  ELSE
    v_new_status := 'pending';
  END IF;
  
  -- Upsert settlement record
  INSERT INTO seller_settlements (
    seller_order_id,
    seller_id,
    order_id,
    gross_amount,
    platform_commission,
    commission_rate,
    tcs_amount,
    tcs_rate,
    net_payable,
    status,
    order_accepted,
    invoice_uploaded,
    shipment_confirmed,
    delivery_confirmed,
    eligibility_met_at
  ) VALUES (
    p_seller_order_id,
    v_seller_order.seller_id,
    v_seller_order.order_id,
    (v_amounts->>'gross_amount')::DECIMAL,
    (v_amounts->>'platform_commission')::DECIMAL,
    (v_amounts->>'commission_rate')::DECIMAL,
    (v_amounts->>'tcs_amount')::DECIMAL,
    (v_amounts->>'tcs_rate')::DECIMAL,
    (v_amounts->>'net_payable')::DECIMAL,
    v_new_status,
    (v_eligibility->>'order_accepted')::BOOLEAN,
    (v_eligibility->>'invoice_uploaded')::BOOLEAN,
    (v_eligibility->>'shipped')::BOOLEAN,
    (v_eligibility->>'delivered')::BOOLEAN,
    CASE WHEN (v_eligibility->>'eligible')::BOOLEAN THEN now() ELSE NULL END
  )
  ON CONFLICT (seller_order_id) DO UPDATE SET
    gross_amount = EXCLUDED.gross_amount,
    platform_commission = EXCLUDED.platform_commission,
    tcs_amount = EXCLUDED.tcs_amount,
    net_payable = EXCLUDED.net_payable,
    status = CASE 
      WHEN seller_settlements.status IN ('completed', 'processing') THEN seller_settlements.status 
      ELSE EXCLUDED.status 
    END,
    order_accepted = EXCLUDED.order_accepted,
    invoice_uploaded = EXCLUDED.invoice_uploaded,
    shipment_confirmed = EXCLUDED.shipment_confirmed,
    delivery_confirmed = EXCLUDED.delivery_confirmed,
    eligibility_met_at = CASE 
      WHEN EXCLUDED.status = 'eligible' AND seller_settlements.eligibility_met_at IS NULL 
      THEN now() 
      ELSE seller_settlements.eligibility_met_at 
    END,
    updated_at = now()
  RETURNING id INTO v_settlement_id;
  
  RETURN v_settlement_id;
END;
$$;

-- Trigger to auto-update settlement when seller order changes
CREATE OR REPLACE FUNCTION public.trigger_update_settlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if relevant fields changed
  IF TG_OP = 'UPDATE' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.seller_invoice_number IS DISTINCT FROM NEW.seller_invoice_number OR
    OLD.shipped_at IS DISTINCT FROM NEW.shipped_at OR
    OLD.delivered_at IS DISTINCT FROM NEW.delivered_at
  ) THEN
    PERFORM create_or_update_settlement(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_order_settlement_trigger
  AFTER UPDATE ON public.seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_settlement();

-- Trigger to create settlement when seller order is created
CREATE OR REPLACE FUNCTION public.trigger_create_settlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM create_or_update_settlement(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER seller_order_settlement_create_trigger
  AFTER INSERT ON public.seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_settlement();

-- Add unique constraint for settlements per seller order
ALTER TABLE public.seller_settlements
ADD CONSTRAINT unique_seller_order_settlement UNIQUE (seller_order_id);

-- Enable RLS on new tables
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_commission_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Platform config: admin only
CREATE POLICY "Admins can manage platform config"
ON public.platform_config
FOR ALL
USING (public.is_super_admin());

-- Escrow accounts: admin only
CREATE POLICY "Admins can view escrow accounts"
ON public.escrow_accounts
FOR SELECT
USING (public.is_super_admin());

-- Escrow transactions: admin and related parties
CREATE POLICY "Admins can view all escrow transactions"
ON public.escrow_transactions
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Buyers can view their payment transactions"
ON public.escrow_transactions
FOR SELECT
USING (
  order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  AND transaction_type = 'buyer_payment'
);

CREATE POLICY "Sellers can view their settlement transactions"
ON public.escrow_transactions
FOR SELECT
USING (
  seller_order_id IN (SELECT id FROM seller_orders WHERE seller_id = auth.uid())
);

-- Seller settlements
CREATE POLICY "Admins can manage all settlements"
ON public.seller_settlements
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Sellers can view their own settlements"
ON public.seller_settlements
FOR SELECT
USING (seller_id = auth.uid());

-- Commission invoices
CREATE POLICY "Admins can manage commission invoices"
ON public.platform_commission_invoices
FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Sellers can view their commission invoices"
ON public.platform_commission_invoices
FOR SELECT
USING (seller_id = auth.uid());

-- Settlement audit log
CREATE POLICY "Admins can view settlement audit log"
ON public.settlement_audit_log
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Sellers can view their audit logs"
ON public.settlement_audit_log
FOR SELECT
USING (
  seller_order_id IN (SELECT id FROM seller_orders WHERE seller_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_escrow_transactions_order ON public.escrow_transactions(order_id);
CREATE INDEX idx_escrow_transactions_seller_order ON public.escrow_transactions(seller_order_id);
CREATE INDEX idx_escrow_transactions_type ON public.escrow_transactions(transaction_type);
CREATE INDEX idx_seller_settlements_seller ON public.seller_settlements(seller_id);
CREATE INDEX idx_seller_settlements_status ON public.seller_settlements(status);
CREATE INDEX idx_seller_settlements_order ON public.seller_settlements(order_id);
CREATE INDEX idx_settlement_audit_order ON public.settlement_audit_log(order_id);
CREATE INDEX idx_settlement_audit_seller_order ON public.settlement_audit_log(seller_order_id);