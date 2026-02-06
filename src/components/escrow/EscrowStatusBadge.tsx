import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, CheckCircle, AlertCircle, Wallet, Ban } from 'lucide-react';

interface EscrowStatusBadgeProps {
  status: string | null | undefined;
  showTooltip?: boolean;
}

const statusConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
  description: string;
}> = {
  pending: {
    label: 'Pending',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
    description: 'Payment not yet received or verified',
  },
  received: {
    label: 'In Escrow',
    variant: 'secondary',
    icon: <Wallet className="h-3 w-3" />,
    description: 'Payment received and held in escrow',
  },
  partially_settled: {
    label: 'Partially Settled',
    variant: 'secondary',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'Some seller orders have been settled',
  },
  fully_settled: {
    label: 'Settled',
    variant: 'default',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'All seller orders have been settled',
  },
  refunded: {
    label: 'Refunded',
    variant: 'destructive',
    icon: <Ban className="h-3 w-3" />,
    description: 'Payment has been refunded to buyer',
  },
};

const EscrowStatusBadge: React.FC<EscrowStatusBadgeProps> = ({ 
  status, 
  showTooltip = true 
}) => {
  const config = statusConfig[status || 'pending'] || statusConfig.pending;

  const badge = (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EscrowStatusBadge;
