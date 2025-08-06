-- Create brands table if it doesn't exist with additional data
INSERT INTO brands (name, description, website, status) VALUES
('SIEMENS', 'Global technology powerhouse focusing on electrification, automation and digitalization', 'https://www.siemens.com', 'active'),
('Legrand', 'Global specialist in electrical and digital building infrastructures', 'https://www.legrand.com', 'active'),
('Schneider Electric', 'Global specialist in energy management and automation', 'https://www.se.com', 'active'),
('Fonolex', 'Leading manufacturer of electrical cables and wires in India', 'https://www.fonolex.com', 'active'),
('BCH Electric', 'Leading electrical equipment manufacturer', 'https://www.bchelectric.com', 'active')
ON CONFLICT (name) DO NOTHING;

-- Create seller_brand_authorizations table
CREATE TABLE IF NOT EXISTS public.seller_brand_authorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  authorization_level TEXT NOT NULL DEFAULT 'Authorized Dealer',
  certificate_number TEXT,
  issued_date DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, brand_id)
);

-- Enable RLS on seller_brand_authorizations
ALTER TABLE public.seller_brand_authorizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seller_brand_authorizations
CREATE POLICY "Sellers can view their own brand authorizations"
ON public.seller_brand_authorizations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM seller_onboarding 
  WHERE seller_onboarding.id = seller_brand_authorizations.seller_id 
  AND seller_onboarding.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all brand authorizations"
ON public.seller_brand_authorizations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.id = auth.uid() 
  AND admin_users.is_super_admin = true
));

CREATE POLICY "Public can view active brand authorizations"
ON public.seller_brand_authorizations
FOR SELECT
USING (status = 'active');

-- Add trigger for updated_at
CREATE TRIGGER update_seller_brand_authorizations_updated_at
BEFORE UPDATE ON public.seller_brand_authorizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();