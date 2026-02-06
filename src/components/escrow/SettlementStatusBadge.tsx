import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, CheckCircle, Loader2, Pause, Ban } from 'lucide-react';

interface SettlementStatusBadgeProps {
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
    description: 'Waiting for fulfillment milestones',
  },
  eligible: {
    label: 'Eligible',
    variant: 'secondary',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'Ready for settlement, awaiting admin approval',
  },
  processing: {
    label: 'Processing',
    variant: 'secondary',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    description: 'Settlement is being processed',
  },
  completed: {
    label: 'Settled',
    variant: 'default',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'Funds have been released to seller',
  },
  on_hold: {
    label: 'On Hold',
    variant: 'destructive',
    icon: <Pause className="h-3 w-3" />,
    description: 'Settlement is on hold - contact support',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    icon: <Ban className="h-3 w-3" />,
    description: 'Settlement was cancelled',
  },
};

const SettlementStatusBadge: React.FC<SettlementStatusBadgeProps> = ({ 
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

export default SettlementStatusBadge;
