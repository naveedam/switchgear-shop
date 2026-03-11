import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Package, IndianRupee, ArrowLeft, Check, Sparkles, 
  Upload, FileText, Image as ImageIcon, Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { searchCatalogProducts, addSellerProduct, getSellerProducts } from "@/services/sellerInventoryService";
import { CatalogProduct } from "@/types/seller-inventory";
import { parseProductName, KNOWN_BRANDS, ParsedProduct } from "@/lib/productNameParser";
import { categoryFieldMappings, CategoryFieldGroup } from "@/config/categoryFields";
import ListingQualityScore from "./ListingQualityScore";
import DuplicateWarning from "./DuplicateWarning";
import { supabase } from "@/integrations/supabase/client";

interface AddFromCatalogSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddFromCatalogSheet: React.FC<AddFromCatalogSheetProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'search' | 'details'>('search');
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [parsedInfo, setParsedInfo] = useState<ParsedProduct | null>(null);
  
  // Listing form
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("1");
  const [stock, setStock] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [dispatchLocation, setDispatchLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Enhanced fields
  const [selectedBrand, setSelectedBrand] = useState("");
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [productImage, setProductImage] = useState<File | null>(null);
  const [datasheet, setDatasheet] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Duplicate detection
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('search');
      setSearchTerm("");
      setSearchResults([]);
      setSelectedProduct(null);
      setParsedInfo(null);
      setPrice("");
      setMoq("1");
      setStock("");
      setLeadTime("");
      setDispatchLocation("");
      setNotes("");
      setSelectedBrand("");
      setSpecValues({});
      setProductImage(null);
      setDatasheet(null);
      setImagePreview(null);
      setDuplicates([]);
      setDuplicateChecked(false);
      setDuplicateDismissed(false);
    }
  }, [open]);

  // Smart parse on search term change
  useEffect(() => {
    if (searchTerm.length > 3) {
      const parsed = parseProductName(searchTerm);
      setParsedInfo(parsed);
      if (parsed.brand) setSelectedBrand(parsed.brand);
    } else {
      setParsedInfo(null);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const results = await searchCatalogProducts(searchTerm);
      setSearchResults(results);
    } catch {
      toast({ title: "Search failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const checkDuplicates = useCallback(async (product: CatalogProduct) => {
    if (!user?.id) return;
    try {
      const existing = await getSellerProducts(user.id);
      const similar = existing.filter(p => 
        p.catalog_product_id === product.id ||
        p.catalog_products?.name?.toLowerCase().includes(product.name.split(' ').slice(0, 2).join(' ').toLowerCase())
      );
      setDuplicates(similar.map(p => ({
        id: p.id,
        name: p.catalog_products?.name || 'Unknown',
        price: p.price,
      })));
      setDuplicateChecked(true);
    } catch {
      // Silently fail duplicate check
      setDuplicateChecked(true);
    }
  }, [user?.id]);

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    if (product.suggested_price) {
      setPrice(product.suggested_price.toString());
    }
    if (product.brands?.name) {
      setSelectedBrand(product.brands.name);
    }
    // Pre-fill specs from parsed info
    if (parsedInfo) {
      const newSpecs: Record<string, string> = {};
      if (parsedInfo.ratedCurrent) newSpecs['rated_current'] = `${parsedInfo.ratedCurrent}A`;
      if (parsedInfo.poles) newSpecs['number_of_poles'] = `${parsedInfo.poles}`;
      if (parsedInfo.breakingCapacity) newSpecs['breaking_capacity'] = `${parsedInfo.breakingCapacity}kA`;
      if (parsedInfo.voltage) newSpecs['rated_voltage'] = `${parsedInfo.voltage}V${parsedInfo.voltageType ? ' ' + parsedInfo.voltageType : ''}`;
      if (parsedInfo.coilVoltage) newSpecs['coil_voltage'] = parsedInfo.coilVoltage;
      if (parsedInfo.utilizationCategory) newSpecs['utilization_category'] = parsedInfo.utilizationCategory;
      if (parsedInfo.ctRatio) newSpecs['ct_ratio'] = parsedInfo.ctRatio;
      if (parsedInfo.accuracyClass) newSpecs['class_accuracy'] = parsedInfo.accuracyClass;
      setSpecValues(newSpecs);
    }
    checkDuplicates(product);
    setStep('details');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDatasheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDatasheet(file);
  };

  // Get dynamic spec fields based on category
  const dynamicFields: CategoryFieldGroup[] = useMemo(() => {
    const slug = selectedProduct?.category || parsedInfo?.categorySlug;
    if (!slug) return [];
    return categoryFieldMappings[slug] || [];
  }, [selectedProduct?.category, parsedInfo?.categorySlug]);

  // Show only first group of spec fields to keep it manageable
  const visibleSpecFields = useMemo(() => {
    if (dynamicFields.length === 0) return [];
    // Show first 2 groups max, first 4 fields each
    return dynamicFields.slice(0, 2).map(group => ({
      ...group,
      fields: group.fields.slice(0, 6),
    }));
  }, [dynamicFields]);

  // Quality score checks
  const qualityChecks = useMemo(() => [
    { label: 'Price set', met: !!price && parseFloat(price) > 0 },
    { label: 'Stock entered', met: !!stock && parseInt(stock) > 0 },
    { label: 'Brand specified', met: !!selectedBrand },
    { label: 'Image uploaded', met: !!productImage },
    { label: 'Specs filled', met: Object.keys(specValues).length >= 2 },
    { label: 'Datasheet attached', met: !!datasheet },
    { label: 'Lead time set', met: !!leadTime },
    { label: 'Dispatch location', met: !!dispatchLocation },
  ], [price, stock, selectedBrand, productImage, specValues, datasheet, leadTime, dispatchLocation]);

  const handleSubmit = async () => {
    if (!user?.id || !selectedProduct) return;
    if (!price || parseFloat(price) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Upload image if provided
      let imageUrl: string | undefined;
      if (productImage) {
        const ext = productImage.name.split('.').pop();
        const path = `${user.id}/${selectedProduct.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, productImage, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Upload datasheet if provided
      if (datasheet) {
        const dsPath = `${user.id}/${selectedProduct.id}-datasheet.pdf`;
        await supabase.storage
          .from('product-request-docs')
          .upload(dsPath, datasheet, { upsert: true });
      }

      await addSellerProduct(user.id, selectedProduct.id, {
        price: parseFloat(price),
        moq: parseInt(moq) || 1,
        stock: parseInt(stock) || 0,
        lead_time_days: leadTime ? parseInt(leadTime) : undefined,
        dispatch_location: dispatchLocation || undefined,
        notes: notes || undefined,
      });
      
      toast({
        title: "Product added to your inventory!",
        description: `${selectedProduct.name} is now listed in your store`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Product already listed",
          description: "You've already added this product to your inventory",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error adding product",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 'search' ? 'Add Product from Catalog' : 'Set Your Listing Details'}
          </SheetTitle>
          <SheetDescription>
            {step === 'search' 
              ? 'Type a product name — we\'ll auto-detect specs and find matching catalog items'
              : 'Configure your listing with pricing, stock, and specifications'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {step === 'search' ? (
            <>
              {/* Smart Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder='e.g. "MCCB 250A 4P 36kA Siemens"'
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? "..." : "Search"}
                </Button>
              </div>

              {/* Parsed Info Display */}
              {parsedInfo && parsedInfo.componentType && (
                <div className="rounded-lg border bg-accent/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Auto-detected specifications
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedInfo.componentType && (
                      <Badge variant="default">{parsedInfo.componentType}</Badge>
                    )}
                    {parsedInfo.category && (
                      <Badge variant="secondary">{parsedInfo.category}</Badge>
                    )}
                    {parsedInfo.ratedCurrent && (
                      <Badge variant="outline">{parsedInfo.ratedCurrent}A</Badge>
                    )}
                    {parsedInfo.poles && (
                      <Badge variant="outline">{parsedInfo.poles}P</Badge>
                    )}
                    {parsedInfo.breakingCapacity && (
                      <Badge variant="outline">{parsedInfo.breakingCapacity}kA</Badge>
                    )}
                    {parsedInfo.voltage && (
                      <Badge variant="outline">
                        {parsedInfo.voltage}V{parsedInfo.voltageType ? ` ${parsedInfo.voltageType}` : ''}
                      </Badge>
                    )}
                    {parsedInfo.coilVoltage && (
                      <Badge variant="outline">Coil {parsedInfo.coilVoltage}</Badge>
                    )}
                    {parsedInfo.ctRatio && (
                      <Badge variant="outline">CT {parsedInfo.ctRatio}</Badge>
                    )}
                    {parsedInfo.brand && (
                      <Badge variant="outline">{parsedInfo.brand}</Badge>
                    )}
                    {parsedInfo.utilizationCategory && (
                      <Badge variant="outline">{parsedInfo.utilizationCategory}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {searchResults.length === 0 && searchTerm && !searching && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No products found. Try different keywords.</p>
                    <Button variant="link" className="mt-2" onClick={onClose}>
                      Request a new product instead
                    </Button>
                  </div>
                )}
                
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {product.brands?.name && (
                            <Badge variant="outline">{product.brands.name}</Badge>
                          )}
                          {product.category && (
                            <span className="text-xs text-muted-foreground">
                              {product.category.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                      {product.suggested_price && (
                        <div className="text-right ml-4">
                          <div className="text-xs text-muted-foreground">MRP</div>
                          <div className="flex items-center text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {product.suggested_price.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <Button variant="ghost" size="sm" onClick={() => setStep('search')} className="mb-1">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Search
              </Button>

              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="p-4 bg-accent rounded-lg">
                  <h4 className="font-medium">{selectedProduct.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedProduct.brands?.name && (
                      <Badge variant="outline">{selectedProduct.brands.name}</Badge>
                    )}
                    {selectedProduct.hsn_code && (
                      <span className="text-xs text-muted-foreground">HSN: {selectedProduct.hsn_code}</span>
                    )}
                    {parsedInfo?.category && (
                      <Badge variant="secondary" className="text-xs">{parsedInfo.category}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Duplicate Warning */}
              {duplicateChecked && duplicates.length > 0 && !duplicateDismissed && (
                <DuplicateWarning
                  duplicates={duplicates}
                  onContinue={() => setDuplicateDismissed(true)}
                  onCancel={onClose}
                />
              )}

              {/* Quality Score */}
              <ListingQualityScore checks={qualityChecks} />

              {/* Pricing & Stock */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" /> Pricing & Availability
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs">Selling Price *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="price" type="number" placeholder="0.00" className="pl-8"
                        value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="moq" className="text-xs">MOQ</Label>
                    <Input id="moq" type="number" placeholder="1"
                      value={moq} onChange={(e) => setMoq(e.target.value)} min="1" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stock" className="text-xs">Stock</Label>
                    <Input id="stock" type="number" placeholder="0"
                      value={stock} onChange={(e) => setStock(e.target.value)} min="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="leadTime" className="text-xs">Lead Time (days)</Label>
                    <Input id="leadTime" type="number" placeholder="3-5"
                      value={leadTime} onChange={(e) => setLeadTime(e.target.value)} min="0" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Brand Selection */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Brand
                </h3>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50 max-h-60">
                    {KNOWN_BRANDS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="other">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Dynamic Spec Fields */}
              {visibleSpecFields.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Specifications
                    {parsedInfo?.category && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {parsedInfo.category}
                      </Badge>
                    )}
                  </h3>
                  {visibleSpecFields.map((group, gi) => (
                    <div key={gi} className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{group.title}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {group.fields.map(field => (
                          <div key={field.name} className="space-y-1">
                            <Label className="text-xs">
                              {field.label}
                              {field.required && <span className="text-destructive ml-0.5">*</span>}
                            </Label>
                            {field.type === 'select' && field.options ? (
                              <Select
                                value={specValues[field.name] || ''}
                                onValueChange={v => setSpecValues(prev => ({ ...prev, [field.name]: v }))}
                              >
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder={`Select`} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  {field.options.map(o => (
                                    <SelectItem key={o} value={o}>{o}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                className="h-9 text-xs"
                                placeholder={field.placeholder || ''}
                                value={specValues[field.name] || ''}
                                onChange={e => setSpecValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                                type={field.type === 'number' ? 'number' : 'text'}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Image & Datasheet Upload */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Attachments
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Product Image</Label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-contain rounded" />
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Datasheet (PDF)</Label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors">
                      {datasheet ? (
                        <>
                          <FileText className="h-6 w-6 text-primary mb-1" />
                          <span className="text-xs text-foreground truncate max-w-full">{datasheet.name}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload PDF</span>
                        </>
                      )}
                      <input type="file" accept=".pdf" className="hidden" onChange={handleDatasheetChange} />
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location & Notes */}
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dispatchLocation" className="text-xs">Dispatch Location</Label>
                  <Input id="dispatchLocation" placeholder="e.g., Bangalore, Mumbai"
                    value={dispatchLocation} onChange={(e) => setDispatchLocation(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs">Internal Notes (optional)</Label>
                  <Textarea id="notes" placeholder="Not visible to buyers"
                    value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
              </div>

              {/* Auto-generated Keywords */}
              {parsedInfo && parsedInfo.searchKeywords.length > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Auto-generated search keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {parsedInfo.searchKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pt-2 pb-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !price}>
                  {submitting ? "Adding..." : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add to Inventory
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddFromCatalogSheet;
