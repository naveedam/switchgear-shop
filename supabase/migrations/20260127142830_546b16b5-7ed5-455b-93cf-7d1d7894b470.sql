-- Phase 2.1: GST-Compliant Invoice System Schema

-- Add GST fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS trade_name TEXT,
ADD COLUMN IF NOT EXISTS state_code TEXT,
ADD COLUMN IF NOT EXISTS gst_registration_type TEXT DEFAULT 'Unregistered';

-- Add GST fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS seller_gstin TEXT,
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS seller_address JSONB,
ADD COLUMN IF NOT EXISTS buyer_gstin TEXT,
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_address JSONB,
ADD COLUMN IF NOT EXISTS place_of_supply TEXT,
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'B2C',
ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS irn TEXT,
ADD COLUMN IF NOT EXISTS irn_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS e_way_bill_no TEXT,
ADD COLUMN IF NOT EXISTS e_way_bill_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS financial_year TEXT;

-- Create invoice_items table for line-item GST details
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'NOS',
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  taxable_value DECIMAL(12,2) NOT NULL,
  cgst_rate DECIMAL(5,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_rate DECIMAL(5,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_rate DECIMAL(5,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices"
ON public.invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND (i.buyer_id = auth.uid() OR i.seller_id = auth.uid())
  )
);

CREATE POLICY "Sellers can insert invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND i.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update their invoice items"
ON public.invoice_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND i.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can delete their invoice items"
ON public.invoice_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND i.seller_id = auth.uid()
  )
);

-- Create invoice sequence table for seller-specific sequential numbering
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.companies(id),
  financial_year TEXT NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  prefix TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id, financial_year)
);

-- Enable RLS on invoice_sequences
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_sequences
CREATE POLICY "Sellers can view their own sequences"
ON public.invoice_sequences FOR SELECT
USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own sequences"
ON public.invoice_sequences FOR ALL
USING (seller_id = auth.uid());

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_seller_id UUID,
  p_financial_year TEXT,
  p_prefix TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number INTEGER;
  v_prefix TEXT;
  v_invoice_number TEXT;
BEGIN
  -- Insert or update the sequence
  INSERT INTO invoice_sequences (seller_id, financial_year, last_number, prefix)
  VALUES (p_seller_id, p_financial_year, 1, p_prefix)
  ON CONFLICT (seller_id, financial_year)
  DO UPDATE SET 
    last_number = invoice_sequences.last_number + 1,
    updated_at = now()
  RETURNING last_number, COALESCE(prefix, '') INTO v_next_number, v_prefix;

  -- Format: PREFIX/FY/SEQUENCE (e.g., "ETS/25-26/00001")
  IF v_prefix IS NOT NULL AND v_prefix != '' THEN
    v_invoice_number := v_prefix || '/' || p_financial_year || '/' || LPAD(v_next_number::TEXT, 5, '0');
  ELSE
    v_invoice_number := 'INV/' || p_financial_year || '/' || LPAD(v_next_number::TEXT, 5, '0');
  END IF;

  RETURN v_invoice_number;
END;
$$;

-- Function to get current Indian financial year
CREATE OR REPLACE FUNCTION public.get_current_financial_year()
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE;
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_now := now();
  v_year := EXTRACT(YEAR FROM v_now);
  v_month := EXTRACT(MONTH FROM v_now);
  
  -- Indian FY starts April 1
  IF v_month < 4 THEN
    RETURN (v_year - 1) % 100 || '-' || v_year % 100;
  ELSE
    RETURN v_year % 100 || '-' || (v_year + 1) % 100;
  END IF;
END;
$$;

-- Update invoices RLS to include seller access
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Allow sellers to create invoices
CREATE POLICY "Sellers can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (seller_id = auth.uid());

-- Allow sellers to update their invoices
CREATE POLICY "Sellers can update their invoices"
ON public.invoices FOR UPDATE
USING (seller_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_seller_id ON public.invoices(seller_id);
CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON public.invoices(financial_year);
CREATE INDEX IF NOT EXISTS idx_companies_gstin ON public.companies(gstin);