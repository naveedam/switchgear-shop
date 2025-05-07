
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subcategory } from '@/types/category';
import { FolderPlus } from 'lucide-react';
import AddSubcategoryDialog from '@/components/admin/subcategories/AddSubcategoryDialog';
import SubcategoriesTable from '@/components/admin/subcategories/SubcategoriesTable';
import SubcategorySearch from '@/components/admin/subcategories/SubcategorySearch';

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
      
      // Transform database response to match Subcategory type
      return data.map((item: any): Subcategory => ({
        id: item.id,
        name: item.name,
        category: item.category,
        description: item.description,
        imageUrl: item.image_url,
        sortOrder: item.sort_order,
        status: item.status
      }));
    }
  });
  
  // Fetch categories for the dropdown
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Subcategories</h1>
        <Button className="flex items-center" onClick={() => setIsAddSubcategoryOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Add Subcategory
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle>Subcategories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <SubcategorySearch 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
            />
          </div>
          
          <SubcategoriesTable subcategories={filteredSubcategories} />
        </CardContent>
      </Card>

      <AddSubcategoryDialog
        open={isAddSubcategoryOpen}
        onOpenChange={setIsAddSubcategoryOpen}
        categories={categories}
        onSuccess={refetch}
      />
    </div>
  );
};

export default AdminSubcategories;
