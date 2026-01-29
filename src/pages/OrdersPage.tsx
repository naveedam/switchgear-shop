import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingBag, 
  Package, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Store, 
  FileText,
  Truck,
  Download
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

interface SellerOrderData {
  id: string;
  seller_id: string;
  status: string;
  total_amount: number;
  tracking_number: string | null;
  seller_invoice_url: string | null;
  seller: {
    name: string;
  } | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  seller_order_id: string | null;
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
  is_multi_seller: boolean | null;
  buyer_gstin: string | null;
  order_items: OrderItem[];
  seller_orders: SellerOrderData[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  completed: 'bg-green-50 text-green-700',
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
            is_multi_seller,
            buyer_gstin,
            order_items (
              id,
              quantity,
              unit_price,
              total_price,
              seller_order_id,
              product:products (
                id,
                name,
                Images
              )
            ),
            seller_orders (
              id,
              seller_id,
              status,
              total_amount,
              tracking_number,
              seller_invoice_url,
              seller:companies!seller_orders_seller_id_fkey (
                name
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

  const handleDownloadInvoice = async (invoiceUrl: string, sellerName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('seller-invoices')
        .createSignedUrl(invoiceUrl, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

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
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                        {order.is_multi_seller && (
                          <Badge variant="outline" className="text-xs">
                            <Store className="h-3 w-3 mr-1" />
                            Multi-Seller
                          </Badge>
                        )}
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
                        {(order.status || 'Pending').replace('_', ' ')}
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
                
                <CardContent className="space-y-4">
                  {/* Seller Shipments */}
                  {order.seller_orders && order.seller_orders.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {order.seller_orders.length} Seller Shipment{order.seller_orders.length > 1 ? 's' : ''}
                      </h4>
                      {order.seller_orders.map((sellerOrder, index) => (
                        <div 
                          key={sellerOrder.id} 
                          className="bg-muted/50 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {sellerOrder.seller?.name || 'Unknown Seller'}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${statusColors[sellerOrder.status]}`}
                              >
                                {sellerOrder.status}
                              </Badge>
                            </div>
                            <span className="font-semibold">
                              ₹{sellerOrder.total_amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {sellerOrder.tracking_number && (
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {sellerOrder.tracking_number}
                              </span>
                            )}
                            {sellerOrder.seller_invoice_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => handleDownloadInvoice(
                                  sellerOrder.seller_invoice_url!,
                                  sellerOrder.seller?.name || 'Seller'
                                )}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Invoice
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback: Show order items directly */
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
                    </div>
                  )}

                  <Separator />

                  {/* Order Total & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-lg font-semibold">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Button variant="ghost" className="gap-1" asChild>
                      <Link to={`/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
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
