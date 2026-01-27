import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, Download, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  id: string;
  description: string;
  hsn_code: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  discount: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  seller_name: string | null;
  seller_gstin: string | null;
  seller_address: any;
  buyer_name: string | null;
  buyer_gstin: string | null;
  buyer_address: any;
  place_of_supply: string | null;
  invoice_type: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  status: string;
  created_at: string;
  due_date: string;
  financial_year: string | null;
  irn: string | null;
  notes: string | null;
  invoice_items: InvoiceItem[];
}

interface Props {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'D&NH and D&D', '27': 'Maharashtra', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'A&N Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const InvoiceViewer: React.FC<Props> = ({ invoiceId, open, onOpenChange }) => {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('invoices')
          .select(`
            *,
            invoice_items (*)
          `)
          .eq('id', invoiceId)
          .single();

        if (fetchError) throw fetchError;

        setInvoice(data as Invoice);
      } catch (err: any) {
        console.error('Error fetching invoice:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchInvoice();
    }
  }, [invoiceId, open]);

  const handlePrint = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoice_id: invoiceId, action: 'html' },
      });

      if (error) throw error;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const isInterState = invoice && invoice.igst_amount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            <p>{error}</p>
          </div>
        ) : invoice ? (
          <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">TAX INVOICE</h2>
                <Badge variant="outline" className="mt-1">
                  {invoice.invoice_type || 'B2C'}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{invoice.invoice_number}</div>
                <div className="text-sm text-muted-foreground">
                  Date: {format(new Date(invoice.created_at), 'dd/MM/yyyy')}
                </div>
                {invoice.due_date && (
                  <div className="text-sm text-muted-foreground">
                    Due: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </div>
            </div>

            {/* Seller & Buyer Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Seller Details</h3>
                <div className="text-sm space-y-1">
                  <div className="font-medium">{invoice.seller_name}</div>
                  {invoice.seller_address?.street && (
                    <div>{invoice.seller_address.street}</div>
                  )}
                  {invoice.seller_address?.state_code && (
                    <div>
                      State: {STATE_CODES[invoice.seller_address.state_code] || invoice.seller_address.state_code} ({invoice.seller_address.state_code})
                    </div>
                  )}
                  {invoice.seller_gstin && (
                    <div className="font-mono">GSTIN: {invoice.seller_gstin}</div>
                  )}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Buyer Details</h3>
                <div className="text-sm space-y-1">
                  <div className="font-medium">{invoice.buyer_name}</div>
                  {invoice.buyer_address?.street && (
                    <div>{invoice.buyer_address.street}</div>
                  )}
                  {invoice.buyer_address?.state_code && (
                    <div>
                      State: {STATE_CODES[invoice.buyer_address.state_code] || invoice.buyer_address.state_code} ({invoice.buyer_address.state_code})
                    </div>
                  )}
                  {invoice.buyer_gstin ? (
                    <div className="font-mono">GSTIN: {invoice.buyer_gstin}</div>
                  ) : (
                    <div className="italic text-muted-foreground">Unregistered</div>
                  )}
                </div>
              </div>
            </div>

            {/* Place of Supply */}
            <div className="text-sm">
              <strong>Place of Supply:</strong>{' '}
              {STATE_CODES[invoice.place_of_supply || ''] || invoice.place_of_supply}
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">HSN</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Taxable</TableHead>
                    {isInterState ? (
                      <>
                        <TableHead className="text-center">IGST%</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-center">CGST%</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-center">SGST%</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {item.hsn_code}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{item.unit_price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{item.taxable_value.toLocaleString('en-IN')}
                      </TableCell>
                      {isInterState ? (
                        <>
                          <TableCell className="text-center">{item.igst_rate}%</TableCell>
                          <TableCell className="text-right">
                            ₹{item.igst_amount.toLocaleString('en-IN')}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-center">{item.cgst_rate}%</TableCell>
                          <TableCell className="text-right">
                            ₹{item.cgst_amount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center">{item.sgst_rate}%</TableCell>
                          <TableCell className="text-right">
                            ₹{item.sgst_amount.toLocaleString('en-IN')}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right font-medium">
                        ₹{item.total.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxable Value</span>
                  <span>₹{invoice.amount.toLocaleString('en-IN')}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between text-sm">
                    <span>IGST</span>
                    <span>₹{invoice.igst_amount.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>CGST</span>
                      <span>₹{invoice.cgst_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST</span>
                      <span>₹{invoice.sgst_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Total Tax</span>
                  <span>₹{invoice.tax_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total</span>
                  <span>₹{invoice.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* IRN & Notes */}
            {invoice.irn && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-800 text-sm">
                <strong>IRN:</strong> {invoice.irn}
              </div>
            )}

            {invoice.notes && (
              <div className="text-sm">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewer;
