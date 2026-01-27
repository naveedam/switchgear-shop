import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Search, AlertCircle, Calendar, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface OrderItemWithProduct {
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

interface SellerOrder {
  id: string;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  total_amount: number;
  created_at: string | null;
  tracking_number: string | null;
  notes: string | null;
  buyer: {
    id: string;
    name: string;
    email: string;
  } | null;
  order_items: OrderItemWithProduct[];
  seller_total: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const SellerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchSellerOrders = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // First get all order items for products belonging to this seller
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
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
            )
          `)
          .eq("product.vendor_id", user.id);

        if (itemsError) throw itemsError;

        if (!orderItems || orderItems.length === 0) {
          setOrders([]);
          return;
        }

        // Get unique order IDs
        const orderIds = [...new Set(orderItems.map((item) => item.order_id))];

        // Fetch order details
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            id,
            status,
            payment_status,
            fulfillment_status,
            total_amount,
            created_at,
            tracking_number,
            notes,
            buyer:companies!orders_buyer_id_fkey (
              id,
              name,
              email
            )
          `)
          .in("id", orderIds)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        // Combine orders with their items (only items from this seller)
        const sellerOrders: SellerOrder[] = (ordersData || []).map((order) => {
          const sellerItems = orderItems
            .filter((item) => item.order_id === order.id)
            .map((item) => ({
              id: item.id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              product: item.product as OrderItemWithProduct["product"],
            }));

          const sellerTotal = sellerItems.reduce(
            (sum, item) => sum + item.total_price,
            0
          );

          return {
            ...order,
            buyer: order.buyer as SellerOrder["buyer"],
            order_items: sellerItems,
            seller_total: sellerTotal,
          };
        });

        setOrders(sellerOrders);
      } catch (err: any) {
        console.error("Error fetching seller orders:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some((item) =>
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-center text-muted-foreground">
          Please log in to view your orders.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage orders containing your products
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, buyer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {orders.length === 0
                  ? "No orders yet"
                  : "No orders match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {orders.length === 0
                  ? "Orders containing your products will appear here."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredOrders.length} Order{filteredOrders.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Your Earnings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {order.buyer?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.buyer?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.order_items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="w-10 h-10 bg-muted rounded overflow-hidden"
                          >
                            {item.product?.Images ? (
                              <img
                                src={item.product.Images}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-full h-full p-2 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {order.order_items.length > 2 && (
                          <span className="text-sm text-muted-foreground">
                            +{order.order_items.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        ₹{order.seller_total.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[order.status || "pending"]}
                      >
                        {order.status || "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {order.created_at
                          ? format(new Date(order.created_at), "MMM d, yyyy")
                          : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.created_at
                          ? formatDistanceToNow(new Date(order.created_at), {
                              addSuffix: true,
                            })
                          : ""}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerOrders;
