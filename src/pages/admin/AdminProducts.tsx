import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Search, PackagePlus, IndianRupee, Image as ImageIcon, Zap, Power, Ruler } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCategories } from '@/services/categoryService';

// Mock products data
const mockProducts = [
  { 
    id: 1, 
    name: 'MCB Circuit Breaker', 
    seller: 'ElectroTech Industries', 
    category: 'Low Voltage Switchgears', 
    price: 2500, 
    stock: 150, 
    status: 'active' 
  },
  { 
    id: 2, 
    name: 'LED Panel Light 18W', 
    seller: 'PowerGrid Solutions', 
    category: 'LED Lights', 
    price: 850, 
    stock: 320, 
    status: 'active' 
  },
  { 
    id: 3, 
    name: 'Digital Multimeter', 
    seller: 'Circuit Systems Ltd', 
    category: 'Test & Measuring Instruments', 
    price: 3200, 
    stock: 45, 
    status: 'active' 
  },
  { 
    id: 4, 
    name: 'Power Contactor', 
    seller: 'VoltMax Industries', 
    category: 'Controlling Gear & Signalling Devices', 
    price: 1800, 
    stock: 78, 
    status: 'active' 
  },
  { 
    id: 5, 
    name: 'Industrial Socket 32A', 
    seller: 'SwitchPro Electronics', 
    category: 'Industrial Plugs & Sockets', 
    price: 950, 
    stock: 210, 
    status: 'active' 
  },
];

// Mock sellers for the dropdown
// This will be replaced by a database query
// const mockSellers = [ ... ];

interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  seller: string;
  category: string;
  subcategory: string;
  sku: string;
  image?: FileList;
  rated_voltage?: string;
  power_rating?: string;
  dimensions?: string;
}

const AdminProducts: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch categories directly using the service
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });
  
  // Fetch subcategories when a category is selected
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: () => fetchSubcategories(selectedCategory || ''),
    enabled: !!selectedCategory
  });

  // Fetch sellers from the database
  const { data: sellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_vendor', true)
        .eq('status', 'active');
      if (error) {
        console.error("Error fetching sellers:", error);
        toast({ title: "Error", description: "Could not fetch sellers.", variant: "destructive" });
        return [];
      }
      return data;
    }
  });
  
  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      seller: '',
      category: '',
      subcategory: '',
      sku: '',
      rated_voltage: '',
      power_rating: '',
      dimensions: '',
    },
  });
  
  // Watch for category changes
  const watchedCategory = form.watch('category');
  
  useEffect(() => {
    if (watchedCategory) {
      console.log("Category selected:", watchedCategory);
      setSelectedCategory(watchedCategory);
      // Reset subcategory when category changes
      form.setValue('subcategory', '');
    }
  }, [watchedCategory, form]);
  
  // Check if user is admin and redirect if not
  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Filter products based on search term
  const filteredProducts = searchTerm 
    ? mockProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.seller.toLowerCase().includes(searchTerm.toLowerCase()))
    : mockProducts;
  
  const handleAddProduct = async (data: ProductFormValues) => {
    try {
      let imageUrl: string | undefined;
      const imageFile = data.image?.[0];

      if (imageFile) {
        const filePath = `public/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      
      const { data: categoryData } = await supabase.from('product_categories').select('name').eq('slug', data.category).single();

      const newProduct = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock_quantity: data.stock,
        vendor_id: data.seller,
        subcategory_id: data.subcategory,
        category: data.category,
        sku: data.sku,
        Images: imageUrl,
        rated_voltage: data.rated_voltage,
        power_rating: data.power_rating,
        dimensions: data.dimensions,
        status: 'active',
        currency: 'INR',
      };

      const { error } = await supabase.from('products').insert([newProduct]).select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Product Created',
        description: `${data.name} has been successfully added.`,
      });

      // Note: The product list is using mock data. The new product will not appear until the page is refactored to fetch products from the database.
      queryClient.invalidateQueries({ queryKey: ['products'] }); // In case we switch to DB fetching
      setIsAddProductOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: 'Error creating product',
        description: error.message || "An unexpected error occurred.",
        variant: 'destructive',
      });
    }
  };
  
  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <PackagePlus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddProduct)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="SKU" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Product Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriesLoading ? (
                              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                            ) : (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.slug}>
                                  {category.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!selectedCategory}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Subcategory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategoriesLoading ? (
                              <SelectItem value="loading" disabled>Loading subcategories...</SelectItem>
                            ) : subcategories.length === 0 ? (
                              <SelectItem value="none" disabled>No subcategories available</SelectItem>
                            ) : (
                              subcategories.map((subcategory) => (
                                <SelectItem key={subcategory.id} value={subcategory.id}>
                                  {subcategory.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <FormControl>
                         <div className="relative">
                            <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                              type="file"
                              className="pl-8"
                              accept="image/png, image/jpeg, image/gif"
                              onChange={(e) => onChange(e.target.files)}
                              {...fieldProps}
                            />
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rated_voltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voltage</FormLabel>
                         <FormControl>
                          <div className="relative">
                            <Zap className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="e.g. 220V" {...field} className="pl-8" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="power_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power Rating</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Power className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="e.g. 100W" {...field} className="pl-8" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                   <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensions</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ruler className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="e.g. 10x5x3 cm" {...field} className="pl-8" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="seller"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seller</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Seller" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sellersLoading ? (
                            <SelectItem value="loading" disabled>Loading sellers...</SelectItem>
                          ) : (
                            sellers.map((seller) => (
                              <SelectItem key={seller.id} value={seller.id}>
                                {seller.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="mt-4" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding...' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
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
                {filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.seller}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IndianRupee className="h-3 w-3 text-gray-500 mr-1" />
                        {formatPrice(product.price)}
                      </div>
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
    </div>
  );
};

export default AdminProducts;
