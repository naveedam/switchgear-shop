
export type OrderStatus = 
  | 'pending_payment' 
  | 'processing' 
  | 'shipped' 
  | 'delivered'
  | 'canceled'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingDetails {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  method: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippingCost: number;
}

export interface PaymentDetails {
  method: 'credit_card' | 'wire_transfer' | 'purchase_order';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingDetails: ShippingDetails;
  paymentDetails: PaymentDetails;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
