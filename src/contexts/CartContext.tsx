
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// --- Type Definitions ---
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type AddToCartItem = {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

interface CartContextType {
  cartId: string | null;
  items: CartItem[];
  isFetching: boolean;
  addToCart: (item: AddToCartItem) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetchCart: () => Promise<void>;
}

// --- "Safe Context" Pattern ---
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch (or create) user's cart and its items
  const fetchCart = async () => {
    if (!user) return;
    setIsFetching(true);
    let { data: cart, error: cartErr } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (cartErr) {
      setIsFetching(false);
      return;
    }
    if (!cart) {
      const { data: newCart, error: createErr } = await supabase
        .from('shopping_carts')
        .insert([{ buyer_id: user.id }])
        .select('id')
        .single();
      if (createErr || !newCart) {
        setIsFetching(false);
        return;
      }
      cart = newCart;
    }
    setCartId(cart.id);

    // Fetch items in cart
    const { data: cartItems, error: itemsErr } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);

    if (!itemsErr && cartItems) {
      setItems(cartItems.map((ci: any) => ({
        id: ci.id,
        productId: ci.product_id,
        productName: ci.product_name ?? '',
        productImage: ci.product_image ?? '',
        variantId: ci.variant_id,
        variantName: ci.variant_name,
        sku: ci.sku,
        quantity: ci.quantity,
        unitPrice: ci.unit_price,
        totalPrice: ci.unit_price * ci.quantity,
      })));
    } else {
      setItems([]);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    } else {
      setCartId(null);
      setItems([]);
    }
  }, [isAuthenticated, user?.id]);

  const addToCart = async (item: AddToCartItem) => {
    if (!cartId) return;
    setIsFetching(true);
    const { data: existingItems, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', item.productId)
      .eq('variant_id', item.variantId || null);

    if (!error && existingItems && existingItems[0]) {
      const existing = existingItems[0];
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('cart_items')
        .insert([{
          cart_id: cartId,
          product_id: item.productId,
          product_name: item.productName,
          product_image: item.productImage,
          variant_id: item.variantId || null,
          variant_name: item.variantName || null,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }]);
    }
    await fetchCart();
    setIsFetching(false);
  };

  const removeFromCart = async (cartItemId: string) => {
    setIsFetching(true);
    await supabase.from('cart_items').delete().eq('id', cartItemId);
    await fetchCart();
    setIsFetching(false);
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    setIsFetching(true);
    await supabase.from('cart_items').update({ quantity }).eq('id', cartItemId);
    await fetchCart();
    setIsFetching(false);
  };

  const clearCart = async () => {
    if (cartId) {
      setIsFetching(true);
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
      await fetchCart();
      setIsFetching(false);
    }
  };

  const value: CartContextType = {
    cartId,
    items,
    isFetching,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refetchCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
