
import React, { useState } from 'react';
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
import { Search, UserPlus, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock sellers data
const mockSellers = [
  { id: 1, name: 'ElectroTech Industries', email: 'contact@electrotech.com', status: 'active', productsCount: 45, joinedDate: '2023-05-10' },
  { id: 2, name: 'PowerGrid Solutions', email: 'info@powergrid.com', status: 'active', productsCount: 32, joinedDate: '2023-06-22' },
  { id: 3, name: 'Circuit Systems Ltd', email: 'sales@circuitsystems.com', status: 'pending', productsCount: 0, joinedDate: '2023-10-05' },
  { id: 4, name: 'VoltMax Industries', email: 'support@voltmax.com', status: 'active', productsCount: 21, joinedDate: '2023-07-15' },
  { id: 5, name: 'SwitchPro Electronics', email: 'info@switchpro.com', status: 'suspended', productsCount: 18, joinedDate: '2023-04-03' },
];

interface SellerFormValues {
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
}

const AdminSellers: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  
  const form = useForm<SellerFormValues>({
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      phoneNumber: '',
    },
  });
  
  // Check if user is admin and redirect if not
  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Filter sellers based on search term
  const filteredSellers = searchTerm 
    ? mockSellers.filter(seller => 
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase()))
    : mockSellers;
  
  const handleAddSeller = (data: SellerFormValues) => {
    // In a real app, you would add the seller to the database
    console.log('Adding new seller:', data);
    toast({
      title: 'Seller Created',
      description: `${data.companyName} has been successfully added as a seller.`,
    });
    setIsAddSellerOpen(false);
    form.reset();
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
        <h1 className="text-2xl font-bold">Manage Sellers</h1>
        <Dialog open={isAddSellerOpen} onOpenChange={setIsAddSellerOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Seller
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Seller</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSeller)} className="space-y-4 py-4">
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
                <DialogFooter>
                  <Button type="submit" className="mt-4">Add Seller</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search sellers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map(seller => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Store className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{seller.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(seller.status) as any}>
                        {seller.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{seller.productsCount}</TableCell>
                    <TableCell>{seller.joinedDate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/sellers/${seller.id}`)}>
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
    </div>
  );
};

export default AdminSellers;
