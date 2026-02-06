import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  Wallet, 
  FileText, 
  Truck,
  ArrowRight
} from 'lucide-react';

const escrowSteps = [
  {
    id: 'payment',
    title: 'Buyer Payment',
    description: 'Buyer makes single payment for all sellers',
    icon: Wallet,
  },
  {
    id: 'escrow',
    title: 'Escrow Hold',
    description: 'Funds held in platform nodal account',
    icon: Building2,
  },
  {
    id: 'fulfill',
    title: 'Seller Fulfillment',
    description: 'Sellers accept orders, upload invoices, ship',
    icon: Truck,
  },
  {
    id: 'settle',
    title: 'Settlement',
    description: 'Funds released to sellers after milestones',
    icon: CheckCircle,
  },
];

interface EscrowFlowExplainerProps {
  variant?: 'compact' | 'full';
  showTitle?: boolean;
}

const EscrowFlowExplainer: React.FC<EscrowFlowExplainerProps> = ({ 
  variant = 'compact',
  showTitle = true 
}) => {
  if (variant === 'compact') {
    return (
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Building2 className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Escrow Payment:</strong> Buyer pays once → Funds held in escrow → 
          Sellers fulfill orders → Settlements released after delivery. 
          Platform commission & TCS deducted at settlement.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            How Escrow Payments Work
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
          {escrowSteps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < escrowSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0">Buyer</Badge>
            <span className="text-muted-foreground">
              Makes one payment, receives receipts from sellers
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0">Seller</Badge>
            <span className="text-muted-foreground">
              Issues GST invoice, receives settlement after delivery
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0">Platform</Badge>
            <span className="text-muted-foreground">
              Holds funds, deducts 2.5% commission + 1% TCS
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EscrowFlowExplainer;
