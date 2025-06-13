
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
import { Search, UserPlus, Store, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock sellers data with additional fields
const mockSellers = [
  { 
    id: 1, 
    name: 'ElectroTech Industries', 
    email: 'contact@electrotech.com', 
    status: 'active', 
    productsCount: 45, 
    joinedDate: '2023-05-10',
    gstNumber: '22AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    businessType: 'Private Limited Company',
    annualTurnover: '₹5-25 Crores',
    yearsInBusiness: 8,
    city: 'Mumbai',
    state: 'Maharashtra'
  },
  { 
    id: 2, 
    name: 'PowerGrid Solutions', 
    email: 'info@powergrid.com', 
    status: 'active', 
    productsCount: 32, 
    joinedDate: '2023-06-22',
    gstNumber: '09BBBBB1111B1Z5',
    panNumber: 'BBBBB1111B',
    businessType: 'Partnership Firm',
    annualTurnover: '₹1-5 Crores',
    yearsInBusiness: 5,
    city: 'Delhi',
    state: 'Delhi'
  },
  { 
    id: 3, 
    name: 'Circuit Systems Ltd', 
    email: 'sales@circuitsystems.com', 
    status: 'pending', 
    productsCount: 0, 
    joinedDate: '2023-10-05',
    gstNumber: '19CCCCC2222C1Z5',
    panNumber: 'CCCCC2222C',
    businessType: 'Private Limited Company',
    annualTurnover: 'Below ₹1 Crore',
    yearsInBusiness: 2,
    city: 'Bangalore',
    state: 'Karnataka'
  },
  { 
    id: 4, 
    name: 'VoltMax Industries', 
    email: 'support@voltmax.com', 
    status: 'active', 
    productsCount: 21, 
    joinedDate: '2023-07-15',
    gstNumber: '27DDDDD3333D1Z5',
    panNumber: 'DDDDD3333D',
    businessType: 'Private Limited Company',
    annualTurnover: '₹25-100 Crores',
    yearsInBusiness: 12,
    city: 'Pune',
    state: 'Maharashtra'
  },
  { 
    id: 5, 
    name: 'SwitchPro Electronics', 
    email: 'info@switchpro.com', 
    status: 'suspended', 
    productsCount: 18, 
    joinedDate: '2023-04-03',
    gstNumber: '06EEEEE4444E1Z5',
    panNumber: 'EEEEE4444E',
    businessType: 'Sole Proprietorship',
    annualTurnover: '₹1-5 Crores',
    yearsInBusiness: 6,
    city: 'Chennai',
    state: 'Tamil Nadu'
  },
];

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
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
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
  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Filter sellers based on search term
  const filteredSellers = searchTerm 
    ? mockSellers.filter(seller => 
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.city.toLowerCase().includes(searchTerm.toLowerCase()))
    : mockSellers;
  
  const handleAddSeller = (data: SellerFormValues) => {
    console.log('Adding new seller:', data);
    toast({
      title: 'Seller Created',
      description: `${data.companyName} has been successfully added as a seller.`,
    });
    setIsAddSellerOpen(false);
    form.reset();
  };

  const handleViewSeller = (seller: any) => {
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
        <h1 className="text-2xl font-bold">Manage Sellers</h1>
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
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Sellers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search sellers by name, email, GST number, or city..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map(seller => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Store className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium">{seller.name}</div>
                          <div className="text-sm text-gray-500">
                            {seller.annualTurnover} • {seller.yearsInBusiness} years
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{seller.email}</div>
                        <div className="text-sm text-gray-500">
                          Joined {seller.joinedDate}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{seller.gstNumber}</div>
                      <div className="text-sm text-gray-500">PAN: {seller.panNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div>{seller.city}</div>
                      <div className="text-sm text-gray-500">{seller.state}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{seller.businessType}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(seller.status) as any}>
                        {seller.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{seller.productsCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewSeller(seller)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/admin/sellers/${seller.id}`)}
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
        </CardContent>
      </Card>

      {/* Seller Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Seller Details</DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedSeller.name}</div>
                    <div><strong>Email:</strong> {selectedSeller.email}</div>
                    <div><strong>Business Type:</strong> {selectedSeller.businessType}</div>
                    <div><strong>Location:</strong> {selectedSeller.city}, {selectedSeller.state}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tax Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>GST Number:</strong> {selectedSeller.gstNumber}</div>
                    <div><strong>PAN Number:</strong> {selectedSeller.panNumber}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Business Profile</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Annual Turnover:</strong> {selectedSeller.annualTurnover}</div>
                    <div><strong>Years in Business:</strong> {selectedSeller.yearsInBusiness} years</div>
                    <div><strong>Products:</strong> {selectedSeller.productsCount} items</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <Badge variant={getBadgeVariant(selectedSeller.status) as any}>
                        {selectedSeller.status}
                      </Badge>
                    </div>
                    <div><strong>Joined:</strong> {selectedSeller.joinedDate}</div>
                  </div>
                </div>
              </div>
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
