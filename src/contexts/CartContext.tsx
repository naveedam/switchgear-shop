
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  featuredImage: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load cart from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadCartFromSupabase();
    } else {
      // Clear cart when user logs out
      setCart([]);
    }
  }, [user]);

  const loadCartFromSupabase = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user's cart
      const { data: cartData } = await supabase.rpc('get_or_create_user_cart', { user_id: user.id });
      
      if (cartData) {
        // Get cart items with product details
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              Images
            )
          `)
          .eq('cart_id', cartData);

        if (cartItems) {
          const formattedCart: CartItem[] = cartItems.map((item: any) => ({
            productId: item.product_id,
            name: item.products.name,
            price: item.products.price,
            quantity: item.quantity,
            featuredImage: item.products.Images || '/placeholder.svg'
          }));
          setCart(formattedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const syncCartToSupabase = async (updatedCart: CartItem[]) => {
    if (!user) return;

    try {
      const { data: cartId } = await supabase.rpc('get_or_create_user_cart', { user_id: user.id });
      
      if (cartId) {
        // Clear existing cart items
        await supabase.from('cart_items').delete().eq('cart_id', cartId);
        
        // Add new cart items
        if (updatedCart.length > 0) {
          const cartItemsToInsert = updatedCart.map(item => ({
            cart_id: cartId,
            product_id: item.productId,
            quantity: item.quantity
          }));
          
          await supabase.from('cart_items').insert(cartItemsToInsert);
        }
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  };

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    const updatedCart = (() => {
      const existing = cart.find(i => i.productId === item.productId);
      if (existing) {
        return cart.map(i =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...cart, { ...item, quantity: 1 }];
    })();
    
    setCart(updatedCart);
    if (user) {
      syncCartToSupabase(updatedCart);
    }
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(i => i.productId !== productId);
    setCart(updatedCart);
    if (user) {
      syncCartToSupabase(updatedCart);
    }
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      syncCartToSupabase([]);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isLoading }}>
      {children}
    </CartContext.Provider>
  );
};
