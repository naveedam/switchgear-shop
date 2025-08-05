import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, IndianRupee, Package, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { AddProductDialog } from '@/components/admin/products/AddProductDialog';
import { ImportPricelistDialog } from '@/components/admin/products/ImportPricelistDialog';

const AdminProducts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          stock_quantity,
          status,
          category,
          companies ( name ),
          product_subcategories ( name )
        `);

      if (error) {
        toast({ title: "Error fetching marketplace products", description: error.message, variant: "destructive" });
        throw new Error(error.message);
      }
      return data;
    }
  });

  const { data: catalogProducts = [], isLoading: catalogLoading, error: catalogError } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select(`
          id,
          name,
          description,
          suggested_price,
          category,
          hsn_code,
          brands ( name )
        `);

      if (error) {
        toast({ title: "Error fetching catalog products", description: error.message, variant: "destructive" });
        throw new Error(error.message);
      }
      return data;
    }
  });
  
  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  const filteredProducts = searchTerm
    ? products.filter(product => {
        const companyName = product.companies?.name || '';
        const categoryName = product.category || '';
        return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryName.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase()) ||
          companyName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : products;

  const filteredCatalogProducts = searchTerm
    ? catalogProducts.filter(product => {
        const brandName = product.brands?.name || '';
        const categoryName = product.category || '';
        return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoryName.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase()) ||
          brandName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : catalogProducts;
  
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCategoryName = (name: string | null) => {
    if (!name) return 'N/A';
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <div className="flex items-center gap-2">
          <ImportPricelistDialog />
          <AddProductDialog />
        </div>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Marketplace Products ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Master Catalog ({filteredCatalogProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Active Marketplace Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">Loading products...</TableCell>
                      </TableRow>
                    )}
                    {productsError && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-destructive">Error loading products.</TableCell>
                      </TableRow>
                    )}
                    {!productsLoading && !productsError && filteredProducts.length === 0 && (
                       <TableRow>
                        <TableCell colSpan={7} className="text-center">No marketplace products found. Sellers haven't added any products yet.</TableCell>
                      </TableRow>
                    )}
                    {!productsLoading && !productsError && filteredProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.companies?.name || 'N/A'}</TableCell>
                        <TableCell>{formatCategoryName(product.category)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 text-gray-500 mr-1" />
                            {formatPrice(product.price)}
                          </div>
                        </TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'active' ? "default" : "secondary"} className={product.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${product.id}`)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Master Catalog Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Suggested Price</TableHead>
                      <TableHead>HSN Code</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading catalog products...</TableCell>
                      </TableRow>
                    )}
                    {catalogError && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-destructive">Error loading catalog products.</TableCell>
                      </TableRow>
                    )}
                    {!catalogLoading && !catalogError && filteredCatalogProducts.length === 0 && (
                       <TableRow>
                        <TableCell colSpan={6} className="text-center">No catalog products found.</TableCell>
                      </TableRow>
                    )}
                    {!catalogLoading && !catalogError && filteredCatalogProducts.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brands?.name || 'N/A'}</TableCell>
                        <TableCell>{formatCategoryName(product.category)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 text-gray-500 mr-1" />
                            {formatPrice(product.suggested_price)}
                          </div>
                        </TableCell>
                        <TableCell>{product.hsn_code || 'N/A'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/catalog/${product.id}`)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProducts;
