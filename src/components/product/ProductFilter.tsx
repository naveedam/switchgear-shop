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
import { Search, X } from 'lucide-react';

interface ProductFilterProps {
  initialFilters?: FilterType;
  onFilterChange: (filters: FilterType) => void;
  subcategories: Subcategory[];
  minMaxPrice: { min: number; max: number };
}

const BRAND_OPTIONS = [
  'Siemens', 'Schneider Electric', 'ABB', 'L&T', 'Legrand',
  'Havells', 'C&S Electric', 'BCH', 'Polycab', 'Omron',
];

const CURRENT_OPTIONS = ['16A', '25A', '32A', '40A', '63A', '100A', '125A', '160A', '200A', '250A', '400A', '630A', '800A'];
const POLE_OPTIONS = ['1P', '2P', '3P', '3P+N', '4P'];
const BREAKING_CAPACITY_OPTIONS = ['6kA', '10kA', '16kA', '25kA', '36kA', '50kA', '70kA'];
const VOLTAGE_OPTIONS = ['230V', '240V', '415V', '440V', '690V'];

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

  const handleSubcategoryChange = (subcategoryId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      subcategoryId: checked ? subcategoryId : undefined,
    }));
  };

  const handleInStockChange = (checked: boolean) => {
    setFilters(prev => ({ ...prev, inStock: checked }));
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

  const activeFilterCount = [
    filters.subcategoryId,
    filters.inStock,
    searchTerm,
    priceRange[0] !== minMaxPrice.min || priceRange[1] !== minMaxPrice.max,
  ].filter(Boolean).length;

  return (
    <Card className="border-border">
      <CardContent className="p-3">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Accordion type="multiple" defaultValue={['subcategories', 'brand', 'current', 'poles', 'price', 'availability']} className="space-y-0">
          {/* Subcategories */}
          <AccordionItem value="subcategories" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Category
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {subcategories.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-muted/50">
                    <Checkbox
                      checked={filters.subcategoryId === sub.id}
                      onCheckedChange={(c) => handleSubcategoryChange(sub.id, c as boolean)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs text-foreground">{sub.name}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Brand */}
          <AccordionItem value="brand" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Brand
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {BRAND_OPTIONS.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-muted/50">
                    <Checkbox className="h-3.5 w-3.5" />
                    <span className="text-xs text-foreground">{brand}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rated Current */}
          <AccordionItem value="current" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Rated Current
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-wrap gap-1">
                {CURRENT_OPTIONS.map(val => (
                  <button key={val} className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary hover:bg-primary/5 text-foreground transition-colors">
                    {val}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Poles */}
          <AccordionItem value="poles" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Poles
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-wrap gap-1">
                {POLE_OPTIONS.map(val => (
                  <button key={val} className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary hover:bg-primary/5 text-foreground transition-colors">
                    {val}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Breaking Capacity */}
          <AccordionItem value="breaking" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Breaking Capacity
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-wrap gap-1">
                {BREAKING_CAPACITY_OPTIONS.map(val => (
                  <button key={val} className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary hover:bg-primary/5 text-foreground transition-colors">
                    {val}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Voltage */}
          <AccordionItem value="voltage" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Voltage
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-wrap gap-1">
                {VOLTAGE_OPTIONS.map(val => (
                  <button key={val} className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary hover:bg-primary/5 text-foreground transition-colors">
                    {val}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price */}
          <AccordionItem value="price" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Price Range
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <Slider
                value={priceRange}
                min={minMaxPrice.min}
                max={minMaxPrice.max}
                step={100}
                onValueChange={handlePriceChange}
                className="my-4"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>₹{priceRange[0].toLocaleString()}</span>
                <span>₹{priceRange[1].toLocaleString()}</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Availability */}
          <AccordionItem value="availability" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
              Availability
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1">
                <Checkbox
                  checked={filters.inStock}
                  onCheckedChange={(c) => handleInStockChange(c as boolean)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs text-foreground">In Stock Only</span>
              </label>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <Button onClick={applyFilters} size="sm" className="flex-1 h-8 text-xs">
            Apply{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs px-2">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductFilter;
