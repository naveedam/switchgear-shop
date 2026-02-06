import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  IndianRupee,
  FileText,
  TrendingUp,
  Building2,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  getSellerSettlements,
  getSellerSettlementSummary,
  getSellerCommissionInvoices
} from '@/services/escrowService';
import { SellerSettlement, SellerSettlementSummary, PlatformCommissionInvoice } from '@/types/escrow';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  eligible: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusDescriptions: Record<string, string> = {
  pending: 'Waiting for order acceptance, invoice upload, and shipment',
  eligible: 'All conditions met, ready for settlement by admin',
  processing: 'Settlement is being processed',
  completed: 'Funds have been released to your account',
  on_hold: 'Settlement is on hold - contact support',
  cancelled: 'Settlement was cancelled',
};

const SellerSettlements: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [summary, setSummary] = useState<SellerSettlementSummary | null>(null);
  const [settlements, setSettlements] = useState<SellerSettlement[]>([]);
  const [commissionInvoices, setCommissionInvoices] = useState<PlatformCommissionInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const [summaryData, settlementsData, invoicesData] = await Promise.all([
        getSellerSettlementSummary(user.id),
        getSellerSettlements(user.id),
        getSellerCommissionInvoices(user.id)
      ]);
      
      setSummary(summaryData);
      setSettlements(settlementsData);
      setCommissionInvoices(invoicesData as PlatformCommissionInvoice[]);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
      toast({ title: 'Error', description: 'Failed to load settlement data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please log in to view your settlements.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settlements</h1>
        <p className="text-muted-foreground">Track your order settlements and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-yellow-600">
                {(summary?.pendingAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting fulfillment milestones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Ready for Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-blue-600">
                {(summary?.eligibleAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Will be settled soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Settled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-green-600">
                {(summary?.settledAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paid to your account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Commission Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {(summary?.totalCommissionPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform fees deducted</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Building2 className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Settlement Process:</strong> Once you accept an order, upload your GST invoice, and mark it as shipped/delivered, 
          your payment becomes eligible for settlement. Platform commission ({2.5}%) and TCS ({1}%) are deducted before payout.
          Settlements are typically processed within 7 days after delivery.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="settlements">
        <TabsList>
          <TabsTrigger value="settlements">Settlement History</TabsTrigger>
          <TabsTrigger value="commission">Commission Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="settlements" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Gross Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">TCS</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No settlements yet</p>
                        <p className="text-sm">Complete orders to see settlements here</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    settlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <p className="font-mono text-xs">{settlement.order_id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(settlement.created_at), 'dd MMM yyyy')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{settlement.order?.buyer_company_name || 'N/A'}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{settlement.gross_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -₹{settlement.platform_commission.toLocaleString('en-IN')}
                          <span className="text-xs ml-1 text-muted-foreground">
                            ({settlement.commission_rate}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          -₹{settlement.tcs_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{settlement.net_payable.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${settlement.order_accepted ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-xs">Accepted</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${settlement.invoice_uploaded ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-xs">Invoice</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${settlement.shipment_confirmed ? 'bg-green-500' : 'bg-gray-300'}`} />
                              <span className="text-xs">Shipped</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={`${statusColors[settlement.status]} cursor-help`}>
                                  {settlement.status}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{statusDescriptions[settlement.status]}</p>
                                {settlement.settled_at && (
                                  <p className="text-xs mt-1">
                                    Settled on {format(new Date(settlement.settled_at), 'dd MMM yyyy')}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Commission Invoices</CardTitle>
              <CardDescription>
                GST invoices for platform commission charged on your orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissionInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No commission invoices yet</p>
                  <p className="text-sm">Invoices will appear after settlements are processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Order Value</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">GST</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissionInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.period_start), 'dd MMM')} - {format(new Date(invoice.period_end), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{invoice.total_order_value.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{invoice.commission_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(invoice.cgst_amount + invoice.sgst_amount + invoice.igst_amount).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{invoice.total_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.pdf_url && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you have questions about your settlements or see an "On Hold" status, 
                please contact our seller support team at <span className="text-primary">seller-support@switchgearshop.in</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerSettlements;
