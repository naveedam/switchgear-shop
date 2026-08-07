import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { BRAND_MAP } from '@/services/productService';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import BrandsRailSection from '@/components/home/BrandsRailSection';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import WhatsAppBar from '@/components/home/WhatsAppBar';

const CATEGORY_SLUGS = [
  'low_voltage_switchgear',
  'starters_and_switches',
  'wires_and_cables',
  'measuring_instruments',
  'industrial_automation_vfd',
  'capacitors_and_reactors',
  'switches_and_sockets',
  'relays',
  'industrial_plugs_and_sockets',
];

const BRAND_IDS = [
  '4b442eb3-87ca-4e3f-bb4b-99550c0775cb',
  '8f88abf7-db43-423d-92b3-ffdbdc1c3446',
  '633815cb-b043-42ac-bd72-b803c6bce1b6',
  'c6775030-5d53-4e57-9151-a5be09ed1294',
  'd4e1bb5c-d795-4c59-ad4e-677dffbb6a20',
  'f03caea4-145e-4207-89d0-907dc0ede710',
  '4d33392e-b8fa-4969-adc2-74a29d69abca',
  '6061c3df-0de5-4164-a0a2-26c6557db6c2',
  '4a63e203-8a13-4bc7-bbde-71cb95786b60',
  'daff8b94-5eb4-4cf2-a9ba-2b73c1dcc659',
  '64003e09-36c4-493f-ad73-c224204a9fb9',
  '261386b4-bb50-47e3-a3ab-8ec17819ee8c',
  '74ce8963-db3e-48dd-96d2-ac0c69058dd9',
];

const Home: React.FC = () => {
  const [inStockProducts, setInStockProducts] = useState<Product[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ products: 0, brands: 0, categories: 0 });

  useEffect(() => {
    const load = async () => {
      // 1. Total product count
      const { count: totalCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 2. Total brand count
      const { count: brandCount } = await supabase
        .from('brands')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        products: totalCount || 0,
        brands: brandCount || 0,
        categories: CATEGORY_SLUGS.length,
      });

      // 3. Per-category counts
      const catCounts: Record<string, number> = {};
      await Promise.all(
        CATEGORY_SLUGS.map(async slug => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('category', slug);
          catCounts[slug] = count || 0;
        })
      );
      setCategoryCounts(catCounts);

      // 4. Per-brand counts (only brands we show in the rail)
      const bCounts: Record<string, number> = {};
      await Promise.all(
        BRAND_IDS.map(async id => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('brand_id', id);
          bCounts[id] = count || 0;
        })
      );
      setBrandCounts(bCounts);

      // 5. In-stock products for featured section
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('sort_order', { ascending: true })
        .limit(8);

      const mapped: Product[] = (data || []).map((p: any) => {
        let images: string[] = [];
        try {
          images = Array.isArray(p.Images) ? p.Images : typeof p.Images === 'string' ? JSON.parse(p.Images) : [];
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
          specifications: [],
          variants: [{ id: `${p.id}-v1`, name: 'Standard', sku: p.sku || p.id, price: Number(p.price), stock: p.stock_quantity || 0 }],
          sellerId: p.vendor_id,
          sellerName: p.companies?.name || 'M N Associates',
          brandName: BRAND_MAP[p.brand_id] || '',
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
      setInStockProducts(mapped);
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection stats={stats} />
      <CategoriesSection counts={categoryCounts} />
      <BrandsRailSection counts={brandCounts} />
      <FeaturedProductsSection products={inStockProducts} />
      <WhatsAppBar />
    </div>
  );
};

export default Home;
