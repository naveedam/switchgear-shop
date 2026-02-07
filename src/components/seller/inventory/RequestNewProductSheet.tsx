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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp, Plus, X, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createProductRequest } from "@/services/sellerInventoryService";
import { supabase } from "@/integrations/supabase/client";

interface RequestNewProductSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'circuit_breakers', label: 'Circuit Breakers' },
  { value: 'contactors_relays', label: 'Contactors & Relays' },
  { value: 'switchgear', label: 'Switchgear' },
  { value: 'cables_wires', label: 'Cables & Wires' },
  { value: 'enclosures', label: 'Enclosures' },
  { value: 'motors_drives', label: 'Motors & Drives' },
  { value: 'measuring_instruments', label: 'Measuring Instruments' },
  { value: 'power_distribution', label: 'Power Distribution' },
  { value: 'automation', label: 'Automation' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'other', label: 'Other' },
];

const RequestNewProductSheet: React.FC<RequestNewProductSheetProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDatasheet, setUploadingDatasheet] = useState(false);
  
  // Form state
  const [brandName, setBrandName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [datasheetUrl, setDatasheetUrl] = useState("");
  const [datasheetName, setDatasheetName] = useState("");
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" }
  ]);

  useEffect(() => {
    if (!open) {
      // Reset form when closed
      setBrandName("");
      setModelNumber("");
      setCategory("");
      setDescription("");
      setDatasheetUrl("");
      setDatasheetName("");
      setSpecs([{ key: "", value: "" }]);
    }
  }, [open]);

  const handleDatasheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file",
        variant: "destructive"
      });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingDatasheet(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-request-docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-request-docs')
        .getPublicUrl(fileName);

      setDatasheetUrl(publicUrl);
      setDatasheetName(file.name);
      toast({ title: "Datasheet uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setUploadingDatasheet(false);
    }
  };

  const addSpec = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validation
    if (!brandName.trim()) {
      toast({ title: "Brand name is required", variant: "destructive" });
      return;
    }
    if (!modelNumber.trim()) {
      toast({ title: "Model number is required", variant: "destructive" });
      return;
    }
    if (!datasheetUrl) {
      toast({ title: "Datasheet upload is required", variant: "destructive" });
      return;
    }

    // Convert specs to object
    const technicalSpecs: Record<string, string> = {};
    specs.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) {
        technicalSpecs[spec.key.trim()] = spec.value.trim();
      }
    });

    setSubmitting(true);
    try {
      await createProductRequest(user.id, {
        brand_name: brandName.trim(),
        model_number: modelNumber.trim(),
        category: category || undefined,
        description: description.trim() || undefined,
        technical_specs: Object.keys(technicalSpecs).length > 0 ? technicalSpecs : undefined,
        datasheet_url: datasheetUrl
      });

      toast({
        title: "Request submitted!",
        description: "We'll review your product request and notify you once approved."
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error submitting request",
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
          <SheetTitle>Request New Product</SheetTitle>
          <SheetDescription>
            Can't find a product in the catalog? Submit a request for our team to add it.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Info Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Review Process</p>
                <p>New product requests are reviewed within 24-48 hours. 
                A datasheet is mandatory for approval.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  placeholder="e.g., Schneider, ABB"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number *</Label>
                <Input
                  id="modelNumber"
                  placeholder="e.g., NSX160F"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Datasheet Upload */}
            <div className="space-y-2">
              <Label>Datasheet Upload *</Label>
              {datasheetUrl ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileUp className="h-4 w-4 text-green-600" />
                  <span className="flex-1 text-sm truncate">{datasheetName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDatasheetUrl("");
                      setDatasheetName("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="datasheet"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleDatasheetUpload}
                    disabled={uploadingDatasheet}
                  />
                  <label
                    htmlFor="datasheet"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">
                      {uploadingDatasheet ? "Uploading..." : "Click to upload datasheet"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF or Image (max 10MB)
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Technical Specs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Technical Specifications</Label>
                <Button variant="ghost" size="sm" onClick={addSpec}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {specs.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Parameter (e.g., Rated Current)"
                      value={spec.key}
                      onChange={(e) => updateSpec(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g., 160A)"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    {specs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpec(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
              disabled={submitting || !brandName || !modelNumber || !datasheetUrl}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RequestNewProductSheet;
