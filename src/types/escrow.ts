// Escrow and Settlement Types for B2B Marketplace

export type TransactionType = 
  | 'buyer_payment'
  | 'seller_settlement'
  | 'platform_commission'
  | 'tcs_deduction'
  | 'refund_buyer'
  | 'adjustment'
  | 'reversal';

export type SettlementStatus = 
  | 'pending'
  | 'eligible'
  | 'processing'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type EscrowStatus = 
  | 'pending'
  | 'received'
  | 'partially_settled'
  | 'fully_settled'
  | 'refunded';

export interface EscrowAccount {
  id: string;
  account_type: 'main' | 'reserve';
  balance: number;
  pending_settlements: number;
  last_reconciled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowTransaction {
  id: string;
  order_id: string | null;
  seller_order_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  reference_type: string | null;
  reference_number: string | null;
  description: string | null;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
}

export interface SellerSettlement {
  id: string;
  seller_order_id: string;
  seller_id: string;
  order_id: string;
  
  // Amounts
  gross_amount: number;
  platform_commission: number;
  commission_rate: number;
  tcs_amount: number;
  tcs_rate: number;
  other_deductions: number;
  net_payable: number;
  
  // Status
  status: SettlementStatus;
  eligibility_met_at: string | null;
  
  // Eligibility flags
  order_accepted: boolean;
  invoice_uploaded: boolean;
  shipment_confirmed: boolean;
  delivery_confirmed: boolean;
  hold_period_elapsed: boolean;
  
  // Settlement details
  settlement_batch_id: string | null;
  settlement_reference: string | null;
  settled_at: string | null;
  settled_by: string | null;
  
  // Bank details
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  
  admin_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Joined data
  seller?: {
    id: string;
    name: string;
    email: string;
    gstin: string | null;
  };
  seller_order?: {
    id: string;
    status: string;
    seller_invoice_number: string | null;
  };
  order?: {
    id: string;
    status: string;
    buyer_company_name: string | null;
  };
}

export interface PlatformCommissionInvoice {
  id: string;
  invoice_number: string;
  seller_id: string;
  settlement_id: string | null;
  period_start: string;
  period_end: string;
  total_order_value: number;
  commission_amount: number;
  commission_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'paid';
  issued_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementSummary {
  totalEscrowBalance: number;
  pendingSettlements: number;
  eligibleForSettlement: number;
  settledThisMonth: number;
  totalCommissionEarned: number;
}

export interface SellerSettlementSummary {
  pendingAmount: number;
  eligibleAmount: number;
  settledAmount: number;
  totalCommissionPaid: number;
  totalTcsDeducted: number;
}
