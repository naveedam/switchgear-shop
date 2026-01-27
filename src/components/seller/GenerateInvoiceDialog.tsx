import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText } from 'lucide-react';

interface Order {
  id: string;
  status: string | null;
  total_amount: number;
  created_at: string | null;
  buyer: {
    id: string;
    name: string;
    email: string;
    gstin?: string;
    state_code?: string;
    address?: string;
  } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      id: string;
      name: string;
      hsn_code?: string;
    } | null;
  }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STATE_CODES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

const GenerateInvoiceDialog: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerStateCode, setBuyerStateCode] = useState('');
  const [sellerCompany, setSellerCompany] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !open) return;

      setIsLoading(true);
      try {
        // Fetch seller's company info
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', user.id)
          .single();

        setSellerCompany(company);

        // Fetch orders without invoices
        const { data: orderItems } = await supabase
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
              hsn_code,
              vendor_id
            )
          `)
          .eq('product.vendor_id', user.id);

        if (!orderItems || orderItems.length === 0) {
          setOrders([]);
          return;
        }

        const orderIds = [...new Set(orderItems.map((item) => item.order_id))];

        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            buyer:companies!orders_buyer_id_fkey (
              id,
              name,
              email,
              gstin,
              state_code,
              address
            )
          `)
          .in('id', orderIds)
          .in('status', ['processing', 'shipped', 'delivered'])
          .order('created_at', { ascending: false });

        // Check which orders already have invoices
        const { data: existingInvoices } = await supabase
          .from('invoices')
          .select('order_id')
          .eq('seller_id', user.id)
          .in('order_id', orderIds);

        const invoicedOrderIds = new Set(existingInvoices?.map((inv) => inv.order_id) || []);

        const ordersWithItems: Order[] = (ordersData || [])
          .filter((order) => !invoicedOrderIds.has(order.id))
          .map((order) => ({
            ...order,
            buyer: order.buyer as Order['buyer'],
            order_items: orderItems
              .filter((item) => item.order_id === order.id)
              .map((item) => ({
                id: item.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                product: item.product as Order['order_items'][0]['product'],
              })),
          }));

        setOrders(ordersWithItems);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, open]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleGenerate = async () => {
    if (!selectedOrder || !user || !sellerCompany) return;

    setIsGenerating(true);
    try {
      // Calculate GST
      const items = selectedOrder.order_items.map((item) => ({
        description: item.product?.name || 'Product',
        hsn_code: item.product?.hsn_code || '8536',
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { data: gstResult, error: gstError } = await supabase.functions.invoke(
        'calculate-gst',
        {
          body: {
            seller_state_code: sellerCompany.state_code || '29',
            buyer_state_code: buyerStateCode || selectedOrder.buyer?.state_code || '29',
            items,
          },
        }
      );

      if (gstError) throw gstError;

      // Get next invoice number
      const financialYear = getCurrentFinancialYear();
      const { data: invoiceNumber, error: seqError } = await supabase.rpc(
        'get_next_invoice_number',
        {
          p_seller_id: user.id,
          p_financial_year: financialYear,
          p_prefix: sellerCompany.trade_name?.substring(0, 3).toUpperCase() || null,
        }
      );

      if (seqError) throw seqError;

      // Create invoice - using type assertion for new GST fields not yet in generated types
      const invoiceData = {
        invoice_number: invoiceNumber,
        order_id: selectedOrder.id,
        buyer_id: selectedOrder.buyer?.id,
        seller_id: user.id,
        seller_gstin: sellerCompany.gstin,
        seller_name: sellerCompany.legal_name || sellerCompany.name,
        seller_address: {
          street: sellerCompany.address,
          state_code: sellerCompany.state_code,
        },
        buyer_gstin: buyerGstin || null,
        buyer_name: selectedOrder.buyer?.name,
        buyer_address: {
          street: selectedOrder.buyer?.address,
          state_code: buyerStateCode || selectedOrder.buyer?.state_code,
        },
        place_of_supply: buyerStateCode || selectedOrder.buyer?.state_code || sellerCompany.state_code,
        invoice_type: buyerGstin ? 'B2B' : 'B2C',
        amount: gstResult.summary.total_taxable_value,
        tax_amount: gstResult.summary.total_tax,
        total_amount: gstResult.summary.grand_total,
        cgst_rate: gstResult.is_inter_state ? 0 : 9,
        cgst_amount: gstResult.summary.total_cgst,
        sgst_rate: gstResult.is_inter_state ? 0 : 9,
        sgst_amount: gstResult.summary.total_sgst,
        igst_rate: gstResult.is_inter_state ? 18 : 0,
        igst_amount: gstResult.summary.total_igst,
        financial_year: financialYear,
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData as any)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = gstResult.items.map((item: any) => ({
        invoice_id: invoice.id,
        product_id: selectedOrder.order_items.find(
          (oi) => oi.product?.name === item.description
        )?.product?.id,
        description: item.description,
        hsn_code: item.hsn_code,
        quantity: item.quantity,
        unit: 'NOS',
        unit_price: item.unit_price,
        discount: item.discount,
        taxable_value: item.taxable_value,
        cgst_rate: item.cgst_rate,
        cgst_amount: item.cgst_amount,
        sgst_rate: item.sgst_rate,
        sgst_amount: item.sgst_amount,
        igst_rate: item.igst_rate,
        igst_amount: item.igst_amount,
        total: item.total,
      }));

      await supabase.from('invoice_items').insert(invoiceItems);

      toast({
        title: 'Invoice Generated',
        description: `Invoice ${invoiceNumber} has been created successfully.`,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate GST Invoice
          </DialogTitle>
          <DialogDescription>
            Select an order to generate a GST-compliant invoice.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders available for invoicing.</p>
            <p className="text-sm">
              Orders must be in processing, shipped, or delivered status.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Order</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.id.slice(0, 8)} - {order.buyer?.name} - ₹
                      {order.total_amount.toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="font-medium">Order Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Buyer: {selectedOrder.buyer?.name}</div>
                    <div>Amount: ₹{selectedOrder.total_amount.toLocaleString('en-IN')}</div>
                    <div>Items: {selectedOrder.order_items.length}</div>
                    <div>Status: {selectedOrder.status}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Buyer GSTIN (optional for B2B)</Label>
                    <Input
                      value={buyerGstin}
                      onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                      placeholder="e.g., 29AABCU9603R1ZM"
                      maxLength={15}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for B2C invoice
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Buyer State</Label>
                    <Select
                      value={buyerStateCode || selectedOrder.buyer?.state_code || ''}
                      onValueChange={setBuyerStateCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_CODES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.code} - {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!sellerCompany?.gstin && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded text-amber-800 text-sm">
                    ⚠️ Your GSTIN is not configured. Please update your company profile
                    to generate valid GST invoices.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedOrderId || isGenerating || !sellerCompany}
          >
            {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month < 4) {
    return `${(year - 1) % 100}-${year % 100}`;
  }
  return `${year % 100}-${(year + 1) % 100}`;
}

export default GenerateInvoiceDialog;
