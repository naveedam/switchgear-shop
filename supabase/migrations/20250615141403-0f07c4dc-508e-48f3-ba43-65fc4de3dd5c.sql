
-- Create table for sellers' own catalog listings
CREATE TABLE public.seller_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  catalog_product_id uuid NOT NULL REFERENCES public.catalog_products(id),
  price numeric NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'listed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Optionally, you may add more fields (e.g., notes, SKU override, custom description, etc.)
  UNIQUE (seller_id, catalog_product_id)
);

-- Enable RLS to protect data per seller
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow the seller to select, insert, update, or delete their own products
CREATE POLICY "Sellers can manage their own products"
  ON public.seller_products
  FOR ALL
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
