
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Truck, Edit } from 'lucide-react';
import { Order } from '@/types/order';
import { useToast } from '@/components/ui/use-toast';

interface OrderActionsProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

const OrderActions: React.FC<OrderActionsProps> = ({ order, onViewDetails }) => {
    const { toast } = useToast();

    const handleAction = (action: string) => {
        toast({
            title: "Action Triggered",
            description: `${action} on order ${order.id}`,
        })
    }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onViewDetails(order)}>
          <Eye className="mr-2 h-4 w-4" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('Update Status')}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Update Status</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction('Track Order')}>
          <Truck className="mr-2 h-4 w-4" />
          <span>Track Order</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderActions;
