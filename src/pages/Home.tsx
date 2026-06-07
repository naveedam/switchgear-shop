import React, { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { fetchCategories } from '@/services/categoryService';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from '@/components/home/HeroSection';
import BenefitsSection from '@/components/home/BenefitsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import CtaSection from '@/components/home/CtaSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import TrustSection from '@/components/home/TrustSection';

const getDefaultCategoryImage = (categoryName: string) => {
  const normalized = categoryName.toLowerCase().replace(/&/g, 'and').replace(/[-_]/g, ' ').trim();
  switch (normalized) {
    case "circuit breakers":
      return "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=600&q=80";
    case "low voltage switchgears":
      return "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80";
    case "control panels":
      return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80";
    case "wires and cables":
      return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";
    default:
      return "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80";
  }
};

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`*, brands(id, name), companies(id, name)`)
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(8);

        if (error) throw error;

        const mapped: Product[] = (data || []).map((p: any) => {
          let images: string[] = [];
          try {
            images = Array.isArray(p.Images)
              ? p.Images
              : typeof p.Images === 'string'
              ? JSON.parse(p.Images)
              : [];
          } catch { images = []; }

          return {
            id: p.id,
            name: p.name,
            slug: p.id,
            description: p.description || '',
            shortDescription: p.description ? p.description.substring(0, 120) : '',
            featuredImage: images[0] || null,
            images,
            categories: [{ id: p.category, name: p.category?.replace(/_/g, ' ') || '', slug: p.category }],
            specifications: [
              { name: 'Rated Current', value: p.rated_current },
              { name: 'Poles', value: p.pole_count ? `${p.pole_count}P` : null },
              { name: 'Breaking Capacity', value: p.breaking_capacity },
            ].filter(s => s.value != null) as { name: string; value: string }[],
            variants: [{ id: `${p.id}-v1`, name: 'Standard', sku: p.sku || p.id, price: Number(p.price), stock: p.stock_quantity || 0 }],
            sellerId: p.vendor_id,
            sellerName: p.companies?.name || 'M N Associates',
            brandName: p.brands?.name || '',
            rating: 0,
            reviewCount: 0,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
            status: 'published',
            minOrderQuantity: p.min_order_quantity || 1,
            maxOrderQuantity: 1000,
            leadTime: '3-5 days',
            warranty: p.warranty_period || '12 months',
            certification: p.iec_standards_compliance || [],
          };
        });
        setFeaturedProducts(mapped);
      } catch (err) {
        console.error('Failed to load featured products:', err);
      }
    };

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
    loadCategories();
  }, []);

  const handleRetryCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories on retry:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TrustSection />
      <BenefitsSection />
      <CategoriesSection
        categories={categories}
        loading={loading}
        error={error}
        handleRetryCategories={handleRetryCategories}
        getDefaultCategoryImage={getDefaultCategoryImage}
      />
      <FeaturedProductsSection featuredProducts={featuredProducts} />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
};

export default Home;
