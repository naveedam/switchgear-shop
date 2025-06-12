
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const getTotalStock = (product: Product) => {
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  };

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const lowestPrice = product.variants.reduce(
          (lowest, variant) => Math.min(lowest, variant.price),
          Infinity
        );
        
        const hasDiscount = product.variants.some(v => v.salePrice);
        const inStock = getTotalStock(product) > 0;
        
        return (
          <div 
            key={product.id} 
            className="flex flex-col md:flex-row border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition duration-200"
          >
            {/* Product Image */}
            <div className="md:w-1/4 max-w-xs">
              <Link to={`/products/${product.slug}`}>
                <img 
                  src={product.featuredImage} 
                  alt={product.name} 
                  className="w-full h-48 md:h-full object-cover"
                />
              </Link>
            </div>
            
            {/* Product Details */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Link to={`/sellers/${product.sellerId}`} className="hover:text-brand-600">
                    {product.sellerName}
                  </Link>
                  <span className="mx-2">•</span>
                  <div className="flex items-center">
                    <Star className="h-3.5 w-3.5 text-yellow-500 mr-1 fill-yellow-500" />
                    <span>{product.rating.toFixed(1)}</span>
                    <span className="ml-1">({product.reviewCount})</span>
                  </div>
                </div>
                
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-lg font-medium text-gray-900 mb-1 hover:text-brand-700 line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {product.shortDescription || product.description.substring(0, 150)}
                </p>
                
                {/* Badges and categories */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {!inStock && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  {hasDiscount && (
                    <Badge variant="secondary">Sale</Badge>
                  )}
                  {product.categories.slice(0, 2).map(category => (
                    <Link 
                      key={category.id} 
                      to={`/categories/${category.slug}`}
                    >
                      <Badge variant="outline" className="bg-gray-50">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
                
                {/* Specifications */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {product.specifications.slice(0, 4).map((spec, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <span className="font-medium">{spec.name}:</span> {spec.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    <Currency value={lowestPrice} />
                  </div>
                  {inStock ? (
                    <p className="text-green-600 text-sm">In Stock</p>
                  ) : (
                    <p className="text-red-600 text-sm">Out of Stock</p>
                  )}
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <Button className="flex-1 md:flex-none" disabled={!inStock}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" className="flex-1 md:flex-none">
                    <Link to={`/products/${product.slug}`} className="flex items-center">
                      Details <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;
