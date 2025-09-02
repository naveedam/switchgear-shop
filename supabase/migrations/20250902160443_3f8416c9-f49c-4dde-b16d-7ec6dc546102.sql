-- Fix the search_path for the function to address security warning
CREATE OR REPLACE FUNCTION get_or_create_user_cart(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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