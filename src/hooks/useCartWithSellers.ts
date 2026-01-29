import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { CartItemWithSeller, GroupedCartBySeller } from '@/types/seller-order';

export function useCartWithSellers() {
  const { cart, isLoading: cartLoading } = useCart();
  const [cartWithSellers, setCartWithSellers] = useState<CartItemWithSeller[]>([]);
  const [groupedBySeller, setGroupedBySeller] = useState<GroupedCartBySeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMultiSeller, setIsMultiSeller] = useState(false);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (cartLoading || cart.length === 0) {
        setCartWithSellers([]);
        setGroupedBySeller([]);
        setIsLoading(false);
        setIsMultiSeller(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get product IDs from cart
        const productIds = cart.map(item => item.productId);

        // Fetch products with their seller info
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            vendor_id,
            vendor:companies!products_vendor_id_fkey (
              id,
              name
            )
          `)
          .in('id', productIds);

        if (error) throw error;

        // Create a map of product ID to seller info
        const productSellerMap = new Map<string, { sellerId: string; sellerName: string }>();
        products?.forEach(product => {
          productSellerMap.set(product.id, {
            sellerId: product.vendor_id,
            sellerName: (product.vendor as any)?.name || 'Unknown Seller'
          });
        });

        // Enrich cart items with seller info
        const enrichedCart: CartItemWithSeller[] = cart.map(item => {
          const sellerInfo = productSellerMap.get(item.productId) || {
            sellerId: 'unknown',
            sellerName: 'Unknown Seller'
          };
          return {
            ...item,
            sellerId: sellerInfo.sellerId,
            sellerName: sellerInfo.sellerName
          };
        });

        setCartWithSellers(enrichedCart);

        // Group items by seller
        const sellerGroups = new Map<string, GroupedCartBySeller>();
        enrichedCart.forEach(item => {
          if (!sellerGroups.has(item.sellerId)) {
            sellerGroups.set(item.sellerId, {
              sellerId: item.sellerId,
              sellerName: item.sellerName,
              items: [],
              subtotal: 0
            });
          }
          const group = sellerGroups.get(item.sellerId)!;
          group.items.push(item);
          group.subtotal += item.price * item.quantity;
        });

        const grouped = Array.from(sellerGroups.values());
        setGroupedBySeller(grouped);
        setIsMultiSeller(grouped.length > 1);
      } catch (error) {
        console.error('Error fetching seller info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerInfo();
  }, [cart, cartLoading]);

  const totalAmount = cartWithSellers.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return {
    cartWithSellers,
    groupedBySeller,
    isLoading: isLoading || cartLoading,
    isMultiSeller,
    totalAmount,
    sellerCount: groupedBySeller.length
  };
}
