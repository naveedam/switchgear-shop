
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSubcategories } from '@/services/subcategoryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface SubcategoryListProps {
  categoryId?: string;
  categoryName?: string;
}

const SubcategoryList: React.FC<SubcategoryListProps> = ({ categoryId, categoryName }) => {
  const navigate = useNavigate();
  
  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => fetchSubcategories(categoryId),
    enabled: !!categoryId
  });

  if (isLoading) {
    return <div className="p-4 text-center">Loading subcategories...</div>;
  }

  if (subcategories.length === 0) {
    return <div className="p-4 text-center">No subcategories found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoryName || 'Subcategories'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subcategories.map((subcategory) => (
            <Badge 
              key={subcategory.id}
              variant="outline" 
              className="p-3 cursor-pointer hover:bg-gray-100 text-sm"
              onClick={() => navigate(`/products?subcategory=${subcategory.id}`)}
            >
              {subcategory.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubcategoryList;
