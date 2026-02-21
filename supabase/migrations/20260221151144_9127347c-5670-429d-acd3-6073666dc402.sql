
-- Seller-category mapping table for RFQ routing
CREATE TABLE public.seller_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, category_slug)
);

ALTER TABLE public.seller_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own categories" ON public.seller_categories
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their own categories" ON public.seller_categories
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage seller categories" ON public.seller_categories
  FOR ALL USING (public.is_super_admin());

-- Add routing metadata to rfq_seller_invitations
ALTER TABLE public.rfq_seller_invitations
  ADD COLUMN IF NOT EXISTS matched_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS routing_method TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS routing_score INTEGER DEFAULT 0;

-- Add categories_detected to rfqs for admin visibility
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS categories_detected TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sellers_invited INTEGER DEFAULT 0;

-- Seed seller_categories from existing vendor data (all known categories for all active sellers)
INSERT INTO public.seller_categories (seller_id, category_slug, product_count)
SELECT c.id, cat.slug, 0
FROM companies c
CROSS JOIN product_categories cat
WHERE c.is_vendor = true AND c.status = 'active'
ON CONFLICT DO NOTHING;
