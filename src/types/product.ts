
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  specifications?: ProductSpecification[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  featuredImage: string;
  images: string[];
  categories: ProductCategory[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  leadTime?: string;
  warranty?: string;
  certification?: string[];
}

export interface ProductFilter {
  categoryId?: string;
  subcategoryId?: string;
  sellerId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}
