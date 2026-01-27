import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Package, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    Images: string | null;
  } | null;
}

interface Order {
  id: string;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total_amount: number;
  created_at: string | null;
  tracking_number: string | null;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-gray-50 text-gray-700',
};

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            payment_status,
            fulfillment_status,
            total_amount,
            created_at,
            tracking_number,
            order_items (
              id,
              quantity,
              unit_price,
              total_price,
              product:products (
                id,
                name,
                Images
              )
            )
          `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setOrders((data as unknown as Order[]) || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to view your orders.</p>
          <Link to="/login">
            <Button className="mt-4">Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
          My Orders
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="py-8">
              <div className="text-center text-destructive">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View and track your recent orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Link to="/categories">
                  <Button>Browse Products</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {order.created_at
                          ? `${format(new Date(order.created_at), 'MMM d, yyyy')} (${formatDistanceToNow(new Date(order.created_at), { addSuffix: true })})`
                          : 'Date unknown'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={statusColors[order.status || 'pending']}
                      >
                        {order.status || 'Pending'}
                      </Badge>
                      {order.payment_status && (
                        <Badge 
                          variant="secondary"
                          className={paymentStatusColors[order.payment_status]}
                        >
                          {order.payment_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items Preview */}
                    <div className="flex items-center gap-3">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div 
                          key={item.id} 
                          className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0"
                        >
                          {item.product?.Images ? (
                            <img
                              src={item.product.Images}
                              alt={item.product.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                          +{order.order_items.length - 3}
                        </div>
                      )}
                      <div className="flex-grow" />
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-lg font-semibold">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                      <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                        Tracking: <span className="font-mono">{order.tracking_number}</span>
                      </div>
                    )}

                    {/* View Details Link */}
                    <div className="pt-2 border-t">
                      <Button variant="ghost" className="w-full justify-between" asChild>
                        <Link to={`/orders/${order.id}`}>
                          View Order Details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
