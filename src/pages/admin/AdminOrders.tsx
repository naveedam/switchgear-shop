import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Eye, 
  Package, 
  Store, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Truck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PaymentProofViewer: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [loading, setLoading] = useState(false);

  const handleViewProof = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment proof',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleViewProof}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'View Payment Proof'}
    </Button>
  );
};

interface SellerOrderData {
  id: string;
  seller_id: string;
  status: string;
  subtotal: number;
  total_amount: number;
  tracking_number: string | null;
  seller_invoice_number: string | null;
  seller_invoice_url: string | null;
  seller: {
    name: string;
    email: string;
  } | null;
}

interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_reference?: string;
  payment_proof_url?: string;
  shipping_address: any;
  buyer_gstin?: string;
  buyer_company_name?: string;
  is_multi_seller?: boolean;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
    email: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    seller_order_id: string | null;
    products: {
      name: string;
      sku?: string;
      vendor_id: string;
    };
  }>;
  seller_orders?: SellerOrderData[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'orders' | 'sellers'>('orders');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          companies!orders_buyer_id_fkey (name, email),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            seller_order_id,
            products (name, sku, vendor_id)
          ),
          seller_orders (
            id,
            seller_id,
            status,
            subtotal,
            total_amount,
            tracking_number,
            seller_invoice_number,
            seller_invoice_url,
            seller:companies!seller_orders_seller_id_fkey (name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      await loadOrders();
      toast({
        title: 'Success',
        description: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.companies?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">
            Multi-seller marketplace order management
          </p>
        </div>
        <Button onClick={loadOrders}>Refresh</Button>
      </div>

      {/* Tabs for view mode */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'orders' | 'sellers')}>
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            Parent Orders
          </TabsTrigger>
          <TabsTrigger value="sellers" className="gap-2">
            <Store className="h-4 w-4" />
            Seller Fulfillment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No orders found
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                          {order.is_multi_seller && (
                            <Badge variant="outline" className="gap-1">
                              <Store className="h-3 w-3" />
                              Multi-Seller
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Buyer: {order.companies?.name || 'Unknown'} ({order.companies?.email})
                        </p>
                        {order.buyer_gstin && (
                          <p className="text-sm text-muted-foreground">
                            GSTIN: <span className="font-mono">{order.buyer_gstin}</span>
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={statusColors[order.status]}>
                          {order.status?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {order.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Seller Orders Summary */}
                    {order.seller_orders && order.seller_orders.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Seller Fulfillment ({order.seller_orders.length} sellers)
                        </h4>
                        <div className="space-y-2">
                          {order.seller_orders.map((sellerOrder) => (
                            <div 
                              key={sellerOrder.id} 
                              className="flex items-center justify-between bg-muted/50 rounded p-3"
                            >
                              <div className="flex items-center gap-3">
                                <Store className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {sellerOrder.seller?.name || 'Unknown Seller'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ₹{sellerOrder.total_amount.toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`${statusColors[sellerOrder.status]} text-xs`}>
                                  {sellerOrder.status}
                                </Badge>
                                {sellerOrder.seller_invoice_url && (
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <FileText className="h-3 w-3" />
                                    Invoice
                                  </Badge>
                                )}
                                {sellerOrder.tracking_number && (
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    <Truck className="h-3 w-3" />
                                    Shipped
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-2">Items ({order.order_items?.length || 0})</h4>
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1">
                          <span className="text-sm">
                            {item.products.name} × {item.quantity}
                          </span>
                          <span className="text-sm font-medium">
                            ₹{item.total_price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center font-bold">
                        <span>Total</span>
                        <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {order.payment_reference && (
                      <div>
                        <h4 className="font-semibold mb-2">Payment Details</h4>
                        <p className="text-sm">UTR: {order.payment_reference}</p>
                        {order.payment_proof_url && <PaymentProofViewer filePath={order.payment_proof_url} />}
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.shipping_address && (
                      <div>
                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address.street}, {order.shipping_address.city}, 
                          {order.shipping_address.state} {order.shipping_address.zipCode}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_payment">Pending Payment</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seller Fulfillment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.flatMap(order => 
                  (order.seller_orders || []).map(sellerOrder => ({
                    ...sellerOrder,
                    parentOrder: order
                  }))
                ).map((sellerOrder) => (
                  <div 
                    key={sellerOrder.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-muted p-2 rounded-full">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {sellerOrder.seller?.name || 'Unknown Seller'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{sellerOrder.parentOrder.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Buyer: {sellerOrder.parentOrder.companies?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{sellerOrder.total_amount.toLocaleString('en-IN')}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {sellerOrder.seller_invoice_url ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {sellerOrder.seller_invoice_url ? 'Invoice uploaded' : 'Invoice pending'}
                          </span>
                        </div>
                      </div>
                      <Badge className={statusColors[sellerOrder.status]}>
                        {sellerOrder.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOrders;
