import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Category } from '@/types/category';

interface CategoriesSectionProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  handleRetryCategories: () => void;
  getDefaultCategoryImage: (name: string) => string;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  loading,
  error,
  handleRetryCategories,
  getDefaultCategoryImage,
}) => (
  <section className="section-padding bg-secondary/30">
    <div className="container-wide">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <h2 className="section-title mb-2">Browse Categories</h2>
          <p className="text-muted-foreground">Explore our extensive range of industrial electrical products</p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/categories" className="flex items-center gap-2">
            View All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          Array(8).fill(0).map((_, index) => (
            <div key={`loading-${index}`} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
          ))
        ) : error ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRetryCategories} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : categories.length > 0 ? (
          categories.slice(0, 8).map(category => (
            <Link 
              key={category.id} 
              to={`/categories/${category.slug}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted hover-lift"
            >
              <img 
                src={
                  category.imageUrl?.trim()
                    ? category.imageUrl
                    : getDefaultCategoryImage(category.name)
                }
                alt={category.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getDefaultCategoryImage(category.name);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg group-hover:translate-x-1 transition-transform">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <p className="mb-4">No categories available at the moment.</p>
            <Button onClick={handleRetryCategories} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
