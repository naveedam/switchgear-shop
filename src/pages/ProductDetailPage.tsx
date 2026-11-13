import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Truck } from 'lucide-react';
import SellerTrustBadges from '@/components/trust/SellerTrustBadges';
import PriceTiers from '@/components/trust/PriceTiers';
import { deliveryLabel } from '@/components/buyer/InstantQuotePanel';
import { useCart } from '@/contexts/CartContext';
import { usePageMeta } from '@/hooks/usePageMeta';

// URLs look like /products/<name-slug>-<uuid>; older links are just /products/<uuid>
const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const PLACEHOLDER = "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80";

const ProductDetailPage: React.FC = () => {
  const { productSlug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const productId = productSlug?.match(UUID_AT_END)?.[1] ?? productSlug;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, brands(id, name), companies(id, name)')
          .eq('id', productId)
          .single();
        if (error) throw error;
        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  usePageMeta({
    title: product ? `${product.name}${product.brands?.name ? ' – ' + product.brands.name : ''} | SwitchgearShop.in` : undefined,
    description: product?.description ? String(product.description).slice(0, 155) : undefined,
  });

  if (loading) return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Product not found</h2>
      <Link to="/products"><Button variant="outline">Back to Products</Button></Link>
    </div>
  );

  let images: string[] = [];
  try {
    images = Array.isArray(product.Images) ? product.Images
      : typeof product.Images === 'string' ? JSON.parse(product.Images) : [];
  } catch { images = []; }
  const mainImage = images[0] || PLACEHOLDER;

  const specs = [
    { name: 'Rated Current',           value: product.rated_current },
    { name: 'Poles',                   value: product.pole_count ? `${product.pole_count}P` : null },
    { name: 'Breaking Capacity',       value: product.breaking_capacity },
    { name: 'Tripping Characteristic', value: product.tripping_characteristic },
    { name: 'Rated Voltage',           value: product.rated_voltage },
    { name: 'Rated Frequency',         value: product.rated_frequency },
    { name: 'Insulation Voltage',      value: product.rated_insulation_voltage },
    { name: 'Impulse Withstand',       value: product.impulse_withstand_voltage },
    { name: 'Breaking Capacity (Icu)', value: product.breaking_capacity_icu },
    { name: 'Breaking Capacity (Ics)', value: product.breaking_capacity_ics },
    { name: 'Mounting Type',           value: product.mounting_type },
    { name: 'Width Per Pole',          value: product.width_per_pole },
    { name: 'Mechanical Life',         value: product.mechanical_life_cycles },
    { name: 'Electrical Life',         value: product.electrical_life_cycles },
    { name: 'Series',                  value: product.series_name },
    { name: 'Model Number',            value: product.model_number },
    { name: 'Warranty',                value: product.warranty_period },
    { name: 'HSN Code',                value: product.hsn_code },
    { name: 'CE Marked',               value: product.ce_marked ? 'Yes' : null },
    { name: 'RoHS Compliant',          value: product.rohs_compliant ? 'Yes' : null },
  ].filter(s => s.value != null);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      featuredImage: mainImage,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-4">
        <Link to="/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Image */}
        <div className="space-y-3">
          <div className="aspect-square rounded-xl border border-border overflow-hidden bg-muted/30">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.slice(0, 4).map((img: string, i: number) => (
                <div key={i} className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted/30">
                  <img src={img} alt="" className="w-full h-full object-contain p-1"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.brands?.name && (
            <p className="text-sm font-medium text-primary uppercase tracking-wider">{product.brands.name}</p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sold by {product.companies?.name || 'M N Associates'}</span>
            <Badge variant="outline">{product.category?.replace(/_/g, ' ')}</Badge>
          </div>
          <SellerTrustBadges sellerId={product.vendor_id} brandName={product.brands?.name} />
          <div className="text-3xl font-bold text-foreground">
            ₹ {Number(product.price).toLocaleString('en-IN')}
            <span className="ml-2 text-sm font-normal text-muted-foreground">+ GST</span>
          </div>
          <PriceTiers productId={product.id} listPrice={Number(product.price)} />
          <div className="flex items-center gap-2">
            {product.stock_quantity > 0
              ? <Badge className="bg-green-100 text-green-800">{product.stock_quantity} In Stock</Badge>
              : <Badge variant="destructive">Out of Stock</Badge>
            }
            <span className="text-xs text-muted-foreground">Min order: {product.min_order_quantity || 1} unit</span>
          </div>
          {(product.lead_time_days != null || product.dispatch_city) && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>{deliveryLabel(product.lead_time_days, product.dispatch_city, product.stock_quantity == null || product.stock_quantity > 0)}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAddToCart} className="flex-1 gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/buyer/bom/upload')}>Request Quote</Button>
          </div>
          {product.iec_standards_compliance?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {product.iec_standards_compliance.map((std: string) => (
                <Badge key={std} variant="secondary" className="text-xs">{std}</Badge>
              ))}
            </div>
          )}
          {product.description && (
            <p className="text-sm text-muted-foreground pt-2">{product.description}</p>
          )}
        </div>
      </div>

      {/* Specifications */}
      {specs.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-6 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">Specifications</h2>
          </div>
          <div className="divide-y divide-border">
            {specs.map((spec) => (
              <div key={spec.name} className="grid grid-cols-2 px-6 py-3">
                <span className="text-sm text-muted-foreground">{spec.name}</span>
                <span className="text-sm font-medium text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
