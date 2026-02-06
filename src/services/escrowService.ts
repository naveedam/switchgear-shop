// Escrow and Settlement Service for B2B Marketplace

import { supabase } from '@/integrations/supabase/client';
import { 
  EscrowTransaction, 
  SellerSettlement, 
  SettlementSummary,
  SellerSettlementSummary 
} from '@/types/escrow';

// Admin Functions

export async function getEscrowBalance(): Promise<{ balance: number; pending: number }> {
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('balance, pending_settlements')
    .eq('account_type', 'main')
    .single();

  if (error) throw error;
  return { 
    balance: data?.balance || 0, 
    pending: data?.pending_settlements || 0 
  };
}

export async function getSettlementSummary(): Promise<SettlementSummary> {
  // Get escrow balance
  const escrowData = await getEscrowBalance();
  
  // Get pending settlements count and amount
  const { data: pendingData } = await supabase
    .from('seller_settlements')
    .select('net_payable')
    .eq('status', 'pending');
  
  const pendingSettlements = pendingData?.reduce((sum, s) => sum + Number(s.net_payable), 0) || 0;
  
  // Get eligible settlements
  const { data: eligibleData } = await supabase
    .from('seller_settlements')
    .select('net_payable')
    .eq('status', 'eligible');
  
  const eligibleForSettlement = eligibleData?.reduce((sum, s) => sum + Number(s.net_payable), 0) || 0;
  
  // Get settled this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data: settledData } = await supabase
    .from('seller_settlements')
    .select('net_payable, platform_commission')
    .eq('status', 'completed')
    .gte('settled_at', startOfMonth.toISOString());
  
  const settledThisMonth = settledData?.reduce((sum, s) => sum + Number(s.net_payable), 0) || 0;
  const totalCommissionEarned = settledData?.reduce((sum, s) => sum + Number(s.platform_commission), 0) || 0;
  
  return {
    totalEscrowBalance: escrowData.balance,
    pendingSettlements,
    eligibleForSettlement,
    settledThisMonth,
    totalCommissionEarned
  };
}

export async function getAllSettlements(filters?: {
  status?: string;
  sellerId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ settlements: SellerSettlement[]; total: number }> {
  let query = supabase
    .from('seller_settlements')
    .select(`
      *,
      seller:companies!seller_settlements_seller_id_fkey (
        id, name, email, gstin
      ),
      seller_order:seller_orders!seller_settlements_seller_order_id_fkey (
        id, status, seller_invoice_number
      ),
      order:orders!seller_settlements_order_id_fkey (
        id, status, buyer_company_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false }) as any;

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { 
    settlements: (data || []) as unknown as SellerSettlement[], 
    total: count || 0 
  };
}

export async function getEscrowTransactions(filters?: {
  orderId?: string;
  sellerOrderId?: string;
  type?: string;
  limit?: number;
}): Promise<EscrowTransaction[]> {
  let query = supabase
    .from('escrow_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.orderId) {
    query = query.eq('order_id', filters.orderId);
  }
  if (filters?.sellerOrderId) {
    query = query.eq('seller_order_id', filters.sellerOrderId);
  }
  if (filters?.type) {
    query = query.eq('transaction_type', filters.type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as unknown as EscrowTransaction[];
}

// Record buyer payment to escrow
export async function recordBuyerPayment(
  orderId: string,
  amount: number,
  referenceNumber: string,
  verifiedBy?: string
): Promise<void> {
  // Create escrow transaction
  const { error: txError } = await supabase
    .from('escrow_transactions')
    .insert({
      order_id: orderId,
      transaction_type: 'buyer_payment',
      amount: amount,
      reference_type: 'utr',
      reference_number: referenceNumber,
      description: `Payment received for order ${orderId}`,
      status: 'completed',
      created_by: verifiedBy
    } as any);

  if (txError) throw txError;

  // Update order escrow status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      escrow_status: 'received',
      escrow_amount: amount,
      escrow_received_at: new Date().toISOString(),
      payment_verified_at: new Date().toISOString(),
      payment_verified_by: verifiedBy,
      payment_status: 'completed'
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Log audit
  await supabase
    .from('settlement_audit_log')
    .insert({
      order_id: orderId,
      action: 'payment_received',
      amount: amount,
      performed_by: verifiedBy,
      details: { reference_number: referenceNumber }
    } as any);
}

// Process seller settlement
export async function processSettlement(
  settlementId: string,
  adminId: string,
  notes?: string
): Promise<void> {
  // Get settlement details
  const { data: settlement, error: fetchError } = await supabase
    .from('seller_settlements')
    .select('*, seller:companies!seller_settlements_seller_id_fkey(*)')
    .eq('id', settlementId)
    .single();

  if (fetchError || !settlement) throw new Error('Settlement not found');
  if (settlement.status !== 'eligible') throw new Error('Settlement not eligible for processing');

  // Update settlement status to processing
  const { error: updateError } = await supabase
    .from('seller_settlements')
    .update({ 
      status: 'processing',
      admin_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', settlementId);

  if (updateError) throw updateError;

  // Create settlement transaction
  const batchId = `SETTLE-${Date.now()}`;
  
  const { error: txError } = await supabase
    .from('escrow_transactions')
    .insert({
      order_id: settlement.order_id,
      seller_order_id: settlement.seller_order_id,
      transaction_type: 'seller_settlement',
      amount: settlement.net_payable,
      reference_type: 'settlement_id',
      reference_number: batchId,
      description: `Settlement to ${(settlement.seller as any)?.name || 'seller'}`,
      status: 'completed',
      created_by: adminId,
      metadata: {
        gross_amount: settlement.gross_amount,
        commission: settlement.platform_commission,
        tcs: settlement.tcs_amount
      }
    });

  if (txError) throw txError;

  // Record commission transaction
  if (settlement.platform_commission > 0) {
    await supabase
      .from('escrow_transactions')
      .insert({
        order_id: settlement.order_id,
        seller_order_id: settlement.seller_order_id,
        transaction_type: 'platform_commission',
        amount: settlement.platform_commission,
        reference_number: batchId,
        description: `Commission from settlement ${settlementId}`,
        status: 'completed',
        created_by: adminId
      });
  }

  // Mark settlement as completed
  const { error: completeError } = await supabase
    .from('seller_settlements')
    .update({ 
      status: 'completed',
      settlement_batch_id: batchId,
      settlement_reference: batchId,
      settled_at: new Date().toISOString(),
      settled_by: adminId,
      bank_account_number: (settlement.seller as any)?.bank_account_number,
      bank_ifsc: (settlement.seller as any)?.bank_ifsc,
      bank_name: (settlement.seller as any)?.bank_name
    })
    .eq('id', settlementId);

  if (completeError) throw completeError;

  // Update seller order
  await supabase
    .from('seller_orders')
    .update({
      settlement_status: 'settled',
      settled_at: new Date().toISOString(),
      settlement_amount: settlement.net_payable,
      platform_commission: settlement.platform_commission
    })
    .eq('id', settlement.seller_order_id);

  // Log audit
  await supabase
    .from('settlement_audit_log')
    .insert({
      settlement_id: settlementId,
      seller_order_id: settlement.seller_order_id,
      order_id: settlement.order_id,
      action: 'settlement_completed',
      previous_status: 'eligible',
      new_status: 'completed',
      amount: settlement.net_payable,
      performed_by: adminId,
      details: { batch_id: batchId, notes }
    });
}

// Hold settlement
export async function holdSettlement(
  settlementId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const { data: settlement } = await supabase
    .from('seller_settlements')
    .select('status')
    .eq('id', settlementId)
    .single();

  const previousStatus = settlement?.status;

  const { error } = await supabase
    .from('seller_settlements')
    .update({ 
      status: 'on_hold',
      admin_notes: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', settlementId);

  if (error) throw error;

  await supabase
    .from('settlement_audit_log')
    .insert({
      settlement_id: settlementId,
      action: 'settlement_held',
      previous_status: previousStatus,
      new_status: 'on_hold',
      performed_by: adminId,
      details: { reason }
    });
}

// Release held settlement
export async function releaseSettlement(
  settlementId: string,
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from('seller_settlements')
    .update({ 
      status: 'eligible',
      admin_notes: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', settlementId);

  if (error) throw error;

  await supabase
    .from('settlement_audit_log')
    .insert({
      settlement_id: settlementId,
      action: 'settlement_released',
      previous_status: 'on_hold',
      new_status: 'eligible',
      performed_by: adminId
    });
}

// Seller Functions

export async function getSellerSettlements(sellerId: string): Promise<SellerSettlement[]> {
  const { data, error } = await supabase
    .from('seller_settlements')
    .select(`
      *,
      seller_order:seller_orders!seller_settlements_seller_order_id_fkey (
        id, status, seller_invoice_number
      ),
      order:orders!seller_settlements_order_id_fkey (
        id, status, buyer_company_name
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as SellerSettlement[];
}

export async function getSellerSettlementSummary(sellerId: string): Promise<SellerSettlementSummary> {
  const { data: settlements } = await supabase
    .from('seller_settlements')
    .select('status, net_payable, platform_commission, tcs_amount')
    .eq('seller_id', sellerId);

  if (!settlements) {
    return {
      pendingAmount: 0,
      eligibleAmount: 0,
      settledAmount: 0,
      totalCommissionPaid: 0,
      totalTcsDeducted: 0
    };
  }

  return {
    pendingAmount: settlements
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + Number(s.net_payable), 0),
    eligibleAmount: settlements
      .filter(s => s.status === 'eligible')
      .reduce((sum, s) => sum + Number(s.net_payable), 0),
    settledAmount: settlements
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + Number(s.net_payable), 0),
    totalCommissionPaid: settlements
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + Number(s.platform_commission), 0),
    totalTcsDeducted: settlements
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + Number(s.tcs_amount), 0)
  };
}

export async function getSellerCommissionInvoices(sellerId: string) {
  const { data, error } = await supabase
    .from('platform_commission_invoices')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
