
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
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
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">
          Browse Categories
        </h2>
        <Link to="/categories" className="text-brand-600 hover:text-brand-700 flex items-center">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          Array(10).fill(0).map((_, index) => (
            <Card key={`loading-${index}`} className="overflow-hidden h-full animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-2">
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRetryCategories} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : categories.length > 0 ? (
          categories.slice(0, 10).map(category => (
            <Link 
              key={category.id} 
              to={`/categories/${category.slug}`}
              className="group"
            >
              <Card className="overflow-hidden h-full card-hover">
                <div className="aspect-square relative">
                  <img 
                    src={
                      category.imageUrl?.trim()
                        ? category.imageUrl
                        : getDefaultCategoryImage(category.name)
                    }
                    alt={category.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getDefaultCategoryImage(category.name);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-center text-sm">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500">
            <p className="mb-2">No categories available at the moment.</p>
            <Button onClick={handleRetryCategories} variant="outline" size="sm">
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
