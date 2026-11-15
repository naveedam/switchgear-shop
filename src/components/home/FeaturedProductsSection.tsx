import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/types/product';
import { Currency } from '@/components/ui/currency';
import { useCart } from '@/contexts/CartContext';

interface FeaturedProductsSectionProps {
  products: Product[];
}

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({ products }) => {
  const { addToCart } = useCart();

  if (products.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="container-wide py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl">Ready to ship</h2>
          <p className="text-sm text-muted-foreground mt-1">In stock with sellers now.</p>
        </div>
        <Link to="/products?inStock=true" className="text-sm font-medium text-primary hover:underline shrink-0">
          All in-stock
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {products.slice(0, 8).map(product => {
          const price = product.variants[0]?.price || 0;
          return (
            <div
              key={product.id}
              className="flex items-center gap-3 px-3 py-2.5 border border-border rounded-lg bg-card hover:border-border-strong transition-colors group"
            >
              <div className="w-10 h-10 bg-secondary border border-border rounded-md flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${product.slug}`}>
                  <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">
                    {product.name}
                  </p>
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{product.brandName}</span>
                  <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-1.5 py-0.5 rounded-full">In stock</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  <Currency value={price} />
                </span>
                <button
                  onClick={() => addToCart({
                    productId: product.id,
                    name: product.name,
                    price,
                    featuredImage: product.featuredImage,
                  })}
                  className="p-1.5 border border-border rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
