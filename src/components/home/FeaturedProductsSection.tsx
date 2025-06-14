
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types/product';

interface FeaturedProductsSectionProps {
  featuredProducts: Product[];
}

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({ featuredProducts }) => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">
          Featured Products
        </h2>
        <Link to="/products" className="text-brand-600 hover:text-brand-700 flex items-center">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredProducts.slice(0, 8).map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedProductsSection;
