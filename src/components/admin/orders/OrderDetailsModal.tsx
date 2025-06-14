
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Order } from '@/types/order';
import { format } from 'date-fns';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Order Details: {order.id}</DialogTitle>
          <DialogDescription>
            Placed on {format(order.createdAt, 'MMM d, yyyy, h:mm a')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm">Customer</h3>
              <p className="text-sm text-muted-foreground">{order.buyerName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Seller</h3>
              <p className="text-sm text-muted-foreground">{order.sellerName}</p>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Shipping Address</h3>
            <div className="text-sm text-muted-foreground">
                <p>{order.shippingDetails.address.street}</p>
                <p>{order.shippingDetails.address.city}, {order.shippingDetails.address.state} {order.shippingDetails.address.zipCode}</p>
                <p>{order.shippingDetails.address.country}</p>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Payment Details</h3>
            <div className="text-sm text-muted-foreground">
                <p>Method: <span className="capitalize">{order.paymentDetails.method.replace('_', ' ')}</span></p>
                <p>Status: <span className="capitalize">{order.paymentDetails.status}</span></p>
                <p>Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.paymentDetails.amount)}</p>
            </div>
          </div>
           <div className="space-y-1">
            <h3 className="font-semibold text-sm">Order Summary</h3>
            <div className="text-sm text-muted-foreground">
                <p>Subtotal: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.subtotal)}</p>
                <p>Tax: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.tax)}</p>
                <p>Shipping: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.shippingDetails.shippingCost)}</p>
                <p className="font-bold text-foreground">Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalAmount)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
