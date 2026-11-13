// Multi-seller order types for B2B marketplace

export type SellerOrderStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface SellerOrder {
  id: string;
  order_id: string;
  seller_id: string;
  status: SellerOrderStatus;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  seller_invoice_number: string | null;
  seller_invoice_url: string | null;
  seller_invoice_uploaded_at: string | null;
  eway_bill_number: string | null;
  eway_bill_url: string | null;
  eway_bill_date: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier_name: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  seller_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  seller?: {
    id: string;
    name: string;
    email: string;
    gstin: string | null;
    state_code: string | null;
  };
  items?: SellerOrderItem[];
}

export interface SellerOrderItem {
  id: string;
  seller_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    Images: string | null;
    hsn_code: string | null;
  };
}

export interface CartItemWithSeller {
  productId: string;
  name: string;
  price: number;
  /** Catalogue price before quantity breaks / account discount. */
  listPrice?: number;
  quantity: number;
  featuredImage: string;
  sellerId: string;
  sellerName: string;
}

export interface GroupedCartBySeller {
  sellerId: string;
  sellerName: string;
  items: CartItemWithSeller[];
  subtotal: number;
}

export interface MultiSellerOrderSummary {
  orderId: string;
  buyerId: string;
  buyerGstin: string | null;
  totalAmount: number;
  sellerOrders: SellerOrder[];
  createdAt: string;
}
