import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types/product';

interface FeaturedProductsSectionProps {
  featuredProducts: Product[];
}

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({ featuredProducts }) => (
  <section className="section-padding bg-background">
    <div className="container-wide">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <h2 className="section-title mb-2">Featured Products</h2>
          <p className="text-muted-foreground">Discover our most popular switchgear products</p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/products" className="flex items-center gap-2">
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="product-grid">
        {featuredProducts.slice(0, 8).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedProductsSection;
