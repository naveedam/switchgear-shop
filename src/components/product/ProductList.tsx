import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { ShoppingCart, CheckCircle, Clock, ShieldCheck, MapPin, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';
import { useCart } from '@/contexts/CartContext';

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const { addToCart } = useCart();

  const getSpecValue = (product: Product, name: string) => {
    const spec = product.specifications.find(
      s => s.name.toLowerCase().includes(name.toLowerCase())
    );
    return spec?.value;
  };

  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        <div className="col-span-4">Product</div>
        <div className="col-span-2">Specs</div>
        <div className="col-span-1">Brand</div>
        <div className="col-span-2">Availability</div>
        <div className="col-span-1">Price</div>
        <div className="col-span-2">Action</div>
      </div>

      {products.map((product) => {
        const lowestPrice = product.variants.reduce(
          (lowest, variant) => Math.min(lowest, variant.price), Infinity
        );
        const inStock = product.variants.reduce((t, v) => t + v.stock, 0) > 0;
        const ratedCurrent = getSpecValue(product, 'current');
        const poles = getSpecValue(product, 'pole');
        const breakingCapacity = getSpecValue(product, 'breaking');

        return (
          <div
            key={product.id}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center px-3 py-2.5 border border-border rounded-lg hover:border-primary/20 transition-colors bg-card"
          >
            {/* Product Name + Image */}
            <div className="col-span-4 flex items-center gap-3">
              <Link to={`/products/${product.slug}`} className="shrink-0">
                <img
                  src={product.featuredImage}
                  alt={product.name}
                  className="w-12 h-12 object-contain rounded border border-border"
                />
              </Link>
              <div className="min-w-0">
                <Link to={`/products/${product.slug}`}>
                  <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">
                    {product.name}
                  </p>
                </Link>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                    <ShieldCheck className="h-2 w-2 mr-0.5" />
                    Verified
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted text-muted-foreground">
                    <Zap className="h-2 w-2 mr-0.5" />
                    Fast
                  </Badge>
                </div>
              </div>
            </div>

            {/* Key Specs */}
            <div className="col-span-2">
              <div className="flex flex-wrap gap-1">
                {ratedCurrent && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">{ratedCurrent}</span>
                )}
                {poles && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">{poles}</span>
                )}
                {breakingCapacity && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground">{breakingCapacity}</span>
                )}
              </div>
            </div>

            {/* Brand */}
            <div className="col-span-1">
              <span className="text-xs font-medium text-foreground">{product.sellerName}</span>
            </div>

            {/* Availability */}
            <div className="col-span-2">
              {inStock ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-primary font-medium">In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-destructive">{product.leadTime || 'On request'}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="col-span-1">
              <p className="text-sm font-bold text-foreground">
                <Currency value={lowestPrice} />
              </p>
            </div>

            {/* Action */}
            <div className="col-span-2 flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                disabled={!inStock}
                onClick={() =>
                  addToCart({
                    productId: product.id,
                    name: product.name,
                    price: product.variants[0]?.price || 0,
                    featuredImage: product.featuredImage
                  })
                }
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link to={`/products/${product.slug}`}>View</Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductList;
