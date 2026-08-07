import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFilter } from '@/types/product';

interface ProductResult {
  products: Product[];
  total: number;
}


export const BRAND_MAP: Record<string, string> = {
  '9e8951f2-4972-4c69-b5b2-e4efc0d60f9c': '3D',
  '809da01c-56bd-418f-8b3d-43ef87e8a36c': '3M',
  'e2df9ada-5c15-434d-a5b5-f935daa37cc5': '9 Electric',
  '4b442eb3-87ca-4e3f-bb4b-99550c0775cb': 'ABB',
  '835593eb-fd11-4d9a-8383-ad7b7f42d754': 'Anchor by Panasonic',
  '8d070946-5e1c-4aa1-b87c-32b34916dfd4': 'BCH Electric',
  '5e661420-876d-4ddc-8595-21ef97adb0bf': 'BEETECH',
  '683c95f5-8283-4ceb-bb3b-2e98987fdc91': 'Crabtree',
  'f68cff58-1657-40e2-af51-98e90e062518': 'Crompton',
  '7f4ccb03-47d3-4cb2-8009-77203788f381': 'C&S Electric',
  '83503b6a-6f96-4184-8691-04b9d3f05f65': 'Delta',
  '94e3b7a7-ca12-4227-b600-d7a339a9fe27': "Dowell's",
  'd716d3e4-05f2-4e54-8e16-10598baeff58': 'Eaton',
  '0d59f839-f56b-4ec4-a305-e46552974f6e': 'Electron',
  '64003e09-36c4-493f-ad73-c224204a9fb9': 'Finolex',
  'f05571db-a5af-43b4-bf55-506338853cd5': 'Fluke',
  '94a0cd17-9579-4d0e-a294-e76bd20a87ba': 'Fonolex',
  '158001ba-0bb8-493c-b85b-9592ebfa1670': 'GM Modular',
  '276c5812-ca48-4d19-960e-0d180c9bbddf': 'Goldmedal Switches & Systems',
  '531efbc2-2cbc-497a-9398-7394d6bab76c': 'Great White Electricals',
  '6061c3df-0de5-4164-a0a2-26c6557db6c2': 'Hager',
  '8f88abf7-db43-423d-92b3-ffdbdc1c3446': 'Havells',
  'ad290b78-df3d-471a-83b5-e9edce3f7e1c': 'Hex',
  '23c28f01-e458-485d-a969-859b1a421f07': 'Hicool',
  'b6320bf3-d08e-4699-a02c-2c88240db152': 'Hioki',
  '4d33392e-b8fa-4969-adc2-74a29d69abca': 'HPL',
  '3ea12ed7-79a6-4870-8a0c-186decba5f73': 'HTC Instruments',
  '4a63e203-8a13-4bc7-bbde-71cb95786b60': 'Indo Asian',
  '74ce8963-db3e-48dd-96d2-ac0c69058dd9': 'KEI Cables',
  '98bc174b-5665-4165-8997-4bbf5a735711': 'Lapp Kabel',
  'd4e1bb5c-d795-4c59-ad4e-677dffbb6a20': 'Legrand',
  'c6775030-5d53-4e57-9151-a5be09ed1294': 'L&T Electrical & Automation',
  '06f86bb3-cf76-4d84-b9bc-e2f072e49747': 'Mastech',
  '5520809a-a8fc-4e50-910b-c4b1f151ed39': 'Meco-G',
  'c9b835ea-24c8-49c8-86e7-a8143aa2cd11': 'Mennekes',
  '35d9db29-2ddb-4d77-b3f8-901a302d5596': 'Neptune',
  'f3e6135f-a880-4bb0-9885-62312d3c8ab7': 'Norisys',
  '264475fb-db91-4e99-a4cf-a2db6d2c910d': 'Omron',
  '4cd9ff74-e60e-444a-afc5-db700bbba4c2': 'Orbit',
  '3812ae56-6fd3-4f7a-8670-aec09d0ec033': 'Polecab',
  '261386b4-bb50-47e3-a3ab-8ec17819ee8c': 'Polycab',
  'e86ba2b3-a2e1-42ca-aec7-21d0b8c255a1': 'Precision',
  'c91ca6ea-bc1e-4b56-a1f6-e3970f1df80f': 'Prok Devices',
  'b4cd04ba-02da-4fb4-8fd8-a84ed939ea7f': 'PYE Hand tools',
  'daff8b94-5eb4-4cf2-a9ba-2b73c1dcc659': 'RR Kabel',
  'd07f46ce-1852-4acb-97dd-37ceab0c029d': 'RR Switchgear',
  '633815cb-b043-42ac-bd72-b803c6bce1b6': 'Schneider Electric',
  'f03caea4-145e-4207-89d0-907dc0ede710': 'SIEMENS',
  'eb80093d-3e66-47da-b521-b6c582742657': 'Skava',
  '88430722-d911-471f-82ee-37928b35a80a': 'Socomec',
  '69851d25-cb6b-4225-92fb-6367204ba9e5': 'Syska',
  'c122e766-a175-4d3c-a5d8-56de0ac8c5f2': 'Taparia',
  'b5063aa3-7b2a-403f-be9c-060049a3ef2b': 'TDK Epcos',
  '68431c26-473c-4684-8a49-213a08ca0928': 'Teknic',
  '9987d901-ae81-499d-a196-2cc11f1e7f4a': 'V Guard',
  'd545336e-963e-4b72-872d-22372e9d88e0': 'VIP',
  '49c95a1d-4229-471d-afc8-1cdb44a8d36b': 'Wipro',
  '7d2e52a9-3641-4171-8ce1-561e1654a849': 'Wonder',
};

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
      query = query.eq('category', filter.categoryId as any);
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
    if (filter.brandId) {
      query = query.eq('brand_id', filter.brandId);
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
        brandName: BRAND_MAP[p.brand_id] || p.brands?.name || '',
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