-- =============================================
-- SELLER INVENTORY ONBOARDING SYSTEM
-- =============================================

-- 1. Create seller_products table (seller inventory listings against master catalog)
CREATE TABLE IF NOT EXISTS public.seller_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  catalog_product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  moq INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 0,
  lead_time_days INTEGER,
  dispatch_location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'pending_approval')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate listings
  UNIQUE(seller_id, catalog_product_id)
);

-- 2. Create product_requests table (for new product submissions)
CREATE TABLE IF NOT EXISTS public.product_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  model_number TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  description TEXT,
  technical_specs JSONB,
  datasheet_url TEXT,
  additional_documents TEXT[],
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'duplicate')),
  -- Admin review
  reviewed_by UUID REFERENCES public.admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  -- If approved, link to created catalog product
  approved_catalog_product_id UUID REFERENCES public.catalog_products(id),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create seller_bulk_uploads table (for bulk inventory imports)
CREATE TABLE IF NOT EXISTS public.seller_bulk_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT,
  total_rows INTEGER NOT NULL DEFAULT 0,
  matched_rows INTEGER NOT NULL DEFAULT 0,
  unmatched_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
  error_details JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create seller_bulk_upload_items table (individual items from bulk uploads)
CREATE TABLE IF NOT EXISTS public.seller_bulk_upload_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES public.seller_bulk_uploads(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  -- Matching info
  matched_catalog_product_id UUID REFERENCES public.catalog_products(id),
  match_confidence DECIMAL(3,2), -- 0.00 to 1.00
  match_status TEXT NOT NULL DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'partial_match', 'unmatched', 'error')),
  -- Seller provided data
  input_brand TEXT,
  input_model TEXT,
  input_description TEXT,
  price DECIMAL(12,2),
  moq INTEGER,
  stock INTEGER,
  lead_time_days INTEGER,
  -- Processing status
  error_message TEXT,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create seller_inventory_audit_log table
CREATE TABLE IF NOT EXISTS public.seller_inventory_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'seller_product', 'product_request', 'bulk_upload'
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id ON public.seller_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_catalog_product_id ON public.seller_products(catalog_product_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_status ON public.seller_products(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_seller_id ON public.product_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON public.product_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_bulk_uploads_seller_id ON public.seller_bulk_uploads(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bulk_upload_items_upload_id ON public.seller_bulk_upload_items(upload_id);
CREATE INDEX IF NOT EXISTS idx_seller_inventory_audit_seller_id ON public.seller_inventory_audit_log(seller_id);

-- 7. Enable RLS
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_bulk_upload_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_inventory_audit_log ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for seller_products
CREATE POLICY "Sellers can view their own products" ON public.seller_products
  FOR SELECT USING (seller_id = auth.uid());
  
CREATE POLICY "Sellers can insert their own products" ON public.seller_products
  FOR INSERT WITH CHECK (seller_id = auth.uid());
  
CREATE POLICY "Sellers can update their own products" ON public.seller_products
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own products" ON public.seller_products
  FOR DELETE USING (seller_id = auth.uid());

CREATE POLICY "Public can view active seller products" ON public.seller_products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all seller products" ON public.seller_products
  FOR ALL USING (public.is_super_admin());

-- 9. RLS Policies for product_requests
CREATE POLICY "Sellers can view their own requests" ON public.product_requests
  FOR SELECT USING (seller_id = auth.uid());
  
CREATE POLICY "Sellers can create requests" ON public.product_requests
  FOR INSERT WITH CHECK (seller_id = auth.uid());
  
CREATE POLICY "Sellers can update pending requests" ON public.product_requests
  FOR UPDATE USING (seller_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all requests" ON public.product_requests
  FOR ALL USING (public.is_super_admin());

-- 10. RLS Policies for bulk uploads
CREATE POLICY "Sellers can view their own uploads" ON public.seller_bulk_uploads
  FOR SELECT USING (seller_id = auth.uid());
  
CREATE POLICY "Sellers can create uploads" ON public.seller_bulk_uploads
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can view all uploads" ON public.seller_bulk_uploads
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Sellers can view their upload items" ON public.seller_bulk_upload_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.seller_bulk_uploads 
      WHERE id = upload_id AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all upload items" ON public.seller_bulk_upload_items
  FOR ALL USING (public.is_super_admin());

-- 11. RLS Policies for audit log
CREATE POLICY "Sellers can view their own audit log" ON public.seller_inventory_audit_log
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.seller_inventory_audit_log
  FOR SELECT USING (public.is_super_admin());

-- 12. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_seller_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_seller_products_timestamp
  BEFORE UPDATE ON public.seller_products
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_products_updated_at();

CREATE TRIGGER update_product_requests_timestamp
  BEFORE UPDATE ON public.product_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_products_updated_at();

-- 13. Function to log inventory actions
CREATE OR REPLACE FUNCTION public.log_seller_inventory_action(
  p_seller_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.seller_inventory_audit_log (
    seller_id, action, entity_type, entity_id, old_values, new_values, performed_by
  ) VALUES (
    p_seller_id, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values, auth.uid()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 14. Storage bucket for product request documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-request-docs', 'product-request-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 15. Storage policies
CREATE POLICY "Sellers can upload product request documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-request-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sellers can view their product request documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-request-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all product request documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-request-docs' AND public.is_super_admin());