import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Currency } from '@/components/ui/currency';
import { Product } from '@/types/product';
import { ShoppingCart, MapPin, ShieldCheck, Zap, CheckCircle, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const lowestPrice = product.variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.price),
    Infinity
  );

  const getTotalStock = () => {
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  };

  const inStock = getTotalStock() > 0;
  const { addToCart } = useCart();

  // Extract key specs for display
  const getSpecValue = (name: string) => {
    const spec = product.specifications.find(
      s => s.name.toLowerCase().includes(name.toLowerCase())
    );
    return spec?.value;
  };

  const ratedCurrent = getSpecValue('current') || getSpecValue('rating');
  const poles = getSpecValue('pole');
  const breakingCapacity = getSpecValue('breaking') || getSpecValue('capacity');
  const voltage = getSpecValue('voltage');

  const keySpecs = [
    ratedCurrent && { label: 'Current', value: ratedCurrent },
    poles && { label: 'Poles', value: poles },
    breakingCapacity && { label: 'kA', value: breakingCapacity },
    voltage && { label: 'Voltage', value: voltage },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Card className="overflow-hidden h-full border border-border hover:border-primary/30 transition-colors duration-200">
      {/* Compact image + badges */}
      <div className="relative h-32 bg-muted/30">
        <Link to={`/products/${product.slug}`}>
          <img
            src={product.featuredImage}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        </Link>
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1">
          {!inStock && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>
          )}
          {product.variants.some(v => v.salePrice) && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Sale</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
            {product.sellerName}
          </span>
          {product.certification && product.certification.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
              Verified
            </Badge>
          )}
        </div>

        {/* Product Name */}
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Key Specs Grid */}
        {keySpecs.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 py-1.5 border-y border-border/50">
            {keySpecs.slice(0, 4).map((spec, i) => (
              <div key={i} className="flex items-baseline gap-1">
                <span className="text-[10px] text-muted-foreground">{spec.label}:</span>
                <span className="text-xs font-medium text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Availability */}
        <div className="flex items-center gap-1">
          {inStock ? (
            <>
              <CheckCircle className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">In Stock</span>
            </>
          ) : product.leadTime ? (
            <>
              <Clock className="h-3 w-3 text-destructive" />
              <span className="text-xs text-destructive">{product.leadTime}</span>
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Contact for availability</span>
            </>
          )}
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-base font-bold text-foreground">
              <Currency value={lowestPrice} />
            </p>
            {product.minOrderQuantity && product.minOrderQuantity > 1 && (
              <p className="text-[10px] text-muted-foreground">MOQ: {product.minOrderQuantity}</p>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() =>
              addToCart({
                productId: product.id,
                name: product.name,
                price: product.variants[0]?.price || 0,
                featuredImage: product.featuredImage
              })
            }
            disabled={!inStock}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap gap-1 pt-1">
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted text-muted-foreground">
            <ShieldCheck className="h-2 w-2 mr-0.5" />
            GST
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted text-muted-foreground">
            <Zap className="h-2 w-2 mr-0.5" />
            Fast Response
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted text-muted-foreground">
            <MapPin className="h-2 w-2 mr-0.5" />
            India
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
