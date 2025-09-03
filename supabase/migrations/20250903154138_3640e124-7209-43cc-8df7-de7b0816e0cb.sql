-- Add admin RLS policies for shopping carts and cart items
CREATE POLICY "Admins can view all shopping carts" 
ON public.shopping_carts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = auth.uid() 
  AND companies.role = 'admin'
));

CREATE POLICY "Admins can delete shopping carts" 
ON public.shopping_carts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = auth.uid() 
  AND companies.role = 'admin'
));

CREATE POLICY "Admins can view all cart items" 
ON public.cart_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = auth.uid() 
  AND companies.role = 'admin'
));

CREATE POLICY "Admins can delete cart items" 
ON public.cart_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM companies 
  WHERE companies.id = auth.uid() 
  AND companies.role = 'admin'
));

-- Storage policies for payment-proofs bucket
CREATE POLICY "Users can upload their own payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = auth.uid() 
    AND companies.role = 'admin'
  )
);