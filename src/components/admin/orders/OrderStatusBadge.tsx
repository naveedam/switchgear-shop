
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusStyles: Record<OrderStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  canceled: 'bg-red-100 text-red-800 border-red-300',
  refunded: 'bg-gray-100 text-gray-800 border-gray-300',
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const formattedStatus = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <Badge variant="outline" className={cn('capitalize font-medium', statusStyles[status])}>
      {formattedStatus}
    </Badge>
  );
};

export default OrderStatusBadge;
