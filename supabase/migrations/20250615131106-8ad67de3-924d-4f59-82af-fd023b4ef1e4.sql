
-- Enable RLS on shopping_carts and cart_items
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policy for shopping_carts: a user can see and manipulate only their own cart
CREATE POLICY "Allow cart owner full access" ON shopping_carts
  FOR ALL
  USING (buyer_id = auth.uid());

-- Policy for cart_items: a user can see and manipulate only items in their own cart
CREATE POLICY "Allow cart items to be accessed by cart owner" ON cart_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_carts
      WHERE shopping_carts.id = cart_items.cart_id
      AND shopping_carts.buyer_id = auth.uid()
    )
  );
