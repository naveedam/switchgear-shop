import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import ProductFilter from '@/components/product/ProductFilter';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Grid3X3, List, Package } from 'lucide-react';
import ProductList from '@/components/product/ProductList';
import ProductGrid from '@/components/product/ProductGrid';
import { Product, ProductFilter as FilterType } from '@/types/product';
import { fetchSubcategories, getCategoryDisplayName } from '@/services/subcategoryService';
import { Subcategory } from '@/types/category';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { fetchCategoryProducts } from '@/services/productService';

const ProductListingPage = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [totalCount, setTotalCount] = useState(0);

  const subcategoryId = searchParams.get('subcategory') || undefined;
  const sortBy = (searchParams.get('sort') as FilterType['sortBy']) || 'newest';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const search = searchParams.get('search') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 24;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (categorySlug) {
          const subcategoriesData = await fetchSubcategories(categorySlug);
          setSubcategories(subcategoriesData);
        }
        const filters: FilterType = {
          categoryId: categorySlug,
          sellerId: undefined,
          brandId,
          minPrice, maxPrice, inStock, search, sortBy
        };
        if (subcategoryId) filters.subcategoryId = subcategoryId;
        const { products: productsData, total } = await fetchCategoryProducts(filters, page, limit);
        setProducts(productsData);
        setTotalCount(total);
      } catch (error) {
        console.error('Error loading product listing data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [categorySlug, subcategoryId, sortBy, minPrice, maxPrice, inStock, search, page, limit]);

  const handleFilterChange = (filters: FilterType) => {
    const newParams = new URLSearchParams();
    if (filters.subcategoryId) newParams.set('subcategory', filters.subcategoryId);
    if (filters.brandId) newParams.set('brandId', filters.brandId);
    if (filters.sortBy) newParams.set('sort', filters.sortBy);
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock) newParams.set('inStock', 'true');
    if (filters.search) newParams.set('search', filters.search);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const categoryName = categorySlug ? getCategoryDisplayName(categorySlug) : '';
  let subcategoryName = '';
  if (subcategoryId) {
    const sel = subcategories.find(s => s.id === subcategoryId);
    subcategoryName = sel?.name || '';
  }

  return (
    <Container className="py-4">
      {/* Breadcrumbs */}
      <div className="mb-3">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink href="/categories">Categories</BreadcrumbLink>
          </BreadcrumbItem>
          {categoryName && (
            <BreadcrumbItem>
              <BreadcrumbLink href={`/categories/${categorySlug}`}>{categoryName}</BreadcrumbLink>
            </BreadcrumbItem>
          )}
          {subcategoryName && (
            <BreadcrumbItem>
              <BreadcrumbLink>{subcategoryName}</BreadcrumbLink>
            </BreadcrumbItem>
          )}
        </Breadcrumb>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="hidden lg:block w-56 shrink-0">
          <ProductFilter
            initialFilters={{ subcategoryId, brandId, minPrice, maxPrice, inStock, search, sortBy }}
            onFilterChange={handleFilterChange}
            subcategories={subcategories}
            minMaxPrice={{ min: 0, max: 100000 }}
          />
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">
                {subcategoryName || categoryName || 'Products'}
              </h1>
              <span className="text-xs text-muted-foreground">
                ({totalCount} results{search ? ` for "${search}"` : ''})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low → High</SelectItem>
                  <SelectItem value="price_desc">Price: High → Low</SelectItem>
                  <SelectItem value="rating">Best Rated</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center border border-border rounded overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={14} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(inStock || (minPrice && maxPrice) || search) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {inStock && (
                <Badge variant="secondary" className="text-[11px] h-5">In Stock</Badge>
              )}
              {minPrice && maxPrice && (
                <Badge variant="secondary" className="text-[11px] h-5">₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}</Badge>
              )}
              {search && (
                <Badge variant="secondary" className="text-[11px] h-5">Search: {search}</Badge>
              )}
            </div>
          )}

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-56" />
              ))}
            </div>
          ) : products.length > 0 ? (
            viewMode === 'grid' ? (
              <ProductGrid products={products} />
            ) : (
              <ProductList products={products} />
            )
          ) : (
            <div className="text-center py-16 bg-muted/30 rounded-lg border border-border">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-base font-medium text-foreground">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default ProductListingPage;
