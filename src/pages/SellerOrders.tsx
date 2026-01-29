import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Search, 
  AlertCircle, 
  Calendar, 
  User, 
  Truck,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface OrderItemWithProduct {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    Images: string | null;
    hsn_code: string | null;
  } | null;
}

interface SellerOrderWithDetails {
  id: string;
  order_id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  seller_invoice_number: string | null;
  seller_invoice_url: string | null;
  eway_bill_number: string | null;
  seller_notes: string | null;
  rejection_reason: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order: {
    id: string;
    status: string;
    payment_status: string;
    buyer_gstin: string | null;
    buyer_company_name: string | null;
    buyer_email: string | null;
    shipping_address: any;
    buyer: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  items: OrderItemWithProduct[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const SellerOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sellerOrders, setSellerOrders] = useState<SellerOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<SellerOrderWithDetails | null>(null);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Form states
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSellerOrders = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch seller orders with related data
      const { data: orders, error: ordersError } = await supabase
        .from("seller_orders")
        .select(`
          id,
          order_id,
          status,
          subtotal,
          tax_amount,
          total_amount,
          tracking_number,
          tracking_url,
          carrier_name,
          seller_invoice_number,
          seller_invoice_url,
          eway_bill_number,
          seller_notes,
          rejection_reason,
          shipped_at,
          delivered_at,
          created_at
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setSellerOrders([]);
        return;
      }

      // Get order IDs to fetch parent order details
      const orderIds = [...new Set(orders.map(o => o.order_id))];

      // Fetch parent orders
      const { data: parentOrders, error: parentError } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          payment_status,
          buyer_gstin,
          buyer_company_name,
          buyer_email,
          shipping_address,
          buyer:companies!orders_buyer_id_fkey (
            id,
            name,
            email
          )
        `)
        .in("id", orderIds);

      if (parentError) throw parentError;

      // Fetch order items for these seller orders
      const sellerOrderIds = orders.map(o => o.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          seller_order_id,
          quantity,
          unit_price,
          total_price,
          product:products (
            id,
            name,
            Images,
            hsn_code
          )
        `)
        .in("seller_order_id", sellerOrderIds);

      if (itemsError) throw itemsError;

      // Combine data
      const enrichedOrders: SellerOrderWithDetails[] = orders.map(sellerOrder => {
        const parentOrder = parentOrders?.find(p => p.id === sellerOrder.order_id);
        const items = (orderItems || [])
          .filter(item => item.seller_order_id === sellerOrder.id)
          .map(item => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product: item.product as OrderItemWithProduct["product"],
          }));

        return {
          ...sellerOrder,
          order: {
            id: parentOrder?.id || "",
            status: parentOrder?.status || "",
            payment_status: parentOrder?.payment_status || "",
            buyer_gstin: parentOrder?.buyer_gstin || null,
            buyer_company_name: parentOrder?.buyer_company_name || null,
            buyer_email: parentOrder?.buyer_email || null,
            shipping_address: parentOrder?.shipping_address,
            buyer: parentOrder?.buyer as SellerOrderWithDetails["order"]["buyer"],
          },
          items,
        };
      });

      setSellerOrders(enrichedOrders);
    } catch (err: any) {
      console.error("Error fetching seller orders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, [user]);

  const handleAcceptOrder = async (order: SellerOrderWithDetails) => {
    try {
      const { error } = await supabase
        .from("seller_orders")
        .update({ status: "accepted" })
        .eq("id", order.id);

      if (error) throw error;

      toast({ title: "Order accepted", description: "You can now process and ship this order." });
      fetchSellerOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectionReason) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("seller_orders")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason 
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({ title: "Order rejected", description: "The buyer will be notified." });
      setShowRejectDialog(false);
      setRejectionReason("");
      fetchSellerOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("seller_orders")
        .update({ 
          status: "shipped",
          tracking_number: trackingNumber || null,
          carrier_name: carrierName || null,
          tracking_url: trackingUrl || null,
          shipped_at: new Date().toISOString()
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({ title: "Order marked as shipped", description: "Tracking details have been saved." });
      setShowFulfillDialog(false);
      setTrackingNumber("");
      setCarrierName("");
      setTrackingUrl("");
      fetchSellerOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadInvoice = async () => {
    if (!selectedOrder || !invoiceFile || !invoiceNumber) return;
    setIsSubmitting(true);

    try {
      // Upload file
      const fileName = `${user!.id}/${selectedOrder.id}/${Date.now()}_${invoiceFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("seller-invoices")
        .upload(fileName, invoiceFile);

      if (uploadError) throw uploadError;

      // Update seller order
      const { error } = await supabase
        .from("seller_orders")
        .update({ 
          seller_invoice_number: invoiceNumber,
          seller_invoice_url: fileName,
          seller_invoice_uploaded_at: new Date().toISOString()
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({ title: "Invoice uploaded", description: "The buyer can now download your invoice." });
      setShowUploadDialog(false);
      setInvoiceFile(null);
      setInvoiceNumber("");
      fetchSellerOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDelivered = async (order: SellerOrderWithDetails) => {
    try {
      const { error } = await supabase
        .from("seller_orders")
        .update({ 
          status: "delivered",
          delivered_at: new Date().toISOString()
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({ title: "Order delivered", description: "Order has been marked as delivered." });
      fetchSellerOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredOrders = sellerOrders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

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
          <h1 className="text-2xl font-bold">Seller Orders</h1>
          <p className="text-muted-foreground">
            Manage your portion of marketplace orders
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
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                onClick={() => fetchSellerOrders()}
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
                {sellerOrders.length === 0
                  ? "No orders yet"
                  : "No orders match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {sellerOrders.length === 0
                  ? "Orders for your products will appear here."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Order #{order.order_id.slice(0, 8).toUpperCase()}
                      <span className="text-sm font-normal text-muted-foreground">
                        (Your Portion)
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.order.buyer?.name || order.order.buyer_company_name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[order.status]}>
                      {order.status}
                    </Badge>
                    {order.order.buyer_gstin && (
                      <Badge variant="outline" className="text-xs">
                        B2B
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded overflow-hidden">
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
                            <div>
                              <p className="font-medium text-sm">{item.product?.name}</p>
                              {item.product?.hsn_code && (
                                <p className="text-xs text-muted-foreground">
                                  HSN: {item.product.hsn_code}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          ₹{item.unit_price.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{item.total_price.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Order Summary */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    {order.order.buyer_gstin && (
                      <span>Buyer GSTIN: <span className="font-mono">{order.order.buyer_gstin}</span></span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Your Total</p>
                    <p className="text-xl font-bold">
                      ₹{order.total_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Info badges */}
                <div className="flex flex-wrap gap-2">
                  {order.seller_invoice_number && (
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Invoice: {order.seller_invoice_number}
                    </Badge>
                  )}
                  {order.tracking_number && (
                    <Badge variant="outline" className="gap-1">
                      <Truck className="h-3 w-3" />
                      {order.carrier_name}: {order.tracking_number}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {order.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOrder(order)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept Order
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {(order.status === "accepted" || order.status === "processing") && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowFulfillDialog(true);
                        }}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Mark Shipped
                      </Button>
                      {!order.seller_invoice_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowUploadDialog(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Invoice
                        </Button>
                      )}
                    </>
                  )}
                  {order.status === "shipped" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleMarkDelivered(order)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Delivered
                      </Button>
                      {!order.seller_invoice_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowUploadDialog(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Invoice
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this order. The buyer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Out of stock, Cannot ship to this location..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectOrder}
              disabled={!rejectionReason || isSubmitting}
            >
              {isSubmitting ? "Rejecting..." : "Reject Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Enter shipping details for this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="carrier">Carrier Name</Label>
              <Input
                id="carrier"
                placeholder="e.g., BlueDart, DTDC, Delhivery"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                placeholder="Enter tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
              <Input
                id="trackingUrl"
                placeholder="https://..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFulfillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkShipped} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload GST Invoice</DialogTitle>
            <DialogDescription>
              Upload your GST tax invoice for this order. The buyer will be able to download it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="invoiceNum">Invoice Number *</Label>
              <Input
                id="invoiceNum"
                placeholder="e.g., INV/2025-26/00001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="invoiceFile">Invoice File (PDF) *</Label>
              <Input
                id="invoiceFile"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a GST-compliant tax invoice in PDF format
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadInvoice} 
              disabled={!invoiceFile || !invoiceNumber || isSubmitting}
            >
              {isSubmitting ? "Uploading..." : "Upload Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
