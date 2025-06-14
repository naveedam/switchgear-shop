
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { fetchCategories } from '@/services/categoryService';
import { fetchSubcategories } from '@/services/subcategoryService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { IndianRupee, Image as ImageIcon, Zap, Power, Ruler, PackagePlus } from 'lucide-react';

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

export const AddProductDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategory],
    queryFn: () => fetchSubcategories(selectedCategory || ''),
    enabled: !!selectedCategory
  });

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

  const watchedCategory = form.watch('category');

  useEffect(() => {
    if (watchedCategory) {
      setSelectedCategory(watchedCategory);
      form.setValue('subcategory', '');
    }
  }, [watchedCategory, form]);

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
      
      const newProduct: Database['public']['Tables']['products']['Insert'] = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock_quantity: data.stock,
        vendor_id: data.seller,
        subcategory_id: data.subcategory,
        category: data.category.replace(/-/g, '_') as Database['public']['Enums']['product_category'],
        sku: data.sku,
        Images: imageUrl,
        rated_voltage: data.rated_voltage,
        power_rating: data.power_rating,
        dimensions: data.dimensions,
        status: 'active',
        currency: 'INR',
      };

      const { error } = await supabase.from('products').insert(newProduct);

      if (error) throw error;

      toast({
        title: 'Product Created',
        description: `${data.name} has been successfully added.`,
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                      value={field.value}
                      disabled={!selectedCategory || subcategoriesLoading || subcategories.length === 0}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="file"
                          className="pl-8"
                          accept="image/png, image/jpeg, image/gif"
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onChange={(e) => field.onChange(e.target.files)}
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
  );
};

export default AddProductDialog;
