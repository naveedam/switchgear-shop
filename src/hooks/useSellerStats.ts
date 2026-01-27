import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SellerStats {
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  recentOrders: RecentOrder[];
  salesData: SalesDataPoint[];
  topProducts: TopProduct[];
  isLoading: boolean;
  error: string | null;
}

interface RecentOrder {
  id: string;
  buyerName: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  image: string | null;
  soldCount: number;
  revenue: number;
}

export function useSellerStats(sellerId: string | undefined): SellerStats {
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    recentOrders: [],
    salesData: [],
    topProducts: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!sellerId) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch product count
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', sellerId)
          .eq('status', 'active');

        if (productError) throw productError;

        // Fetch order items for this seller's products
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            quantity,
            unit_price,
            total_price,
            product:products!inner (
              id,
              name,
              Images,
              vendor_id
            ),
            order:orders!inner (
              id,
              status,
              created_at,
              buyer:companies!orders_buyer_id_fkey (
                id,
                name
              )
            )
          `)
          .eq('product.vendor_id', sellerId);

        if (orderItemsError) throw orderItemsError;

        // Calculate stats from order items
        const uniqueOrderIds = new Set<string>();
        const uniqueCustomerIds = new Set<string>();
        let totalRevenue = 0;
        const productSales: Record<string, { count: number; revenue: number; name: string; image: string | null }> = {};
        const monthlySales: Record<string, { revenue: number; orders: Set<string> }> = {};

        orderItems?.forEach((item: any) => {
          uniqueOrderIds.add(item.order_id);
          
          if (item.order?.buyer?.id) {
            uniqueCustomerIds.add(item.order.buyer.id);
          }

          totalRevenue += item.total_price || 0;

          // Track product sales
          const productId = item.product?.id;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                count: 0,
                revenue: 0,
                name: item.product.name,
                image: item.product.Images,
              };
            }
            productSales[productId].count += item.quantity || 1;
            productSales[productId].revenue += item.total_price || 0;
          }

          // Track monthly sales
          if (item.order?.created_at) {
            const date = new Date(item.order.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlySales[monthKey]) {
              monthlySales[monthKey] = { revenue: 0, orders: new Set() };
            }
            monthlySales[monthKey].revenue += item.total_price || 0;
            monthlySales[monthKey].orders.add(item.order_id);
          }
        });

        // Build recent orders
        const orderMap = new Map<string, RecentOrder>();
        orderItems?.forEach((item: any) => {
          const orderId = item.order_id;
          if (!orderMap.has(orderId)) {
            orderMap.set(orderId, {
              id: orderId,
              buyerName: item.order?.buyer?.name || 'Unknown',
              status: item.order?.status || 'pending',
              totalAmount: 0,
              createdAt: new Date(item.order?.created_at || Date.now()),
              items: [],
            });
          }
          const order = orderMap.get(orderId)!;
          order.totalAmount += item.total_price || 0;
          order.items.push({
            productName: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.unit_price,
          });
        });

        const recentOrders = Array.from(orderMap.values())
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

        // Build top products
        const topProducts: TopProduct[] = Object.entries(productSales)
          .map(([id, data]) => ({
            id,
            name: data.name,
            image: data.image,
            soldCount: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.soldCount - a.soldCount)
          .slice(0, 4);

        // Build sales data (last 7 months)
        const salesData: SalesDataPoint[] = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const monthName = d.toLocaleString('en-US', { month: 'short' });
          const monthData = monthlySales[monthKey];
          salesData.push({
            date: monthName,
            revenue: monthData?.revenue || 0,
            orders: monthData?.orders.size || 0,
          });
        }

        setStats({
          totalProducts: productCount || 0,
          totalRevenue,
          totalOrders: uniqueOrderIds.size,
          totalCustomers: uniqueCustomerIds.size,
          recentOrders,
          salesData,
          topProducts,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Error fetching seller stats:', err);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Failed to load statistics',
        }));
      }
    };

    fetchStats();
  }, [sellerId]);

  return stats;
}
