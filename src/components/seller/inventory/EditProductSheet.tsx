import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndianRupee, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateSellerProduct } from "@/services/sellerInventoryService";
import { SellerProduct } from "@/types/seller-inventory";

interface EditProductSheetProps {
  product: SellerProduct;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProductSheet: React.FC<EditProductSheetProps> = ({
  product,
  open,
  onClose,
  onSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [price, setPrice] = useState(product.price.toString());
  const [moq, setMoq] = useState(product.moq.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [leadTime, setLeadTime] = useState(product.lead_time_days?.toString() || "");
  const [dispatchLocation, setDispatchLocation] = useState(product.dispatch_location || "");
  const [status, setStatus] = useState(product.status);
  const [notes, setNotes] = useState(product.notes || "");

  useEffect(() => {
    if (open && product) {
      setPrice(product.price.toString());
      setMoq(product.moq.toString());
      setStock(product.stock.toString());
      setLeadTime(product.lead_time_days?.toString() || "");
      setDispatchLocation(product.dispatch_location || "");
      setStatus(product.status);
      setNotes(product.notes || "");
    }
  }, [open, product]);

  const handleSubmit = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await updateSellerProduct(product.id, {
        price: parseFloat(price),
        moq: parseInt(moq) || 1,
        stock: parseInt(stock) || 0,
        lead_time_days: leadTime ? parseInt(leadTime) : undefined,
        dispatch_location: dispatchLocation || undefined,
        status,
        notes: notes || undefined
      });

      toast({ title: "Product updated successfully" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product Listing</SheetTitle>
          <SheetDescription>
            Update your pricing, stock, and other listing details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Product Info (Read-only) */}
          <div className="p-4 bg-accent rounded-lg">
            <h4 className="font-medium">{product.catalog_products?.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {product.catalog_products?.brands?.name && (
                <Badge variant="outline">{product.catalog_products.brands.name}</Badge>
              )}
              {product.catalog_products?.hsn_code && (
                <span className="text-xs text-muted-foreground">
                  HSN: {product.catalog_products.hsn_code}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Product specifications are managed by the platform and cannot be edited.
            </p>
          </div>

          {/* Editable Fields */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Your Selling Price *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-price"
                    type="number"
                    className="pl-8"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-moq">Min Order Qty (MOQ)</Label>
                <Input
                  id="edit-moq"
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Available Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-leadTime">Lead Time (days)</Label>
                <Input
                  id="edit-leadTime"
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dispatchLocation">Dispatch Location</Label>
              <Input
                id="edit-dispatchLocation"
                placeholder="e.g., Bangalore, Mumbai"
                value={dispatchLocation}
                onChange={(e) => setDispatchLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Listing Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Internal Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Notes for your reference only"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !price}
            >
              {submitting ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EditProductSheet;
