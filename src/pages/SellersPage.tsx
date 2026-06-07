import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Mail, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Seller {
  id: string;
  name: string;
  email: string;
  productCount: number;
}

const SellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('companies').select('id, name, email').order('name');
      if (error) throw error;
      const withCounts = await Promise.all((data || []).map(async (c) => {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', c.id).eq('status', 'active');
        return { id: c.id, name: c.name, email: c.email, productCount: count || 0 };
      }));
      setSellers(withCounts.filter(s => s.productCount > 0));
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({ title: "Error", description: "Failed to load sellers.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const filtered = sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Trusted Sellers</h1>
        <p className="text-lg text-gray-600">Verified sellers offering premium electrical equipment and switchgear.</p>
      </div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search sellers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-6 flex items-center">
          <Package className="h-8 w-8 text-primary" />
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Sellers</p><p className="text-2xl font-bold">{sellers.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center">
          <Package className="h-8 w-8 text-green-600" />
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Active Products</p><p className="text-2xl font-bold">{sellers.reduce((sum, s) => sum + s.productCount, 0)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center">
          <Globe className="h-8 w-8 text-blue-600" />
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Cities</p><p className="text-2xl font-bold">1</p></div>
        </CardContent></Card>
      </div>
      {filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? "No sellers found" : "No sellers yet"}</h3>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((seller) => (
            <Card key={seller.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{seller.name}</CardTitle>
                  <Badge variant="secondary">{seller.productCount} products</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {seller.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{seller.email}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { window.location.href = `/products?vendor=${seller.id}`; }}>
                  View Products
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellersPage;
