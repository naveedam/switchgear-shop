import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFilter } from '@/types/product';

interface ProductResult {
  products: Product[];
  total: number;
}

export const fetchCategoryProducts = async (
  filter: ProductFilter,
  page: number = 1,
  limit: number = 20
): Promise<ProductResult> => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        brands ( id, name ),
        companies ( id, name ),
        product_subcategories ( id, name )
      `, { count: 'exact' })
      .eq('status', 'active');

    // Filters
    if (filter.categoryId) {
      query = query.eq('category', filter.categoryId);
    }
    if (filter.subcategoryId) {
      query = query.eq('subcategory_id', filter.subcategoryId);
    }
    if (filter.minPrice !== undefined) {
      query = query.gte('price', filter.minPrice);
    }
    if (filter.maxPrice !== undefined) {
      query = query.lte('price', filter.maxPrice);
    }
    if (filter.inStock) {
      query = query.gt('stock_quantity', 0);
    }
    if (filter.search) {
      query = query.or(
        `name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`
      );
    }
    if (filter.sellerId) {
      query = query.eq('vendor_id', filter.sellerId);
    }

    // Sorting
    switch (filter.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('sort_order', { ascending: true });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return { products: [], total: 0 };
    }

    const products: Product[] = (data || []).map((p: any) => {
      // Parse images
      let images: string[] = [];
      try {
        images = Array.isArray(p.Images)
          ? p.Images
          : typeof p.Images === 'string'
          ? JSON.parse(p.Images)
          : [];
      } catch {
        images = [];
      }

      // Build specifications from real columns
      const specifications = [
        { name: 'Rated Current', value: p.rated_current },
        { name: 'Poles', value: p.pole_count ? `${p.pole_count}P` : null },
        { name: 'Breaking Capacity', value: p.breaking_capacity },
        { name: 'Tripping Characteristic', value: p.tripping_characteristic },
        { name: 'Rated Voltage', value: p.rated_voltage },
        { name: 'Mounting', value: p.mounting_type },
        { name: 'Series', value: p.series_name },
        { name: 'Standard', value: p.iec_standards_compliance?.[0] },
      ].filter(s => s.value != null) as { name: string; value: string }[];

      return {
        id: p.id,
        name: p.name,
        slug: p.id,
        description: p.description || '',
        shortDescription: p.description
          ? p.description.substring(0, 120)
          : '',
        featuredImage: images[0] || null,
        images,
        categories: [
          {
            id: p.category,
            name: p.category?.replace(/_/g, ' ') || '',
            slug: p.category,
          },
        ],
        specifications,
        variants: [
          {
            id: `${p.id}-v1`,
            name: 'Standard',
            sku: p.sku || p.id,
            price: Number(p.price),
            stock: p.stock_quantity || 0,
          },
        ],
        sellerId: p.vendor_id,
        sellerName: p.companies?.name || 'M N Associates',
        brandName: p.brands?.name || '',
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        status: 'published',
        minOrderQuantity: p.min_order_quantity || 1,
        maxOrderQuantity: 1000,
        leadTime: '3-5 days',
        warranty: p.warranty_period || '12 months',
        certification: p.iec_standards_compliance || [],
      };
    });

    return { products, total: count || 0 };
  } catch (err) {
    console.error('Unexpected error in fetchCategoryProducts:', err);
    return { products: [], total: 0 };
  }
};