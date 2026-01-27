import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Download,
  Plus,
  Calendar,
  AlertCircle,
  Eye,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import GenerateInvoiceDialog from '@/components/seller/GenerateInvoiceDialog';
import InvoiceViewer from '@/components/seller/InvoiceViewer';

interface Invoice {
  id: string;
  invoice_number: string;
  buyer_name: string | null;
  buyer_gstin: string | null;
  invoice_type: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  financial_year: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const SellerInvoices: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoice_id: invoiceId, action: 'html' },
      });

      if (error) throw error;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      }

      toast({
        title: 'Invoice Ready',
        description: 'Invoice opened for printing/download',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-center text-muted-foreground">
          Please log in to view your invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Invoices
          </h1>
          <p className="text-muted-foreground">
            Manage GST-compliant invoices for your orders
          </p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or buyer..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
                  <Skeleton className="h-12 w-32" />
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
                onClick={() => fetchInvoices()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {invoices.length === 0
                  ? 'No invoices yet'
                  : 'No invoices match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {invoices.length === 0
                  ? 'Generate your first GST-compliant invoice from an order.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {invoices.length === 0 && (
                <Button onClick={() => setShowGenerateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredInvoices.length} Invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {invoice.invoice_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.buyer_name || 'Unknown'}
                        </div>
                        {invoice.buyer_gstin && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {invoice.buyer_gstin}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invoice.invoice_type || 'B2C'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ₹{invoice.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      ₹{invoice.tax_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{invoice.total_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[invoice.status] || statusColors.draft}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(invoice.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Generate Invoice Dialog */}
      <GenerateInvoiceDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onSuccess={() => {
          setShowGenerateDialog(false);
          fetchInvoices();
        }}
      />

      {/* Invoice Viewer Dialog */}
      {selectedInvoice && (
        <InvoiceViewer
          invoiceId={selectedInvoice}
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default SellerInvoices;
