 import { useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { BomUpload, BomItem, RFQ, RFQItem, SellerQuote, SellerQuoteItem, ParsedBomRow } from '@/types/rfq';
 import { useToast } from '@/hooks/use-toast';
 
 export const useRfqService = () => {
   const [isLoading, setIsLoading] = useState(false);
   const { toast } = useToast();
 
   // ============ BOM Operations ============
   const createBom = async (buyerId: string, filename: string, projectName?: string): Promise<BomUpload | null> => {
     const { data, error } = await supabase
       .from('bom_uploads')
       .insert({ buyer_id: buyerId, filename, project_name: projectName, status: 'draft' })
       .select()
       .single();
 
     if (error) {
       toast({ title: 'Error', description: error.message, variant: 'destructive' });
       return null;
     }
     return data as BomUpload;
   };
 
   const saveBomItems = async (bomId: string, items: ParsedBomRow[]): Promise<boolean> => {
     const bomItems = items.map(item => ({
       bom_id: bomId,
       line_number: item.lineNumber,
       description: item.description,
       quantity: item.quantity,
       unit: item.unit || 'Nos',
       preferred_brand: item.preferredBrand,
       rating_specs: item.ratingSpecs,
       target_price: item.targetPrice,
       match_status: 'unmatched' as const,
     }));
 
     const { error } = await supabase.from('bom_items').insert(bomItems);
 
     if (error) {
       toast({ title: 'Error', description: error.message, variant: 'destructive' });
       return false;
     }
 
     // Update BOM counts
     await supabase
       .from('bom_uploads')
       .update({ total_items: items.length, status: 'ready' })
       .eq('id', bomId);
 
     return true;
   };
 
   const getBomWithItems = async (bomId: string): Promise<{ bom: BomUpload; items: BomItem[] } | null> => {
     const [bomResult, itemsResult] = await Promise.all([
       supabase.from('bom_uploads').select('*').eq('id', bomId).single(),
       supabase.from('bom_items').select('*, matched_product:products(id, name, price, vendor_id)').eq('bom_id', bomId).order('line_number'),
     ]);
 
     if (bomResult.error || itemsResult.error) return null;
     return { bom: bomResult.data as BomUpload, items: itemsResult.data as BomItem[] };
   };
 
   const getUserBoms = async (buyerId: string): Promise<BomUpload[]> => {
     const { data, error } = await supabase
       .from('bom_uploads')
       .select('*')
       .eq('buyer_id', buyerId)
       .order('created_at', { ascending: false });
 
     if (error) return [];
     return data as BomUpload[];
   };
 
   const matchBomItemToProduct = async (bomItemId: string, productId: string): Promise<boolean> => {
     const { error } = await supabase
       .from('bom_items')
       .update({ matched_product_id: productId, match_status: 'manual' })
       .eq('id', bomItemId);
 
     return !error;
   };
 
   // ============ RFQ Operations ============
   const createRfqFromBom = async (
     buyerId: string,
     bomId: string,
     title: string,
     requiredDeliveryDate?: string,
     notes?: string
   ): Promise<RFQ | null> => {
     setIsLoading(true);
     try {
       // Generate RFQ number
       const { data: rfqNumber } = await supabase.rpc('generate_rfq_number');
 
       // Get BOM items
       const { data: bomItems } = await supabase
         .from('bom_items')
         .select('*')
         .eq('bom_id', bomId);
 
       if (!bomItems || bomItems.length === 0) {
         toast({ title: 'Error', description: 'No items found in BOM', variant: 'destructive' });
         return null;
       }
 
       // Create RFQ
       const expiresAt = new Date();
       expiresAt.setDate(expiresAt.getDate() + 7);
 
       const { data: rfq, error: rfqError } = await supabase
         .from('rfqs')
         .insert({
           rfq_number: rfqNumber,
           buyer_id: buyerId,
           bom_id: bomId,
           title,
           status: 'open',
           required_delivery_date: requiredDeliveryDate,
           notes,
           expires_at: expiresAt.toISOString(),
           total_items: bomItems.length,
         })
         .select()
         .single();
 
       if (rfqError) throw rfqError;
 
       // Create RFQ items from BOM items
 
       // Create RFQ items from BOM items
       const rfqItems = bomItems.map((item) => ({
         rfq_id: rfq.id,
         bom_item_id: item.id,
         line_number: item.line_number,
         description: item.description,
         quantity: item.quantity,
         unit: item.unit,
         preferred_brand: item.preferred_brand,
         rating_specs: item.rating_specs,
         target_price: item.target_price,
         matched_product_id: item.matched_product_id,
       }));
 
       await supabase.from('rfq_items').insert(rfqItems);
 
       // Update BOM status
        await supabase.from('bom_uploads').update({ status: 'converted' }).eq('id', bomId);

        // Find and invite relevant sellers via auto-routing
        const routingResult = await inviteSellersToRfq(rfq.id);

        // Log audit
        await supabase.from('rfq_audit_log').insert({
          rfq_id: rfq.id,
          bom_id: bomId,
          action: 'rfq_created',
          actor_id: buyerId,
          actor_type: 'buyer',
          details: { title, ...routingResult },
        });

        toast({
          title: 'RFQ Created',
          description: `RFQ sent to ${routingResult.sellers_invited} verified sellers in ${routingResult.categories_detected.length || 'relevant'} categories.`,
        });
       return rfq as RFQ;
     } catch (error) {
       toast({ title: 'Error', description: 'Failed to create RFQ', variant: 'destructive' });
       return null;
     } finally {
       setIsLoading(false);
     }
   };
 
    const inviteSellersToRfq = async (rfqId: string, projectId?: string): Promise<{ sellers_invited: number; categories_detected: string[] }> => {
      try {
        const { data, error } = await supabase.functions.invoke('route-rfq-sellers', {
          body: { rfqId, projectId },
        });

        if (error) {
          console.error('Auto-routing failed, falling back to manual:', error);
          // Fallback: invite all active vendors
          const { data: sellers } = await supabase
            .from('companies')
            .select('id')
            .eq('is_vendor', true)
            .eq('status', 'active');

          if (sellers && sellers.length > 0) {
            const invitations = sellers.slice(0, 8).map(seller => ({
              rfq_id: rfqId,
              seller_id: seller.id,
              status: 'pending' as const,
              routing_method: 'fallback',
            }));
            await supabase.from('rfq_seller_invitations').insert(invitations);
          }
          return { sellers_invited: sellers?.length || 0, categories_detected: [] };
        }

        return {
          sellers_invited: data?.sellers_invited || 0,
          categories_detected: data?.categories_detected || [],
        };
      } catch (err) {
        console.error('inviteSellersToRfq error:', err);
        return { sellers_invited: 0, categories_detected: [] };
      }
    };
 
   const getUserRfqs = async (buyerId: string): Promise<RFQ[]> => {
     const { data, error } = await supabase
       .from('rfqs')
       .select('*')
       .eq('buyer_id', buyerId)
       .order('created_at', { ascending: false });
 
     if (error) return [];
     return data as RFQ[];
   };
 
   const getRfqWithDetails = async (rfqId: string): Promise<{
     rfq: RFQ;
     items: RFQItem[];
     quotes: SellerQuote[];
   } | null> => {
     const [rfqResult, itemsResult, quotesResult] = await Promise.all([
       supabase.from('rfqs').select('*').eq('id', rfqId).single(),
       supabase.from('rfq_items').select('*').eq('rfq_id', rfqId).order('line_number'),
       supabase.from('seller_quotes')
         .select('*, seller:companies(id, name, email, gstin), items:seller_quote_items(*)')
         .eq('rfq_id', rfqId)
         .neq('status', 'draft'),
     ]);
 
     if (rfqResult.error) return null;
 
     return {
       rfq: rfqResult.data as RFQ,
       items: (itemsResult.data || []) as RFQItem[],
       quotes: (quotesResult.data || []) as SellerQuote[],
     };
   };
 
   // ============ Seller Quote Operations ============
   const getSellerRfqInvitations = async (sellerId: string): Promise<any[]> => {
     const { data, error } = await supabase
       .from('rfq_seller_invitations')
       .select('*, rfq:rfqs(*)')
       .eq('seller_id', sellerId)
       .in('status', ['pending', 'viewed'])
       .order('invited_at', { ascending: false });
 
     if (error) return [];
     return data;
   };
 
   const getSellerQuotes = async (sellerId: string): Promise<SellerQuote[]> => {
     const { data, error } = await supabase
       .from('seller_quotes')
       .select('*, rfq:rfqs(*)')
       .eq('seller_id', sellerId)
       .order('created_at', { ascending: false });
 
     if (error) return [];
     return data as SellerQuote[];
   };
 
   const createOrGetQuote = async (rfqId: string, sellerId: string): Promise<SellerQuote | null> => {
     // Check if quote exists
     const { data: existing } = await supabase
       .from('seller_quotes')
       .select('*')
       .eq('rfq_id', rfqId)
       .eq('seller_id', sellerId)
       .single();
 
     if (existing) return existing as SellerQuote;
 
     // Generate quote number
     const { data: quoteNumber } = await supabase.rpc('generate_quote_number', { p_seller_id: sellerId });
 
     // Create new quote
     const expiresAt = new Date();
     expiresAt.setDate(expiresAt.getDate() + 15);
 
     const { data, error } = await supabase
       .from('seller_quotes')
       .insert({
         rfq_id: rfqId,
         seller_id: sellerId,
         quote_number: quoteNumber,
         status: 'draft',
         expires_at: expiresAt.toISOString(),
       })
       .select()
       .single();
 
     if (error) return null;
 
      // Mark invitation as viewed and track notification opened
      const now = new Date().toISOString();
      await supabase
        .from('rfq_seller_invitations')
        .update({ status: 'viewed', viewed_at: now, notification_opened_at: now })
        .eq('rfq_id', rfqId)
        .eq('seller_id', sellerId);
 
     return data as SellerQuote;
   };
 
   const saveQuoteItems = async (
     quoteId: string,
     sellerId: string,
     items: Partial<SellerQuoteItem>[]
   ): Promise<boolean> => {
     // Delete existing items
     await supabase.from('seller_quote_items').delete().eq('quote_id', quoteId);
 
     // Insert new items
     const quoteItems = items.map(item => ({
       quote_id: quoteId,
       rfq_item_id: item.rfq_item_id,
       product_id: item.product_id,
       quoted_quantity: item.quoted_quantity,
       available_quantity: item.available_quantity,
       unit_price: item.unit_price,
       tax_rate: item.tax_rate || 18,
       tax_amount: (item.unit_price || 0) * (item.quoted_quantity || 0) * ((item.tax_rate || 18) / 100),
       total_price: (item.unit_price || 0) * (item.quoted_quantity || 0) * (1 + (item.tax_rate || 18) / 100),
       lead_time_days: item.lead_time_days,
       brand: item.brand,
       model_number: item.model_number,
       notes: item.notes,
       is_available: item.is_available ?? true,
     }));
 
     const { error } = await supabase.from('seller_quote_items').insert(quoteItems);
     return !error;
   };
 
    const submitQuote = async (quoteId: string, sellerId: string, rfqId: string): Promise<boolean> => {
      // Calculate totals
      const { data: items } = await supabase
        .from('seller_quote_items')
        .select('total_price, tax_amount')
        .eq('quote_id', quoteId);

      const totalAmount = items?.reduce((sum, i) => sum + (i.total_price - i.tax_amount), 0) || 0;
      const taxAmount = items?.reduce((sum, i) => sum + i.tax_amount, 0) || 0;
      const grandTotal = totalAmount + taxAmount;

      const { error } = await supabase
        .from('seller_quotes')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          total_amount: totalAmount,
          tax_amount: taxAmount,
          grand_total: grandTotal,
        })
        .eq('id', quoteId);

      if (error) return false;

      // Update invitation status and record first_quote_at
      const now = new Date().toISOString();
      await supabase
        .from('rfq_seller_invitations')
        .update({
          status: 'responded',
          responded_at: now,
          first_quote_at: now,
        })
        .eq('rfq_id', rfqId)
        .eq('seller_id', sellerId)
        .is('first_quote_at', null); // Only set if not already set

      // Also update status for ones that already have first_quote_at
      await supabase
        .from('rfq_seller_invitations')
        .update({ status: 'responded', responded_at: now })
        .eq('rfq_id', rfqId)
        .eq('seller_id', sellerId);

      // Update RFQ status
      await supabase.from('rfqs').update({ status: 'partially_quoted' }).eq('id', rfqId);

      // Log audit
      await supabase.from('rfq_audit_log').insert({
        rfq_id: rfqId,
        quote_id: quoteId,
        action: 'quote_submitted',
        actor_id: sellerId,
        actor_type: 'seller',
        details: { grandTotal },
      });

      return true;
    };
 
   // ============ Quote Acceptance & Order Conversion ============
   const acceptQuoteItems = async (
     rfqId: string,
     buyerId: string,
     selections: { quoteItemId: string; quoteId: string; sellerId: string }[]
   ): Promise<string | null> => {
     setIsLoading(true);
     try {
       // Group by seller
       const sellerGroups = new Map<string, typeof selections>();
       for (const sel of selections) {
         const existing = sellerGroups.get(sel.sellerId) || [];
         existing.push(sel);
         sellerGroups.set(sel.sellerId, existing);
       }
 
       // Calculate total order amount
       let totalOrderAmount = 0;
       const quoteItemIds = selections.map(s => s.quoteItemId);
       
       const { data: quoteItems } = await supabase
         .from('seller_quote_items')
         .select('*')
         .in('id', quoteItemIds);
 
       if (!quoteItems) throw new Error('No quote items found');
 
       totalOrderAmount = quoteItems.reduce((sum, item) => sum + item.total_price, 0);
 
       // Create parent order
       const { data: order, error: orderError } = await supabase
         .from('orders')
         .insert({
           buyer_id: buyerId,
           rfq_id: rfqId,
           total_amount: totalOrderAmount,
           status: 'pending',
           is_multi_seller: sellerGroups.size > 1,
         })
         .select()
         .single();
 
       if (orderError) throw orderError;
 
       // Create seller orders
       for (const [sellerId, items] of sellerGroups) {
         const sellerItems = quoteItems.filter(qi => items.some(i => i.quoteItemId === qi.id));
         const sellerTotal = sellerItems.reduce((sum, item) => sum + item.total_price, 0);
         const quoteId = items[0].quoteId;
 
         const { data: sellerOrder } = await supabase
           .from('seller_orders')
           .insert({
             order_id: order.id,
             seller_id: sellerId,
             rfq_id: rfqId,
             quote_id: quoteId,
             total_amount: sellerTotal,
             status: 'pending',
           })
           .select()
           .single();
 
         if (sellerOrder) {
           // Create order items
           const orderItems = sellerItems.map(qi => ({
             order_id: order.id,
             seller_order_id: sellerOrder.id,
             product_id: qi.product_id,
             quantity: qi.quoted_quantity,
             unit_price: qi.unit_price,
             total_price: qi.total_price,
           }));
 
           await supabase.from('order_items').insert(orderItems);
         }
 
         // Update quote status
         await supabase
           .from('seller_quotes')
           .update({ status: 'accepted' })
           .eq('id', quoteId);
       }
 
       // Update quote item statuses
       await supabase
         .from('seller_quote_items')
         .update({ status: 'accepted' })
         .in('id', quoteItemIds);
 
       // Update RFQ status
       await supabase.from('rfqs').update({ status: 'converted' }).eq('id', rfqId);
 
       // Log audit
       await supabase.from('rfq_audit_log').insert({
         rfq_id: rfqId,
         order_id: order.id,
         action: 'order_created',
         actor_id: buyerId,
         actor_type: 'buyer',
         details: {
         totalAmount: totalOrderAmount,
           sellerCount: sellerGroups.size,
         },
       });
 
       toast({ title: 'Success', description: 'Order created successfully' });
       return order.id;
     } catch (error) {
       toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
       return null;
     } finally {
       setIsLoading(false);
     }
   };
 
   
   return {
     isLoading,
     // BOM
     createBom,
     saveBomItems,
     getBomWithItems,
     getUserBoms,
     matchBomItemToProduct,
     // RFQ
     createRfqFromBom,
     getUserRfqs,
     getRfqWithDetails,
     // Seller
     getSellerRfqInvitations,
     getSellerQuotes,
     createOrGetQuote,
     saveQuoteItems,
     submitQuote,
     // Order
     acceptQuoteItems,
   };
 };