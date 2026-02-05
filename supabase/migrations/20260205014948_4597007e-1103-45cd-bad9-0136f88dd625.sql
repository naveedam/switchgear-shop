-- =============================================
-- BOM UPLOAD & RFQ WORKFLOW SCHEMA
-- =============================================

-- 1. BOM Uploads Table
CREATE TABLE public.bom_uploads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'converted', 'cancelled')),
    total_items INTEGER DEFAULT 0,
    matched_items INTEGER DEFAULT 0,
    project_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. BOM Items Table
CREATE TABLE public.bom_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bom_id UUID NOT NULL REFERENCES public.bom_uploads(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'Nos',
    preferred_brand TEXT,
    rating_specs TEXT,
    target_price NUMERIC(12, 2),
    matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('matched', 'partial', 'unmatched', 'manual')),
    match_confidence NUMERIC(3, 2) DEFAULT 0,
    buyer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. RFQs Table
CREATE TABLE public.rfqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_number TEXT NOT NULL UNIQUE,
    buyer_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bom_id UUID REFERENCES public.bom_uploads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'quoted', 'partially_quoted', 'closed', 'converted', 'cancelled', 'expired')),
    required_delivery_date DATE,
    validity_days INTEGER DEFAULT 7,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    reference_documents TEXT[], -- URLs to uploaded specs/drawings
    total_items INTEGER DEFAULT 0,
    quoted_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. RFQ Items Table
CREATE TABLE public.rfq_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    bom_item_id UUID REFERENCES public.bom_items(id) ON DELETE SET NULL,
    line_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'Nos',
    preferred_brand TEXT,
    rating_specs TEXT,
    target_price NUMERIC(12, 2),
    matched_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category public.product_category,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'quoted', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. RFQ Seller Invitations Table
CREATE TABLE public.rfq_seller_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'responded', 'declined', 'expired')),
    decline_reason TEXT,
    UNIQUE(rfq_id, seller_id)
);

-- 6. Seller Quotes Table
CREATE TABLE public.seller_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'revised', 'accepted', 'partially_accepted', 'rejected', 'expired')),
    total_amount NUMERIC(14, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    grand_total NUMERIC(14, 2) DEFAULT 0,
    validity_days INTEGER DEFAULT 15,
    delivery_terms TEXT,
    payment_terms TEXT,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(rfq_id, seller_id)
);

-- 7. Seller Quote Items Table
CREATE TABLE public.seller_quote_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES public.seller_quotes(id) ON DELETE CASCADE,
    rfq_item_id UUID NOT NULL REFERENCES public.rfq_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quoted_quantity NUMERIC(10, 2) NOT NULL,
    available_quantity NUMERIC(10, 2),
    unit_price NUMERIC(12, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 18,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    total_price NUMERIC(14, 2) NOT NULL,
    lead_time_days INTEGER,
    brand TEXT,
    model_number TEXT,
    notes TEXT,
    is_available BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. RFQ Audit Log Table
CREATE TABLE public.rfq_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
    bom_id UUID REFERENCES public.bom_uploads(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.seller_quotes(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor_id UUID,
    actor_type TEXT CHECK (actor_type IN ('buyer', 'seller', 'admin', 'system')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_bom_uploads_buyer ON public.bom_uploads(buyer_id);
CREATE INDEX idx_bom_items_bom ON public.bom_items(bom_id);
CREATE INDEX idx_bom_items_matched_product ON public.bom_items(matched_product_id);
CREATE INDEX idx_rfqs_buyer ON public.rfqs(buyer_id);
CREATE INDEX idx_rfqs_status ON public.rfqs(status);
CREATE INDEX idx_rfq_items_rfq ON public.rfq_items(rfq_id);
CREATE INDEX idx_rfq_seller_invitations_seller ON public.rfq_seller_invitations(seller_id);
CREATE INDEX idx_seller_quotes_rfq ON public.seller_quotes(rfq_id);
CREATE INDEX idx_seller_quotes_seller ON public.seller_quotes(seller_id);
CREATE INDEX idx_seller_quote_items_quote ON public.seller_quote_items(quote_id);
CREATE INDEX idx_rfq_audit_log_rfq ON public.rfq_audit_log(rfq_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.bom_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_seller_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_audit_log ENABLE ROW LEVEL SECURITY;

-- BOM Uploads: Buyers can manage their own BOMs
CREATE POLICY "Buyers can view their own BOMs" ON public.bom_uploads
    FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create BOMs" ON public.bom_uploads
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update their own BOMs" ON public.bom_uploads
    FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete their own BOMs" ON public.bom_uploads
    FOR DELETE USING (auth.uid() = buyer_id);

-- BOM Items: Buyers can manage items in their BOMs
CREATE POLICY "Buyers can view their BOM items" ON public.bom_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = bom_id AND buyer_id = auth.uid()));
CREATE POLICY "Buyers can create BOM items" ON public.bom_items
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = bom_id AND buyer_id = auth.uid()));
CREATE POLICY "Buyers can update their BOM items" ON public.bom_items
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = bom_id AND buyer_id = auth.uid()));
CREATE POLICY "Buyers can delete their BOM items" ON public.bom_items
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = bom_id AND buyer_id = auth.uid()));

-- RFQs: Buyers can manage their RFQs, sellers can view invited RFQs
CREATE POLICY "Buyers can view their own RFQs" ON public.rfqs
    FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view invited RFQs" ON public.rfqs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.rfq_seller_invitations WHERE rfq_id = id AND seller_id = auth.uid())
    );
CREATE POLICY "Buyers can create RFQs" ON public.rfqs
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update their own RFQs" ON public.rfqs
    FOR UPDATE USING (auth.uid() = buyer_id);

-- RFQ Items: Buyers and invited sellers can view
CREATE POLICY "Buyers can view their RFQ items" ON public.rfq_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));
CREATE POLICY "Sellers can view invited RFQ items" ON public.rfq_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rfq_seller_invitations rsi 
            JOIN public.rfqs r ON r.id = rsi.rfq_id 
            WHERE r.id = rfq_id AND rsi.seller_id = auth.uid()
        )
    );
CREATE POLICY "Buyers can create RFQ items" ON public.rfq_items
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));
CREATE POLICY "Buyers can update their RFQ items" ON public.rfq_items
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));

-- RFQ Seller Invitations
CREATE POLICY "Buyers can view invitations for their RFQs" ON public.rfq_seller_invitations
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));
CREATE POLICY "Sellers can view their invitations" ON public.rfq_seller_invitations
    FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can create invitations" ON public.rfq_seller_invitations
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));
CREATE POLICY "Sellers can update their invitations" ON public.rfq_seller_invitations
    FOR UPDATE USING (auth.uid() = seller_id);

-- Seller Quotes: Sellers manage their quotes, buyers view quotes for their RFQs
CREATE POLICY "Sellers can view their own quotes" ON public.seller_quotes
    FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can view quotes for their RFQs" ON public.seller_quotes
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));
CREATE POLICY "Sellers can create quotes" ON public.seller_quotes
    FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their quotes" ON public.seller_quotes
    FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can update quote status" ON public.seller_quotes
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()));

-- Seller Quote Items
CREATE POLICY "Sellers can view their quote items" ON public.seller_quote_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.seller_quotes WHERE id = quote_id AND seller_id = auth.uid()));
CREATE POLICY "Buyers can view quote items for their RFQs" ON public.seller_quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.seller_quotes sq 
            JOIN public.rfqs r ON r.id = sq.rfq_id 
            WHERE sq.id = quote_id AND r.buyer_id = auth.uid()
        )
    );
CREATE POLICY "Sellers can create quote items" ON public.seller_quote_items
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.seller_quotes WHERE id = quote_id AND seller_id = auth.uid()));
CREATE POLICY "Sellers can update their quote items" ON public.seller_quote_items
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.seller_quotes WHERE id = quote_id AND seller_id = auth.uid()));
CREATE POLICY "Buyers can update quote item status" ON public.seller_quote_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.seller_quotes sq 
            JOIN public.rfqs r ON r.id = sq.rfq_id 
            WHERE sq.id = quote_id AND r.buyer_id = auth.uid()
        )
    );

-- RFQ Audit Log: Read-only for relevant parties
CREATE POLICY "Buyers can view audit logs for their RFQs" ON public.rfq_audit_log
    FOR SELECT USING (
        (rfq_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_id AND buyer_id = auth.uid()))
        OR (bom_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.bom_uploads WHERE id = bom_id AND buyer_id = auth.uid()))
    );
CREATE POLICY "Sellers can view audit logs for their quotes" ON public.rfq_audit_log
    FOR SELECT USING (
        quote_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.seller_quotes WHERE id = quote_id AND seller_id = auth.uid())
    );
CREATE POLICY "System can insert audit logs" ON public.rfq_audit_log
    FOR INSERT WITH CHECK (true);

-- Admin policies
CREATE POLICY "Admins can view all BOMs" ON public.bom_uploads
    FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Admins can view all RFQs" ON public.rfqs
    FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Admins can view all quotes" ON public.seller_quotes
    FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Admins can view all audit logs" ON public.rfq_audit_log
    FOR SELECT USING (public.is_super_admin());

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_bom_uploads_updated_at
    BEFORE UPDATE ON public.bom_uploads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at
    BEFORE UPDATE ON public.rfqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_quotes_updated_at
    BEFORE UPDATE ON public.seller_quotes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate RFQ Number
CREATE OR REPLACE FUNCTION public.generate_rfq_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_number TEXT;
BEGIN
    v_year := to_char(now(), 'YY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.rfqs WHERE created_at >= date_trunc('year', now());
    v_number := 'RFQ-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- Generate Quote Number
CREATE OR REPLACE FUNCTION public.generate_quote_number(p_seller_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_prefix TEXT;
    v_number TEXT;
BEGIN
    v_year := to_char(now(), 'YY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.seller_quotes 
    WHERE seller_id = p_seller_id AND created_at >= date_trunc('year', now());
    
    -- Get seller prefix (first 3 chars of company name)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3)) INTO v_prefix 
    FROM public.companies WHERE id = p_seller_id;
    
    v_prefix := COALESCE(v_prefix, 'QTE');
    v_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- Add rfq_id reference to seller_orders for traceability
ALTER TABLE public.seller_orders ADD COLUMN IF NOT EXISTS rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL;
ALTER TABLE public.seller_orders ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.seller_quotes(id) ON DELETE SET NULL;

-- Add rfq_id reference to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL;

-- Create storage bucket for BOM files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bom-files', 'bom-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for RFQ reference documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfq-documents', 'rfq-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for BOM files
CREATE POLICY "Buyers can upload BOM files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'bom-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Buyers can view their BOM files" ON storage.objects
    FOR SELECT USING (bucket_id = 'bom-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Buyers can delete their BOM files" ON storage.objects
    FOR DELETE USING (bucket_id = 'bom-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for RFQ documents
CREATE POLICY "Buyers can upload RFQ docs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'rfq-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Buyers can view their RFQ docs" ON storage.objects
    FOR SELECT USING (bucket_id = 'rfq-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Sellers can view invited RFQ docs" ON storage.objects
    FOR SELECT USING (bucket_id = 'rfq-documents');