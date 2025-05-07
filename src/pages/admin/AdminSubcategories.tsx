
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormDescription
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Search, FolderPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subcategory } from '@/types/category';
import { toast } from '@/hooks/use-toast';

interface SubcategoryFormValues {
  name: string;
  description: string;
  category: string;
  sortOrder: number;
}

const AdminSubcategories: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddSubcategoryOpen, setIsAddSubcategoryOpen] = useState(false);
  
  // Fetch subcategories from the database
  const { data: subcategories = [], refetch } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_subcategories')
        .select('*')
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as Subcategory[];
    }
  });
  
  // Fetch categories (for the dropdown)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<SubcategoryFormValues>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sortOrder: 0,
    },
  });
  
  // Check if user is admin and redirect if not
  React.useEffect(() => {
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Filter subcategories based on search term
  const filteredSubcategories = searchTerm 
    ? subcategories.filter(subcategory => 
        subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.category.toLowerCase().includes(searchTerm.toLowerCase()))
    : subcategories;

  // Get the category name from the category enum value
  const getCategoryName = (categoryValue: string) => {
    const displayName = categoryValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return displayName;
  };
  
  const handleAddSubcategory = async (data: SubcategoryFormValues) => {
    try {
      const { error } = await supabase
        .from('product_subcategories')
        .insert([
          {
            name: data.name,
            description: data.description,
            category: data.category,
            sort_order: data.sortOrder,
            status: 'active'
          }
        ]);
      
      if (error) throw error;
      
      toast({
        title: 'Subcategory Created',
        description: `${data.name} has been successfully added.`,
      });
      setIsAddSubcategoryOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subcategory. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Subcategories</h1>
        <Dialog open={isAddSubcategoryOpen} onOpenChange={setIsAddSubcategoryOpen}>
          <Button className="flex items-center" onClick={() => setIsAddSubcategoryOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Subcategory
          </Button>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Subcategory</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSubcategory)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Subcategory Name" {...field} />
                      </FormControl>
                      <FormDescription>This will be displayed to users on the website.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Subcategory Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Lower numbers appear first.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="mt-4">Add Subcategory</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Subcategories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search subcategories..."
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
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubcategories.map(subcategory => (
                  <TableRow key={subcategory.id}>
                    <TableCell className="font-medium">{subcategory.name}</TableCell>
                    <TableCell>{getCategoryName(subcategory.category)}</TableCell>
                    <TableCell className="max-w-xs truncate">{subcategory.description || '-'}</TableCell>
                    <TableCell>{subcategory.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/subcategories/${subcategory.id}`)}>
                          Edit
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
    </div>
  );
};

export default AdminSubcategories;
