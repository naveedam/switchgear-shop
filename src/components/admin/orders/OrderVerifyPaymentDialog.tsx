import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, IndianRupee, Building2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { recordBuyerPayment } from '@/services/escrowService';

interface OrderVerifyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    total_amount: number;
    payment_reference: string | null;
    payment_status: string | null;
    escrow_status?: string | null;
    buyer_company_name: string | null;
    buyer_gstin: string | null;
    created_at: string;
  } | null;
  onVerified: () => void;
}

const OrderVerifyPaymentDialog: React.FC<OrderVerifyPaymentDialogProps> = ({
  open,
  onOpenChange,
  order,
  onVerified
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

  const isAlreadyVerified = order.escrow_status === 'received' || order.payment_status === 'completed';

  const handleVerifyPayment = async () => {
    if (!user || !order.payment_reference) return;
    setIsProcessing(true);

    try {
      await recordBuyerPayment(
        order.id,
        order.total_amount,
        order.payment_reference,
        user.id
      );
      
      toast({ 
        title: 'Payment Verified', 
        description: 'Funds have been marked as received in escrow. Seller settlements will be triggered upon fulfillment.' 
      });
      onVerified();
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to verify payment', 
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Verify Payment
          </DialogTitle>
          <DialogDescription>
            Confirm receipt of payment into escrow account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Details */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono">{order.id.slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Buyer</span>
              <span>{order.buyer_company_name || 'N/A'}</span>
            </div>
            {order.buyer_gstin && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GSTIN</span>
                <span className="font-mono">{order.buyer_gstin}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Date</span>
              <span>{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Amount</span>
              <span className="text-xl font-bold text-primary">
                ₹{order.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Reference */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Payment Reference (UTR)</span>
            </div>
            <p className="font-mono text-lg">{order.payment_reference || 'Not provided'}</p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Status</span>
            <Badge variant={isAlreadyVerified ? 'default' : 'outline'}>
              {isAlreadyVerified ? 'Verified' : 'Pending Verification'}
            </Badge>
          </div>

          {isAlreadyVerified ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                This payment has already been verified and funds are in escrow.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Before verifying:</strong> Confirm that the payment has been received 
                in the bank account. This action will mark funds as received in escrow and 
                enable seller settlements after fulfillment.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isAlreadyVerified && (
            <Button 
              onClick={handleVerifyPayment} 
              disabled={isProcessing || !order.payment_reference}
            >
              {isProcessing ? 'Verifying...' : 'Confirm Payment Received'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderVerifyPaymentDialog;
