
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Subcategory } from '@/types/category';

interface SubcategoriesTableProps {
  subcategories: Subcategory[];
}

const SubcategoriesTable: React.FC<SubcategoriesTableProps> = ({ subcategories }) => {
  const navigate = useNavigate();

  // Helper function to format category names
  const getCategoryName = (categoryValue: string) => {
    const displayName = categoryValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return displayName;
  };

  return (
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
          {subcategories.map(subcategory => (
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
  );
};

export default SubcategoriesTable;
