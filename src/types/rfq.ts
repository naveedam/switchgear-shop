 export interface BomUpload {
   id: string;
   buyer_id: string;
   filename: string;
   file_url?: string;
   status: 'draft' | 'processing' | 'ready' | 'converted' | 'cancelled';
   total_items: number;
   matched_items: number;
   project_name?: string;
   notes?: string;
   created_at: string;
   updated_at: string;
 }
 
 export interface BomItem {
   id: string;
   bom_id: string;
   line_number: number;
   description: string;
   quantity: number;
   unit: string;
   preferred_brand?: string;
   rating_specs?: string;
   target_price?: number;
   matched_product_id?: string;
   match_status: 'matched' | 'partial' | 'unmatched' | 'manual';
   match_confidence: number;
   buyer_notes?: string;
   created_at: string;
   // Joined fields
   matched_product?: {
     id: string;
     name: string;
     price: number;
     vendor_id: string;
   };
 }
 
 export interface RFQ {
   id: string;
   rfq_number: string;
   buyer_id: string;
   bom_id?: string;
   title: string;
   status: 'draft' | 'open' | 'quoted' | 'partially_quoted' | 'closed' | 'converted' | 'cancelled' | 'expired';
   required_delivery_date?: string;
   validity_days: number;
   expires_at?: string;
   notes?: string;
   reference_documents?: string[];
   total_items: number;
   quoted_items: number;
   created_at: string;
   updated_at: string;
 }
 
 export interface RFQItem {
   id: string;
   rfq_id: string;
   bom_item_id?: string;
   line_number: number;
   description: string;
   quantity: number;
   unit: string;
   preferred_brand?: string;
   rating_specs?: string;
   target_price?: number;
   matched_product_id?: string;
   category?: string;
   status: 'open' | 'quoted' | 'accepted' | 'rejected';
   created_at: string;
 }
 
 export interface RFQSellerInvitation {
   id: string;
   rfq_id: string;
   seller_id: string;
   invited_at: string;
   viewed_at?: string;
   responded_at?: string;
   status: 'pending' | 'viewed' | 'responded' | 'declined' | 'expired';
   decline_reason?: string;
   // Joined
   seller?: {
     id: string;
     name: string;
     email: string;
   };
 }
 
 export interface SellerQuote {
   id: string;
   rfq_id: string;
   seller_id: string;
   quote_number: string;
   status: 'draft' | 'submitted' | 'revised' | 'accepted' | 'partially_accepted' | 'rejected' | 'expired';
   total_amount: number;
   tax_amount: number;
   grand_total: number;
   validity_days: number;
   delivery_terms?: string;
   payment_terms?: string;
   notes?: string;
   submitted_at?: string;
   expires_at?: string;
   created_at: string;
   updated_at: string;
   // Joined
   seller?: {
     id: string;
     name: string;
     email: string;
     gstin?: string;
   };
   items?: SellerQuoteItem[];
 }
 
 export interface SellerQuoteItem {
   id: string;
   quote_id: string;
   rfq_item_id: string;
   product_id?: string;
   quoted_quantity: number;
   available_quantity?: number;
   unit_price: number;
   tax_rate: number;
   tax_amount: number;
   total_price: number;
   lead_time_days?: number;
   brand?: string;
   model_number?: string;
   notes?: string;
   is_available: boolean;
   status: 'quoted' | 'accepted' | 'rejected';
   created_at: string;
   // Joined
   rfq_item?: RFQItem;
 }
 
 export interface ParsedBomRow {
   lineNumber: number;
   description: string;
   quantity: number;
   unit?: string;
   preferredBrand?: string;
   ratingSpecs?: string;
   targetPrice?: number;
 }