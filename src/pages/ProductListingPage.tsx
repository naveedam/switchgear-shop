
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { ProductFilter } from '@/components/product/ProductFilter';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Grid3X3, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);

  // Get filters from URL params
  const subcategoryId = searchParams.get('subcategory') || undefined;
  const sortBy = (searchParams.get('sort') as FilterType['sortBy']) || 'newest';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const search = searchParams.get('search') || undefined;
  
  // Get page and limit for pagination
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Load subcategories for the sidebar
        if (categorySlug) {
          const subcategoriesData = await fetchSubcategories(categorySlug);
          setSubcategories(subcategoriesData);
        }
        
        // Fetch products based on the category and filters
        const filters: FilterType = {
          categoryId: categorySlug,
          sellerId: undefined,
          minPrice,
          maxPrice,
          inStock,
          search,
          sortBy
        };
        
        if (subcategoryId) {
          filters.subcategoryId = subcategoryId;
        }
        
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
    // Update URL with new filters
    const newParams = new URLSearchParams();
    if (filters.subcategoryId) newParams.set('subcategory', filters.subcategoryId);
    if (filters.sortBy) newParams.set('sort', filters.sortBy);
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.inStock) newParams.set('inStock', 'true');
    if (filters.search) newParams.set('search', filters.search);
    newParams.set('page', '1'); // Reset to first page on filter change
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

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  // For breadcrumbs
  const categoryName = categorySlug ? getCategoryDisplayName(categorySlug) : '';
  let subcategoryName = '';
  if (subcategoryId) {
    const selectedSubcategory = subcategories.find(s => s.id === subcategoryId);
    subcategoryName = selectedSubcategory?.name || '';
  }

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <div className="mb-6">
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filter */}
        <div className="w-full lg:w-1/4 space-y-6">
          <ProductFilter
            initialFilters={{
              subcategoryId,
              minPrice,
              maxPrice,
              inStock,
              search,
              sortBy
            }}
            onFilterChange={handleFilterChange}
            subcategories={subcategories}
            minMaxPrice={{ min: 0, max: 100000 }}
          />
        </div>
        
        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Category Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {subcategoryName || categoryName || 'Products'}
            </h1>
            <p className="text-gray-600">
              {totalCount} products found
              {search && <span> for "{search}"</span>}
            </p>
          </div>
          
          {/* Filters & Sorting Row */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Active Filters */}
            <div className="flex flex-wrap gap-2">
              {inStock && (
                <Badge variant="outline" className="bg-gray-100">
                  In Stock
                </Badge>
              )}
              {minPrice && maxPrice && (
                <Badge variant="outline" className="bg-gray-100">
                  ₹{minPrice} - ₹{maxPrice}
                </Badge>
              )}
            </div>
            
            {/* Sorting & View Options */}
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Best Rated</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="hidden sm:flex items-center border rounded-md overflow-hidden">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => handleViewModeChange('grid')}
                >
                  <Grid3X3 size={18} />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => handleViewModeChange('list')}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Product Listing */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-72"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            viewMode === 'grid' ? (
              <ProductGrid products={products} />
            ) : (
              <ProductList products={products} />
            )
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-medium">No products found</h3>
              <p className="text-gray-500 mt-2">
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  disabled={!hasPrevPage}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={!hasNextPage}
                  onClick={() => handlePageChange(page + 1)}
                >
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
