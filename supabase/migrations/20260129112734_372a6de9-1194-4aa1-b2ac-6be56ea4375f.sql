-- Multi-seller Marketplace Order Architecture Migration
-- Creates seller_orders (sub-orders) linked to parent orders

-- Create seller_orders table for multi-seller support
CREATE TABLE public.seller_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.companies(id),
    
    -- Seller-specific order status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled')),
    
    -- Amounts for this seller's portion
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Seller invoice (GST compliance - seller uploads their own invoice)
    seller_invoice_number TEXT,
    seller_invoice_url TEXT,
    seller_invoice_uploaded_at TIMESTAMPTZ,
    
    -- E-way bill for transport
    eway_bill_number TEXT,
    eway_bill_url TEXT,
    eway_bill_date TIMESTAMPTZ,
    
    -- Shipping/fulfillment details
    tracking_number TEXT,
    tracking_url TEXT,
    carrier_name TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Seller notes
    seller_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_seller_per_order UNIQUE (order_id, seller_id)
);

-- Add seller_order_id to order_items to link items to seller sub-orders
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seller_order_id UUID REFERENCES public.seller_orders(id);

-- Add buyer GSTIN field to orders for B2B invoicing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_gstin TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_company_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_multi_seller BOOLEAN DEFAULT FALSE;

-- Create seller_order_audit_log for compliance
CREATE TABLE public.seller_order_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_order_id UUID NOT NULL REFERENCES public.seller_orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    performed_by UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create storage bucket for seller invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'seller-invoices', 
    'seller-invoices', 
    false,
    10485760,  -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on seller_orders
ALTER TABLE public.seller_orders ENABLE ROW LEVEL SECURITY;

-- Sellers can view and manage their own seller orders
CREATE POLICY "Sellers can view their own seller orders"
ON public.seller_orders
FOR SELECT
USING (seller_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));

CREATE POLICY "Sellers can update their own seller orders"
ON public.seller_orders
FOR UPDATE
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

-- Admin can manage all seller orders (assuming admin role via is_super_admin)
CREATE POLICY "Admins can manage all seller orders"
ON public.seller_orders
FOR ALL
USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_super_admin = true));

-- Enable RLS on audit log
ALTER TABLE public.seller_order_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their orders"
ON public.seller_order_audit_log
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM seller_orders so 
    WHERE so.id = seller_order_id 
    AND (so.seller_id = auth.uid() OR EXISTS (
        SELECT 1 FROM orders o WHERE o.id = so.order_id AND o.buyer_id = auth.uid()
    ))
));

-- Storage policies for seller invoices
CREATE POLICY "Sellers can upload their own invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seller-invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Sellers can view their own invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Buyers can view invoices for their orders"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-invoices' AND EXISTS (
    SELECT 1 FROM seller_orders so
    JOIN orders o ON o.id = so.order_id
    WHERE o.buyer_id = auth.uid()
    AND (storage.foldername(name))[1] = so.seller_id::text
));

-- Create function to update seller_orders updated_at
CREATE OR REPLACE FUNCTION public.update_seller_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_orders_timestamp
BEFORE UPDATE ON public.seller_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_order_timestamp();

-- Create function to log seller order status changes
CREATE OR REPLACE FUNCTION public.log_seller_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.seller_order_audit_log (
            seller_order_id, 
            action, 
            previous_status, 
            new_status, 
            performed_by,
            details
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status,
            NEW.status,
            auth.uid(),
            jsonb_build_object(
                'tracking_number', NEW.tracking_number,
                'seller_invoice_number', NEW.seller_invoice_number
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_seller_order_status
AFTER UPDATE ON public.seller_orders
FOR EACH ROW
EXECUTE FUNCTION public.log_seller_order_status_change();

-- Create indexes for performance
CREATE INDEX idx_seller_orders_order_id ON public.seller_orders(order_id);
CREATE INDEX idx_seller_orders_seller_id ON public.seller_orders(seller_id);
CREATE INDEX idx_seller_orders_status ON public.seller_orders(status);
CREATE INDEX idx_order_items_seller_order_id ON public.order_items(seller_order_id);
CREATE INDEX idx_seller_order_audit_seller_order_id ON public.seller_order_audit_log(seller_order_id);