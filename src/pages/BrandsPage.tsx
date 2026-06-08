import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  productCount: number;
}

const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name, description, website')
          .order('name');
        if (error) throw error;

        const withCounts = await Promise.all((data || []).map(async (b) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', b.id)
            .eq('status', 'active');
          return { ...b, productCount: count || 0 };
        }));

        setBrands(withCounts.filter(b => b.productCount > 0));
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  if (loading) return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brands</h1>
        <p className="text-lg text-gray-600">Browse products by manufacturer</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/products?brandId=${brand.id}`}
            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-primary transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <span className="text-xl font-bold text-primary">
                {brand.name.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 text-center">{brand.name}</span>
            <span className="text-xs text-gray-500 mt-1">{brand.productCount} products</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BrandsPage;
