import React, { useState, useEffect } from "react";
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
import { Search, Package, IndianRupee, ArrowLeft, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { searchCatalogProducts, addSellerProduct } from "@/services/sellerInventoryService";
import { CatalogProduct } from "@/types/seller-inventory";

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
  
  // Listing form
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("1");
  const [stock, setStock] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [dispatchLocation, setDispatchLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset state when closed
      setStep('search');
      setSearchTerm("");
      setSearchResults([]);
      setSelectedProduct(null);
      setPrice("");
      setMoq("1");
      setStock("");
      setLeadTime("");
      setDispatchLocation("");
      setNotes("");
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const results = await searchCatalogProducts(searchTerm);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    if (product.suggested_price) {
      setPrice(product.suggested_price.toString());
    }
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!user?.id || !selectedProduct) return;
    
    if (!price || parseFloat(price) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await addSellerProduct(user.id, selectedProduct.id, {
        price: parseFloat(price),
        moq: parseInt(moq) || 1,
        stock: parseInt(stock) || 0,
        lead_time_days: leadTime ? parseInt(leadTime) : undefined,
        dispatch_location: dispatchLocation || undefined,
        notes: notes || undefined
      });
      
      toast({
        title: "Product added to your inventory!",
        description: `${selectedProduct.name} is now listed in your store`
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Product already listed",
          description: "You've already added this product to your inventory",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error adding product",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 'search' ? 'Add Product from Catalog' : 'Set Your Listing Details'}
          </SheetTitle>
          <SheetDescription>
            {step === 'search' 
              ? 'Search the master catalog to find the product you want to list'
              : 'Set your price, stock, and other details for this listing'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 'search' ? (
            <>
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name, model, brand..."
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

              {/* Search Results */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {searchResults.length === 0 && searchTerm && !searching && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No products found. Try different keywords.</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => {
                        onClose();
                        // Could trigger request new product flow here
                      }}
                    >
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('search')}
                className="mb-2"
              >
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
                      <span className="text-xs text-muted-foreground">
                        HSN: {selectedProduct.hsn_code}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Listing Form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Your Selling Price *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        className="pl-8"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="moq">Min Order Qty (MOQ)</Label>
                    <Input
                      id="moq"
                      type="number"
                      placeholder="1"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Available Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="leadTime">Lead Time (days)</Label>
                    <Input
                      id="leadTime"
                      type="number"
                      placeholder="3-5"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dispatchLocation">Dispatch Location</Label>
                  <Input
                    id="dispatchLocation"
                    placeholder="e.g., Bangalore, Mumbai"
                    value={dispatchLocation}
                    onChange={(e) => setDispatchLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notes for your reference only, not visible to buyers"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || !price}
                >
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
