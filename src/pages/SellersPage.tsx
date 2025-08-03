import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Globe, Phone, Mail, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Seller {
  id: string;
  name: string;
  description: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  productCount: number;
}

const SellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      
      // Fetch only registered sellers who have completed onboarding
      const { data: onboardedSellers, error: onboardingError } = await supabase
        .from('seller_onboarding')
        .select(`
          id,
          user_id,
          company_name,
          company_description,
          contact_email,
          contact_phone,
          address,
          city,
          state,
          country,
          website,
          created_at,
          status
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (onboardingError) throw onboardingError;

      if (!onboardedSellers || onboardedSellers.length === 0) {
        setSellers([]);
        return;
      }

      // Get product counts for each seller based on their user_id
      const sellersWithProducts = await Promise.all(
        onboardedSellers.map(async (seller) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', seller.user_id)
            .eq('status', 'active');

          return {
            id: seller.user_id, // Use user_id for product linking
            name: seller.company_name,
            description: seller.company_description,
            email: seller.contact_email,
            phone: seller.contact_phone,
            address: `${seller.address}, ${seller.city}, ${seller.state}, ${seller.country}`,
            status: seller.status,
            created_at: seller.created_at,
            productCount: count || 0
          };
        })
      );

      setSellers(sellersWithProducts);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({
        title: "Error",
        description: "Failed to load sellers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Trusted Sellers</h1>
        <p className="text-lg text-gray-600">
          Discover verified sellers offering premium electrical equipment and switchgear products.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search sellers by name, location, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                <p className="text-2xl font-bold">{sellers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold">
                  {sellers.reduce((sum, seller) => sum + seller.productCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Locations</p>
                <p className="text-2xl font-bold">
                  {new Set(sellers.map(s => s.address?.split(',')[0]).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sellers Grid */}
      {filteredSellers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No sellers found' : 'No sellers available yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Our trusted sellers will be listed here soon.'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSellers.map((seller) => (
            <Card key={seller.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{seller.name}</CardTitle>
                  <Badge variant="secondary">
                    {seller.productCount} product{seller.productCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {seller.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {seller.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {seller.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{seller.address}</span>
                    </div>
                  )}
                  
                  {seller.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{seller.email}</span>
                    </div>
                  )}
                  
                  {seller.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Navigate to seller's products
                      window.location.href = `/products?vendor=${seller.id}`;
                    }}
                  >
                    View Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellersPage;