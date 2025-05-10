
import { Product, ProductFilter } from '@/types/product';

// Mock data similar to eleczo.com product structure
const mockProducts: Product[] = Array.from({ length: 24 }, (_, i) => ({
  id: (i + 1).toString(),
  name: [
    'Schneider MCB 1 Pole 32A C Curve 10kA',
    'ABB AC Contactor 9A 3 Pole 230V Coil',
    'Siemens MCCB 100A 3P 25kA Thermal Magnetic',
    'Havells RCCB 2 Pole 40A 30mA Type AC',
    'L&T Molded Case Circuit Breaker 250A 36kA',
    'Legrand Distribution Board 4 Way SPN Double Door',
    'Anchor MCB 2 Pole 20A C Curve 10kA',
    'HPL MCCB 160A 3P 36kA Thermal Magnetic'
  ][i % 8] + ` ${Math.floor(i / 8) + 1}`,
  slug: `product-${i + 1}`,
  description: 'This premium switchgear product offers advanced protection features, reliable performance, and adherence to international safety standards. Suitable for industrial and commercial applications with easy installation and low maintenance requirements.',
  shortDescription: 'Advanced protection device with thermal-magnetic operation and high breaking capacity.',
  featuredImage: `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300&q=${80 + (i % 20)}`,
  images: Array(3).fill(0).map((_, j) => `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300&q=${80 + (i % 20) + j}`),
  categories: [{
    id: '1',
    name: 'Low Voltage Switchgears',
    slug: 'low_voltage_switchgears',
  }],
  specifications: [
    { name: 'Type', value: ['MCB', 'MCCB', 'RCCB', 'Contactor', 'DB'][i % 5] },
    { name: 'Poles', value: `${[1, 2, 3, 4][i % 4]} P` },
    { name: 'Current Rating', value: `${[16, 20, 25, 32, 40, 63, 100][i % 7]} A` },
    { name: 'Breaking Capacity', value: `${[6, 10, 16, 25, 36][i % 5]} kA` },
    { name: 'Curve Type', value: ['B', 'C', 'D'][i % 3] },
    { name: 'Standards', value: 'IEC 60898' },
  ],
  variants: [
    {
      id: `v${i}-1`,
      name: 'Standard',
      sku: `SKU${10000 + i}`,
      price: 500 + (i * 100),
      salePrice: i % 3 === 0 ? 450 + (i * 90) : undefined,
      stock: i % 5 === 0 ? 0 : 10 + (i % 20),
    },
    {
      id: `v${i}-2`,
      name: 'Premium',
      sku: `SKU${10000 + i}-P`,
      price: 700 + (i * 120),
      stock: 5 + (i % 15),
    }
  ],
  sellerId: `s${1 + (i % 5)}`,
  sellerName: [
    'Electro Solutions',
    'PowerTech Systems',
    'Circuit Experts',
    'VoltMax Industries',
    'SwitchPro Electronics'
  ][i % 5],
  rating: 3.5 + (i % 30) / 10,
  reviewCount: 5 + (i * 2),
  createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
  updatedAt: new Date(),
  status: 'published',
  minOrderQuantity: 1,
  maxOrderQuantity: 100,
  leadTime: `${3 + (i % 7)} days`,
  warranty: `${[1, 2, 3, 5][i % 4]} Year${[1].includes(i % 4) ? '' : 's'}`,
  certification: ['ISI', 'CE', 'ISO 9001', 'RoHS'].slice(0, 1 + (i % 4)),
}));

interface ProductResult {
  products: Product[];
  total: number;
}

export const fetchCategoryProducts = async (
  filter: ProductFilter,
  page: number = 1,
  limit: number = 20
): Promise<ProductResult> => {
  // This is a mock implementation - in a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Apply filters
      let filteredProducts = [...mockProducts];
      
      // Filter by category
      if (filter.categoryId) {
        filteredProducts = filteredProducts.filter(p => 
          p.categories.some(c => c.slug === filter.categoryId)
        );
      }

      // Filter by subcategory
      if (filter.subcategoryId) {
        filteredProducts = filteredProducts.filter(p => 
          p.categories.some(c => c.id === filter.subcategoryId)
        );
      }
      
      // Filter by seller
      if (filter.sellerId) {
        filteredProducts = filteredProducts.filter(p => p.sellerId === filter.sellerId);
      }
      
      // Filter by price range
      if (filter.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => {
          const lowestPrice = p.variants.reduce((min, v) => 
            Math.min(min, v.salePrice || v.price), Infinity);
          return lowestPrice >= filter.minPrice!;
        });
      }
      
      if (filter.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => {
          const lowestPrice = p.variants.reduce((min, v) => 
            Math.min(min, v.salePrice || v.price), Infinity);
          return lowestPrice <= filter.maxPrice!;
        });
      }
      
      // Filter by stock
      if (filter.inStock) {
        filteredProducts = filteredProducts.filter(p => 
          p.variants.some(v => v.stock > 0)
        );
      }
      
      // Filter by search term
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.description.toLowerCase().includes(searchLower) ||
          p.specifications.some(s => 
            s.name.toLowerCase().includes(searchLower) || 
            s.value.toString().toLowerCase().includes(searchLower)
          )
        );
      }
      
      // Apply sorting
      if (filter.sortBy) {
        switch(filter.sortBy) {
          case 'price_asc':
            filteredProducts.sort((a, b) => {
              const aPrice = a.variants.reduce((min, v) => 
                Math.min(min, v.salePrice || v.price), Infinity);
              const bPrice = b.variants.reduce((min, v) => 
                Math.min(min, v.salePrice || v.price), Infinity);
              return aPrice - bPrice;
            });
            break;
          case 'price_desc':
            filteredProducts.sort((a, b) => {
              const aPrice = a.variants.reduce((min, v) => 
                Math.min(min, v.salePrice || v.price), Infinity);
              const bPrice = b.variants.reduce((min, v) => 
                Math.min(min, v.salePrice || v.price), Infinity);
              return bPrice - aPrice;
            });
            break;
          case 'newest':
            filteredProducts.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            );
            break;
          case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        }
      }
      
      // Calculate pagination
      const total = filteredProducts.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedProducts = filteredProducts.slice(start, end);
      
      resolve({
        products: paginatedProducts,
        total
      });
    }, 500); // Simulate network delay
  });
};
