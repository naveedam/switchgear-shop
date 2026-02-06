import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Play,
  Pause,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Building2,
  IndianRupee
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  getSettlementSummary,
  getAllSettlements,
  getEscrowTransactions,
  processSettlement,
  holdSettlement,
  releaseSettlement
} from '@/services/escrowService';
import { SellerSettlement, EscrowTransaction, SettlementSummary } from '@/types/escrow';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  eligible: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  on_hold: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const transactionTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  buyer_payment: { label: 'Payment Received', color: 'text-green-600', icon: <ArrowDownRight className="h-4 w-4" /> },
  seller_settlement: { label: 'Settlement Paid', color: 'text-red-600', icon: <ArrowUpRight className="h-4 w-4" /> },
  platform_commission: { label: 'Commission', color: 'text-blue-600', icon: <TrendingUp className="h-4 w-4" /> },
  tcs_deduction: { label: 'TCS Deducted', color: 'text-orange-600', icon: <FileText className="h-4 w-4" /> },
  refund_buyer: { label: 'Refund', color: 'text-red-600', icon: <ArrowUpRight className="h-4 w-4" /> },
};

const AdminEscrow: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [settlements, setSettlements] = useState<SellerSettlement[]>([]);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [selectedSettlement, setSelectedSettlement] = useState<SellerSettlement | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, settlementsData, transactionsData] = await Promise.all([
        getSettlementSummary(),
        getAllSettlements({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 50 }),
        getEscrowTransactions({ limit: 20 })
      ]);
      
      setSummary(summaryData);
      setSettlements(settlementsData.settlements);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({ title: 'Error', description: 'Failed to load escrow data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleProcessSettlement = async () => {
    if (!selectedSettlement || !user) return;
    setIsProcessing(true);
    
    try {
      await processSettlement(selectedSettlement.id, user.id);
      toast({ title: 'Success', description: 'Settlement processed successfully' });
      setShowProcessDialog(false);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHoldSettlement = async () => {
    if (!selectedSettlement || !user || !holdReason) return;
    setIsProcessing(true);
    
    try {
      await holdSettlement(selectedSettlement.id, user.id, holdReason);
      toast({ title: 'Success', description: 'Settlement placed on hold' });
      setShowHoldDialog(false);
      setHoldReason('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseSettlement = async (settlement: SellerSettlement) => {
    if (!user) return;
    
    try {
      await releaseSettlement(settlement.id, user.id);
      toast({ title: 'Success', description: 'Settlement released for processing' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredSettlements = settlements.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.seller?.name?.toLowerCase().includes(search) ||
      s.order_id.toLowerCase().includes(search) ||
      s.seller_order_id.toLowerCase().includes(search)
    );
  });

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Escrow & Settlements</h1>
          <p className="text-muted-foreground">Manage marketplace escrow funds and seller settlements</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Escrow Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {(summary?.totalEscrowBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total funds held in escrow</p>
          </CardContent>
        </Card>

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
                {(summary?.pendingSettlements || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting fulfillment criteria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Ready to Settle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-blue-600">
                {(summary?.eligibleForSettlement || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Eligible for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Commission (MTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-green-600">
                {(summary?.totalCommissionEarned || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform earnings this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Disclaimer */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Building2 className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Escrow Model:</strong> Buyer payments are held in the platform's nodal account. 
          Settlements are released to sellers after order acceptance, invoice upload, and shipment/delivery confirmation.
          Platform commission and TCS are deducted before settlement.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="settlements">
        <TabsList>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="settlements" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by seller, order ID..."
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
                    <SelectItem value="eligible">Eligible</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settlements Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No settlements found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSettlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{settlement.seller?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{settlement.seller?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs">{settlement.order_id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {settlement.order?.buyer_company_name || 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{settlement.gross_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ₹{settlement.platform_commission.toLocaleString('en-IN')}
                          <span className="text-xs ml-1">({settlement.commission_rate}%)</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ₹{settlement.net_payable.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={settlement.order_accepted ? "default" : "outline"} className="text-xs">
                              Accepted
                            </Badge>
                            <Badge variant={settlement.invoice_uploaded ? "default" : "outline"} className="text-xs">
                              Invoice
                            </Badge>
                            <Badge variant={settlement.shipment_confirmed ? "default" : "outline"} className="text-xs">
                              Shipped
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[settlement.status]}>
                            {settlement.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {settlement.status === 'eligible' && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowProcessDialog(true);
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Settle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSettlement(settlement);
                                  setShowHoldDialog(true);
                                }}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {settlement.status === 'on_hold' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReleaseSettlement(settlement)}
                            >
                              Release
                            </Button>
                          )}
                          {settlement.status === 'completed' && settlement.settled_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(settlement.settled_at), 'dd MMM yyyy')}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Money movements in and out of escrow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
                ) : (
                  transactions.map((tx) => {
                    const typeInfo = transactionTypeLabels[tx.transaction_type] || {
                      label: tx.transaction_type,
                      color: 'text-gray-600',
                      icon: <FileText className="h-4 w-4" />
                    };
                    const isCredit = ['buyer_payment'].includes(tx.transaction_type);
                    
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <p className="font-medium">{typeInfo.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.description || `Order: ${tx.order_id?.slice(0, 8)}...`}
                            </p>
                            {tx.reference_number && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Ref: {tx.reference_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                            {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Settlement Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Settlement</DialogTitle>
            <DialogDescription>
              Release funds to seller after deducting platform commission and TCS.
            </DialogDescription>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium">{selectedSettlement.seller?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Amount</span>
                  <span>₹{selectedSettlement.gross_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Platform Commission ({selectedSettlement.commission_rate}%)</span>
                  <span>-₹{selectedSettlement.platform_commission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>TCS ({selectedSettlement.tcs_rate}%)</span>
                  <span>-₹{selectedSettlement.tcs_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-green-600">
                  <span>Net Payable</span>
                  <span>₹{selectedSettlement.net_payable.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will mark the settlement as completed and record the payout. 
                  Actual bank transfer must be done separately.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessSettlement} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Confirm Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Settlement Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hold Settlement</DialogTitle>
            <DialogDescription>
              Prevent this settlement from being processed. Provide a reason for the hold.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Hold</label>
              <Textarea
                placeholder="Enter reason..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleHoldSettlement} 
              disabled={isProcessing || !holdReason}
            >
              {isProcessing ? 'Processing...' : 'Place on Hold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEscrow;
