
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Search, UserPlus, Store, Eye, Building2, Loader2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  is_vendor: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
  role?: string;
  products_count?: number;
}

interface SellerFormValues {
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  gstNumber: string;
  panNumber: string;
  businessType: string;
}

const AdminSellers: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Vendor | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingVendors, setIsCreatingVendors] = useState(false);
  
  const form = useForm<SellerFormValues>({
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      phoneNumber: '',
      gstNumber: '',
      panNumber: '',
      businessType: '',
    },
  });
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch vendors from database
  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      
      // Get companies that are vendors
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_vendor', true)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Get product counts for each vendor
      const vendorsWithCounts = await Promise.all(
        (companiesData || []).map(async (vendor) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id);
          
          return {
            ...vendor,
            products_count: count || 0
          };
        })
      );

      setVendors(vendorsWithCounts);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendor data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);
  
  // Filter vendors based on search term
  const filteredVendors = searchTerm 
    ? vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.address && vendor.address.toLowerCase().includes(searchTerm.toLowerCase())))
    : vendors;
  
  const handleAddSeller = async (data: SellerFormValues) => {
    try {
      // Create new vendor company
      const { error } = await supabase
        .from('companies')
        .insert({
          name: data.companyName,
          email: data.email,
          phone: data.phoneNumber,
          is_vendor: true,
          status: 'active',
          description: `${data.businessType} - Contact: ${data.name}`
        });

      if (error) throw error;

      toast({
        title: 'Seller Created',
        description: `${data.companyName} has been successfully added as a seller.`,
      });
      
      setIsAddSellerOpen(false);
      form.reset();
      fetchVendors(); // Refresh the list
    } catch (error) {
      console.error('Error creating seller:', error);
      toast({
        title: 'Error',
        description: 'Failed to create seller',
        variant: 'destructive'
      });
    }
  };

  const createAIVendors = async () => {
    try {
      setIsCreatingVendors(true);
      
      const { data, error } = await supabase.functions.invoke('generate-products', {
        body: { action: 'create-vendors' }
      });

      if (error) throw error;

      toast({
        title: 'AI Vendors Created',
        description: `Successfully created ${data.vendorsCreated} AI-generated vendors`,
      });
      
      fetchVendors(); // Refresh the list
    } catch (error) {
      console.error('Error creating AI vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to create AI vendors',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingVendors(false);
    }
  };

  const handleViewSeller = (seller: Vendor) => {
    setSelectedSeller(seller);
    setIsViewModalOpen(true);
  };
  
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Sellers</h1>
          <p className="text-muted-foreground">
            Manage vendor companies and their marketplace presence
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={createAIVendors}
            disabled={isCreatingVendors}
            className="flex items-center"
          >
            {isCreatingVendors ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="mr-2 h-4 w-4" />
            )}
            Generate AI Vendors
          </Button>
          <Dialog open={isAddSellerOpen} onOpenChange={setIsAddSellerOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Seller
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Add New Seller</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSeller)} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Number</FormLabel>
                          <FormControl>
                            <Input placeholder="22AAAAA0000A1Z5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <Input placeholder="AAAAA0000A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Private Limited Company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="mt-4">Add Seller</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendors ({vendors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, or address..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading vendors...
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No vendors found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No vendors match your search criteria.' : 'No vendors have been created yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={createAIVendors} disabled={isCreatingVendors}>
                  {isCreatingVendors ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="mr-2 h-4 w-4" />
                  )}
                  Generate AI Vendors
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map(vendor => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Store className="h-5 w-5 text-muted-foreground mr-2" />
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            {vendor.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {vendor.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.email}</div>
                          {vendor.phone && (
                            <div className="text-sm text-muted-foreground">
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[150px] truncate">
                          {vendor.address || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(vendor.status) as any}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{vendor.products_count || 0}</span>
                          {(vendor.products_count || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/products?vendor=${vendor.id}`)}
                              className="h-6 px-2 text-xs"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(vendor.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewSeller(vendor)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/admin/sellers/${vendor.id}`)}
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedSeller.name}</div>
                    <div><strong>Email:</strong> {selectedSeller.email}</div>
                    {selectedSeller.phone && (
                      <div><strong>Phone:</strong> {selectedSeller.phone}</div>
                    )}
                    {selectedSeller.address && (
                      <div><strong>Address:</strong> {selectedSeller.address}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Platform Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Status:</strong> 
                      <Badge variant={getBadgeVariant(selectedSeller.status) as any} className="ml-2">
                        {selectedSeller.status}
                      </Badge>
                    </div>
                    <div><strong>Vendor Type:</strong> {selectedSeller.is_vendor ? 'Active Vendor' : 'Regular User'}</div>
                    <div><strong>Products:</strong> {selectedSeller.products_count || 0} items</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Account Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Created:</strong> {new Date(selectedSeller.created_at).toLocaleDateString()}</div>
                    <div><strong>Last Updated:</strong> {new Date(selectedSeller.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="text-sm">
                    {selectedSeller.description || 'No description available'}
                  </div>
                </div>
              </div>

              {selectedSeller.products_count && selectedSeller.products_count > 0 && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => {
                      navigate(`/admin/products?vendor=${selectedSeller.id}`);
                      setIsViewModalOpen(false);
                    }}
                    className="w-full"
                  >
                    View Products ({selectedSeller.products_count})
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellers;
