import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Product } from '@/types/product';
import ProductCard from '@/components/product/ProductCard';
import { ArrowRight, ShieldCheck, Truck, Clock, Award, RefreshCw } from 'lucide-react';
import { Category } from '@/types/category';
import { fetchCategories } from '@/services/categoryService';
import HeroCarousel from '@/components/home/HeroCarousel';
import BenefitsSection from '@/components/home/BenefitsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import CtaSection from '@/components/home/CtaSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';

// Carousel slides
const slides = [
  {
    id: 1,
    title: 'Premium Switchgear Solutions',
    description: 'Find top-quality low voltage switchgear products from trusted manufacturers.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },
  {
    id: 2,
    title: 'Connect with Trusted Sellers',
    description: 'Discover verified sellers offering industrial-grade switchgear components.',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Find Sellers',
    ctaLink: '/sellers',
  },
  {
    id: 3,
    title: 'Become a Seller',
    description: 'Expand your business by selling your switchgear products on our marketplace.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&h=600',
    ctaText: 'Register Now',
    ctaLink: '/register',
  },
];

// Mock featured products
const mockVariant = {
  id: '1',
  name: 'Standard',
  sku: 'CB-100',
  price: 599.99,
  stock: 25,
};

const mockFeaturedProducts: Product[] = Array.from({ length: 8 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Premium ${i % 2 === 0 ? 'Circuit Breaker' : 'Power Distribution Panel'} ${100 + i}`,
  slug: `product-${i + 1}`,
  description: 'High-quality switchgear product with advanced safety features and reliable performance.',
  shortDescription: 'High-quality switchgear with advanced safety features.',
  featuredImage: `https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300`,
  images: [`https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=400&h=300`],
  categories: [{
    id: '1',
    name: 'Circuit Breakers',
    slug: 'circuit-breakers',
  }],
  specifications: [
    { name: 'Voltage', value: '240V' },
    { name: 'Current Rating', value: '100A' },
  ],
  variants: [{ ...mockVariant, price: 499.99 + i * 100 }],
  sellerId: (i % 3 + 1).toString(),
  sellerName: `ElectroTech Solutions ${i % 3 + 1}`,
  rating: 4 + (i % 10) / 10,
  reviewCount: 10 + i,
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'published',
}));

// Helper to get a relevant default image per category name (case-insensitive, more robust)
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
      // fallback image
      return "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80";
  }
};

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // In a real app, fetch products from API
    setFeaturedProducts(mockFeaturedProducts);
    
    // Fetch categories from database
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCategories();
        console.log('Categories loaded in Home page:', data);
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setError('Failed to load categories. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  const handleRetryCategories = () => {
    console.log('Retrying category fetch...');
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories on retry:', error);
        setError('Failed to load categories. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  };
  
  return (
    <div className="min-h-screen">
      <HeroCarousel slides={slides} />
      <BenefitsSection />
      <CategoriesSection 
        categories={categories}
        loading={loading}
        error={error}
        handleRetryCategories={handleRetryCategories}
        getDefaultCategoryImage={getDefaultCategoryImage}
      />
      <FeaturedProductsSection featuredProducts={featuredProducts} />
      <CtaSection />
      <TestimonialsSection />
    </div>
  );
};

export default Home;
