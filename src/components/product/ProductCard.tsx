
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { ShoppingCart, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const lowestPrice = product.variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.price),
    Infinity
  );
  
  const highestPrice = product.variants.reduce(
    (highest, variant) => Math.max(highest, variant.price),
    0
  );
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  const renderPriceRange = () => {
    if (lowestPrice === highestPrice) {
      return formatPrice(lowestPrice);
    }
    return `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`;
  };
  
  const getTotalStock = () => {
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  };
  
  return (
    <Card className="overflow-hidden h-full card-hover">
      <div className="relative">
        <Link to={`/products/${product.slug}`}>
          <img 
            src={product.featuredImage} 
            alt={product.name} 
            className="w-full h-48 object-cover"
          />
        </Link>
        <div className="absolute top-2 right-2">
          {getTotalStock() === 0 && (
            <Badge variant="destructive" className="mr-2">Out of Stock</Badge>
          )}
          {product.variants.some(v => v.salePrice) && (
            <Badge variant="secondary">Sale</Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center text-sm text-gray-500 mb-2">
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
        
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="font-medium text-gray-900 mb-1 hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {product.shortDescription || product.description.substring(0, 100)}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
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
        
        <p className="text-lg font-semibold text-gray-900">
          {renderPriceRange()}
        </p>
      </CardContent>
      
      <CardFooter className="px-4 pb-4 pt-0">
        <Button className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
