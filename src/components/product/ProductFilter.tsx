
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProductFilter as FilterType } from '@/types/product';
import { Subcategory } from '@/types/category';

interface ProductFilterProps {
  initialFilters?: FilterType;
  onFilterChange: (filters: FilterType) => void;
  subcategories: Subcategory[];
  minMaxPrice: { min: number; max: number };
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  initialFilters,
  onFilterChange,
  subcategories,
  minMaxPrice,
}) => {
  const [filters, setFilters] = useState<FilterType>(initialFilters || {});
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || minMaxPrice.min,
    filters.maxPrice || minMaxPrice.max,
  ]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  
  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      subcategoryId: checked ? subcategoryId : undefined,
    }));
  };
  
  const handleInStockChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      inStock: checked,
    }));
  };
  
  const handleSortChange = (sortBy: FilterType['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
    }));
  };
  
  const applyFilters = () => {
    onFilterChange({
      ...filters,
      search: searchTerm,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    });
  };
  
  const resetFilters = () => {
    setFilters({});
    setPriceRange([minMaxPrice.min, minMaxPrice.max]);
    setSearchTerm('');
    onFilterChange({});
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-6">
          <div className="relative">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={applyFilters}
            >
              Search
            </Button>
          </div>
        </div>
        
        <Accordion type="multiple" defaultValue={['subcategories', 'price', 'availability', 'sort']}>
          <AccordionItem value="subcategories">
            <AccordionTrigger>Subcategories</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {subcategories.map(subcategory => (
                  <div key={subcategory.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subcategory-${subcategory.id}`}
                      checked={filters.subcategoryId === subcategory.id}
                      onCheckedChange={(checked) => 
                        handleSubcategoryChange(subcategory.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`subcategory-${subcategory.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {subcategory.name}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="price">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  min={minMaxPrice.min}
                  max={minMaxPrice.max}
                  step={100}
                  onValueChange={handlePriceChange}
                  className="my-6"
                />
                <div className="flex items-center justify-between text-sm">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="availability">
            <AccordionTrigger>Availability</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="in-stock"
                  checked={filters.inStock}
                  onCheckedChange={(checked) => 
                    handleInStockChange(checked as boolean)
                  }
                />
                <Label
                  htmlFor="in-stock"
                  className="text-sm cursor-pointer"
                >
                  In Stock Only
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="sort">
            <AccordionTrigger>Sort By</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-newest"
                    checked={filters.sortBy === 'newest'}
                    onCheckedChange={(checked) => 
                      checked && handleSortChange('newest')
                    }
                  />
                  <Label
                    htmlFor="sort-newest"
                    className="text-sm cursor-pointer"
                  >
                    Newest
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-price-asc"
                    checked={filters.sortBy === 'price_asc'}
                    onCheckedChange={(checked) => 
                      checked && handleSortChange('price_asc')
                    }
                  />
                  <Label
                    htmlFor="sort-price-asc"
                    className="text-sm cursor-pointer"
                  >
                    Price: Low to High
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-price-desc"
                    checked={filters.sortBy === 'price_desc'}
                    onCheckedChange={(checked) => 
                      checked && handleSortChange('price_desc')
                    }
                  />
                  <Label
                    htmlFor="sort-price-desc"
                    className="text-sm cursor-pointer"
                  >
                    Price: High to Low
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sort-rating"
                    checked={filters.sortBy === 'rating'}
                    onCheckedChange={(checked) => 
                      checked && handleSortChange('rating')
                    }
                  />
                  <Label
                    htmlFor="sort-rating"
                    className="text-sm cursor-pointer"
                  >
                    Highest Rated
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-6 flex items-center gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductFilter;
