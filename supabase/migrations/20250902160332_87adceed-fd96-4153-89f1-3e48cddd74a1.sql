-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

-- Create policies for payment-proofs bucket
CREATE POLICY "Users can upload their own payment proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-proofs' AND EXISTS (
  SELECT 1 FROM admin_users 
  WHERE admin_users.id = auth.uid()
));

-- Fix invoice RLS policies - allow users to create invoices for their orders
CREATE POLICY "Users can create invoices for their orders" 
ON invoices 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Update orders table to allow better tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id uuid REFERENCES shopping_carts(id);

-- Create a function to automatically create/get user's cart
CREATE OR REPLACE FUNCTION get_or_create_user_cart(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cart_id_result uuid;
BEGIN
  -- Try to get existing cart
  SELECT id INTO cart_id_result 
  FROM shopping_carts 
  WHERE buyer_id = user_id 
  LIMIT 1;
  
  -- If no cart exists, create one
  IF cart_id_result IS NULL THEN
    INSERT INTO shopping_carts (buyer_id) 
    VALUES (user_id) 
    RETURNING id INTO cart_id_result;
  END IF;
  
  RETURN cart_id_result;
END;
$$;