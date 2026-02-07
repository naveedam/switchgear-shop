import { supabase } from "@/integrations/supabase/client";
import { SellerProduct, ProductRequest, BulkUpload, BulkUploadItem, CatalogProduct } from "@/types/seller-inventory";

// ==========================================
// CATALOG PRODUCT SEARCH
// ==========================================

export const searchCatalogProducts = async (
  query: string,
  limit = 20
): Promise<CatalogProduct[]> => {
  const { data, error } = await supabase
    .from('catalog_products')
    .select(`
      id,
      name,
      description,
      category,
      hsn_code,
      suggested_price,
      brand_id,
      brands ( id, name )
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data as CatalogProduct[];
};

// ==========================================
// SELLER PRODUCTS
// ==========================================

export const getSellerProducts = async (sellerId: string): Promise<SellerProduct[]> => {
  const { data, error } = await supabase
    .from('seller_products')
    .select(`
      *,
      catalog_products (
        id,
        name,
        description,
        category,
        hsn_code,
        suggested_price,
        brands ( name )
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SellerProduct[];
};

export const addSellerProduct = async (
  sellerId: string,
  catalogProductId: string,
  data: {
    price: number;
    moq: number;
    stock: number;
    lead_time_days?: number;
    dispatch_location?: string;
    notes?: string;
  }
): Promise<SellerProduct> => {
  const { data: product, error } = await supabase
    .from('seller_products')
    .insert({
      seller_id: sellerId,
      catalog_product_id: catalogProductId,
      ...data,
      status: 'active'
    })
    .select(`
      *,
      catalog_products (
        id,
        name,
        description,
        category,
        hsn_code,
        suggested_price,
        brands ( name )
      )
    `)
    .single();

  if (error) throw error;
  return product as SellerProduct;
};

export const updateSellerProduct = async (
  productId: string,
  updates: Partial<{
    price: number;
    moq: number;
    stock: number;
    lead_time_days: number;
    dispatch_location: string;
    status: string;
    notes: string;
  }>
): Promise<SellerProduct> => {
  const { data, error } = await supabase
    .from('seller_products')
    .update(updates)
    .eq('id', productId)
    .select(`
      *,
      catalog_products (
        id,
        name,
        description,
        category,
        hsn_code,
        suggested_price,
        brands ( name )
      )
    `)
    .single();

  if (error) throw error;
  return data as SellerProduct;
};

export const deleteSellerProduct = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('seller_products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
};

// ==========================================
// PRODUCT REQUESTS
// ==========================================

export const getSellerProductRequests = async (sellerId: string): Promise<ProductRequest[]> => {
  const { data, error } = await supabase
    .from('product_requests')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ProductRequest[];
};

export const createProductRequest = async (
  sellerId: string,
  request: {
    brand_name: string;
    model_number: string;
    category?: string;
    subcategory?: string;
    description?: string;
    technical_specs?: Record<string, string>;
    datasheet_url?: string;
    additional_documents?: string[];
  }
): Promise<ProductRequest> => {
  const { data, error } = await supabase
    .from('product_requests')
    .insert({
      seller_id: sellerId,
      ...request
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProductRequest;
};

// ==========================================
// ADMIN PRODUCT REQUEST MANAGEMENT
// ==========================================

export const getAllProductRequests = async (
  status?: string
): Promise<ProductRequest[]> => {
  let query = supabase
    .from('product_requests')
    .select(`
      *,
      companies ( name, email )
    `)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ProductRequest[];
};

export const reviewProductRequest = async (
  requestId: string,
  decision: 'approved' | 'rejected',
  adminNotes?: string,
  rejectionReason?: string,
  catalogProductData?: {
    name: string;
    description?: string;
    category?: string;
    hsn_code?: string;
    suggested_price?: number;
    brand_id?: string;
  }
): Promise<ProductRequest> => {
  // If approving, first create the catalog product
  let catalogProductId: string | undefined;
  
  if (decision === 'approved' && catalogProductData) {
    const { data: newProduct, error: productError } = await supabase
      .from('catalog_products')
      .insert(catalogProductData)
      .select()
      .single();
    
    if (productError) throw productError;
    catalogProductId = newProduct.id;
  }

  const { data, error } = await supabase
    .from('product_requests')
    .update({
      status: decision,
      admin_notes: adminNotes,
      rejection_reason: rejectionReason,
      approved_catalog_product_id: catalogProductId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: (await supabase.auth.getUser()).data.user?.id
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return data as ProductRequest;
};

// ==========================================
// BULK UPLOADS
// ==========================================

export const getSellerBulkUploads = async (sellerId: string): Promise<BulkUpload[]> => {
  const { data, error } = await supabase
    .from('seller_bulk_uploads')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as BulkUpload[];
};

export const getBulkUploadItems = async (uploadId: string): Promise<BulkUploadItem[]> => {
  const { data, error } = await supabase
    .from('seller_bulk_upload_items')
    .select(`
      *,
      catalog_products (
        id,
        name,
        brands ( name )
      )
    `)
    .eq('upload_id', uploadId)
    .order('row_number', { ascending: true });

  if (error) throw error;
  return data as BulkUploadItem[];
};

export const createBulkUpload = async (
  sellerId: string,
  filename: string,
  items: Array<{
    row_number: number;
    raw_data: Record<string, unknown>;
    input_brand?: string;
    input_model?: string;
    input_description?: string;
    price?: number;
    moq?: number;
    stock?: number;
    lead_time_days?: number;
  }>
): Promise<BulkUpload> => {
  // Create the upload record
  const { data: upload, error: uploadError } = await supabase
    .from('seller_bulk_uploads')
    .insert({
      seller_id: sellerId,
      filename,
      total_rows: items.length,
      status: 'processing'
    })
    .select()
    .single();

  if (uploadError) throw uploadError;

  // Insert items - cast raw_data to Json type
  const itemsWithUploadId = items.map(item => ({
    ...item,
    raw_data: item.raw_data as unknown as Record<string, never>, // Cast to satisfy Supabase types
    upload_id: upload.id
  }));

  const { error: itemsError } = await supabase
    .from('seller_bulk_upload_items')
    .insert(itemsWithUploadId as any); // Use any to bypass strict type checking for JSONB

  if (itemsError) throw itemsError;

  return upload as BulkUpload;
};

export const matchBulkUploadItems = async (uploadId: string): Promise<void> => {
  // Get unprocessed items
  const { data: items, error: fetchError } = await supabase
    .from('seller_bulk_upload_items')
    .select('*')
    .eq('upload_id', uploadId)
    .eq('is_processed', false);

  if (fetchError) throw fetchError;

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const item of items || []) {
    // Try to match by brand + model
    const searchTerms = [
      item.input_model,
      item.input_brand,
      item.input_description
    ].filter(Boolean).join(' ');

    if (!searchTerms) {
      await supabase
        .from('seller_bulk_upload_items')
        .update({
          match_status: 'unmatched',
          is_processed: true,
          processed_at: new Date().toISOString(),
          error_message: 'No searchable data provided'
        })
        .eq('id', item.id);
      unmatchedCount++;
      continue;
    }

    // Search catalog
    const { data: matches } = await supabase
      .from('catalog_products')
      .select('id, name')
      .or(`name.ilike.%${item.input_model || ''}%,name.ilike.%${item.input_brand || ''}%`)
      .limit(1);

    if (matches && matches.length > 0) {
      await supabase
        .from('seller_bulk_upload_items')
        .update({
          matched_catalog_product_id: matches[0].id,
          match_confidence: 0.8,
          match_status: 'matched',
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
      matchedCount++;
    } else {
      await supabase
        .from('seller_bulk_upload_items')
        .update({
          match_status: 'unmatched',
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
      unmatchedCount++;
    }
  }

  // Update upload stats
  await supabase
    .from('seller_bulk_uploads')
    .update({
      matched_rows: matchedCount,
      unmatched_rows: unmatchedCount,
      status: 'completed',
      processed_at: new Date().toISOString()
    })
    .eq('id', uploadId);
};

export const confirmBulkUploadItems = async (
  sellerId: string,
  items: Array<{
    id: string;
    catalog_product_id: string;
    price: number;
    moq: number;
    stock: number;
    lead_time_days?: number;
  }>
): Promise<number> => {
  let successCount = 0;

  for (const item of items) {
    try {
      await supabase
        .from('seller_products')
        .upsert({
          seller_id: sellerId,
          catalog_product_id: item.catalog_product_id,
          price: item.price,
          moq: item.moq,
          stock: item.stock,
          lead_time_days: item.lead_time_days,
          status: 'active'
        }, {
          onConflict: 'seller_id,catalog_product_id'
        });
      successCount++;
    } catch {
      // Continue with other items
    }
  }

  return successCount;
};

// ==========================================
// ADMIN STATISTICS
// ==========================================

export const getInventoryStats = async () => {
  const [
    { count: totalListings },
    { count: pendingRequests },
    { count: activeSellers }
  ] = await Promise.all([
    supabase.from('seller_products').select('*', { count: 'exact', head: true }),
    supabase.from('product_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('seller_products').select('seller_id', { count: 'exact', head: true })
  ]);

  return {
    totalListings: totalListings || 0,
    pendingRequests: pendingRequests || 0,
    activeSellers: activeSellers || 0
  };
};
