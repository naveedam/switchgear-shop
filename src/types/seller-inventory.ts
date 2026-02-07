export interface SellerProduct {
  id: string;
  seller_id: string;
  catalog_product_id: string;
  price: number;
  moq: number;
  stock: number;
  lead_time_days?: number;
  dispatch_location?: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'pending_approval';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  catalog_products?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    hsn_code?: string;
    suggested_price?: number;
    brands?: {
      name: string;
    };
  };
}

export interface ProductRequest {
  id: string;
  seller_id: string;
  brand_name: string;
  model_number: string;
  category?: string;
  subcategory?: string;
  description?: string;
  technical_specs?: Record<string, string>;
  datasheet_url?: string;
  additional_documents?: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'duplicate';
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  approved_catalog_product_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  companies?: {
    name: string;
    email: string;
  };
}

export interface BulkUpload {
  id: string;
  seller_id: string;
  filename: string;
  file_url?: string;
  total_rows: number;
  matched_rows: number;
  unmatched_rows: number;
  error_rows: number;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  error_details?: Record<string, unknown>;
  processed_at?: string;
  created_at: string;
}

export interface BulkUploadItem {
  id: string;
  upload_id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  matched_catalog_product_id?: string;
  match_confidence?: number;
  match_status: 'pending' | 'matched' | 'partial_match' | 'unmatched' | 'error';
  input_brand?: string;
  input_model?: string;
  input_description?: string;
  price?: number;
  moq?: number;
  stock?: number;
  lead_time_days?: number;
  error_message?: string;
  is_processed: boolean;
  processed_at?: string;
  created_at: string;
  // Joined data
  catalog_products?: {
    id: string;
    name: string;
    brands?: {
      name: string;
    };
  };
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  hsn_code?: string;
  suggested_price?: number;
  brand_id?: string;
  brands?: {
    id: string;
    name: string;
  };
}
