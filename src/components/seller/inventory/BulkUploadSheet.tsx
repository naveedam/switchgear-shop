import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileUp, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  createBulkUpload, 
  matchBulkUploadItems,
  getBulkUploadItems,
  confirmBulkUploadItems
} from "@/services/sellerInventoryService";
import { BulkUploadItem } from "@/types/seller-inventory";
import * as XLSX from 'xlsx';

interface BulkUploadSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  row_number: number;
  raw_data: Record<string, unknown>;
  input_brand?: string;
  input_model?: string;
  input_description?: string;
  price?: number;
  moq?: number;
  stock?: number;
  lead_time_days?: number;
}

const BulkUploadSheet: React.FC<BulkUploadSheetProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const [processing, setProcessing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setStep('upload');
      setUploadId(null);
      setItems([]);
      setSelectedItems(new Set());
    }
  }, [open]);

  const downloadTemplate = () => {
    const template = [
      {
        'Brand': 'Schneider',
        'Model/Part Number': 'NSX160F',
        'Description': '160A 3-Pole MCCB with TM-D Trip',
        'Your Price (INR)': 15000,
        'MOQ': 1,
        'Stock Quantity': 50,
        'Lead Time (Days)': 3
      },
      {
        'Brand': 'ABB',
        'Model/Part Number': 'A50-30-11',
        'Description': '50A 3-Pole Contactor 230V AC',
        'Your Price (INR)': 2500,
        'MOQ': 5,
        'Stock Quantity': 100,
        'Lead Time (Days)': 2
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
    XLSX.writeFile(wb, 'SwitchgearShop_Inventory_Template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel (.xlsx) or CSV file",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "Empty file",
          description: "The uploaded file has no data rows",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }

      // Parse rows
      const parsedRows: ParsedRow[] = jsonData.map((row: any, index) => ({
        row_number: index + 1,
        raw_data: row,
        input_brand: row['Brand'] || row['brand'] || row['BRAND'],
        input_model: row['Model/Part Number'] || row['Model'] || row['Part Number'] || row['SKU'],
        input_description: row['Description'] || row['description'] || row['Product Name'],
        price: parseFloat(row['Your Price (INR)'] || row['Price'] || row['price']) || undefined,
        moq: parseInt(row['MOQ'] || row['Min Order'] || row['moq']) || 1,
        stock: parseInt(row['Stock Quantity'] || row['Stock'] || row['Qty']) || 0,
        lead_time_days: parseInt(row['Lead Time (Days)'] || row['Lead Time']) || undefined
      }));

      // Create bulk upload
      const upload = await createBulkUpload(user.id, file.name, parsedRows);
      setUploadId(upload.id);

      // Start matching
      await matchBulkUploadItems(upload.id);

      // Load matched items
      const matchedItems = await getBulkUploadItems(upload.id);
      setItems(matchedItems);
      
      // Auto-select matched items
      const matched = new Set(
        matchedItems
          .filter(item => item.match_status === 'matched')
          .map(item => item.id)
      );
      setSelectedItems(matched);

      setStep('review');
      toast({
        title: "File processed",
        description: `${matchedItems.filter(i => i.match_status === 'matched').length} of ${matchedItems.length} items matched`
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Processing failed",
        description: error.message || "Please check your file format",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirm = async () => {
    if (!user?.id) return;

    const selectedData = items
      .filter(item => selectedItems.has(item.id) && item.matched_catalog_product_id)
      .map(item => ({
        id: item.id,
        catalog_product_id: item.matched_catalog_product_id!,
        price: item.price || 0,
        moq: item.moq || 1,
        stock: item.stock || 0,
        lead_time_days: item.lead_time_days
      }));

    if (selectedData.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one matched item to import",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const count = await confirmBulkUploadItems(user.id, selectedData);
      toast({
        title: "Import complete!",
        description: `${count} products added to your inventory`
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial_match':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unmatched':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === 'upload' && 'Bulk Inventory Upload'}
            {step === 'review' && 'Review Matched Products'}
            {step === 'confirm' && 'Confirm Import'}
          </SheetTitle>
          <SheetDescription>
            {step === 'upload' && 'Upload an Excel or CSV file with your inventory data'}
            {step === 'review' && 'Review catalog matches and select items to import'}
            {step === 'confirm' && 'Confirm the selected items to add to your inventory'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 'upload' && (
            <>
              {/* Template Download */}
              <div className="p-4 border rounded-lg bg-accent">
                <h4 className="font-medium mb-2">Download Template</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use our template to ensure your data is formatted correctly
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel Template
                </Button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="bulkFile"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={processing}
                />
                <label
                  htmlFor="bulkFile"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {processing ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  ) : (
                    <FileUp className="h-10 w-10 text-muted-foreground mb-3" />
                  )}
                  <span className="text-lg font-medium">
                    {processing ? "Processing..." : "Click to upload your file"}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    Excel (.xlsx) or CSV format
                  </span>
                </label>
              </div>

              {/* Required Columns */}
              <div className="text-sm">
                <h4 className="font-medium mb-2">Required Columns</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• <strong>Brand</strong> - Product brand name</li>
                  <li>• <strong>Model/Part Number</strong> - Product model or SKU</li>
                  <li>• <strong>Your Price (INR)</strong> - Your selling price</li>
                </ul>
                <h4 className="font-medium mt-4 mb-2">Optional Columns</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Description, MOQ, Stock Quantity, Lead Time (Days)</li>
                </ul>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              {/* Summary */}
              <div className="flex gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {items.filter(i => i.match_status === 'matched').length} Matched
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  {items.filter(i => i.match_status === 'partial_match').length} Partial
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  {items.filter(i => i.match_status === 'unmatched').length} Unmatched
                </Badge>
              </div>

              {/* Items Table */}
              <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === items.filter(i => i.match_status === 'matched').length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(new Set(
                                items.filter(i => i.match_status === 'matched').map(i => i.id)
                              ));
                            } else {
                              setSelectedItems(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Row</TableHead>
                      <TableHead>Your Input</TableHead>
                      <TableHead>Matched Product</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow 
                        key={item.id}
                        className={item.match_status !== 'matched' ? 'opacity-60' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            disabled={item.match_status !== 'matched'}
                          />
                        </TableCell>
                        <TableCell>{item.row_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.input_brand} {item.input_model}</div>
                            {item.price && (
                              <div className="text-muted-foreground">₹{item.price.toLocaleString('en-IN')}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.catalog_products ? (
                            <div className="text-sm">
                              <div className="font-medium truncate max-w-xs">
                                {item.catalog_products.name}
                              </div>
                              {item.catalog_products.brands?.name && (
                                <div className="text-muted-foreground">
                                  {item.catalog_products.brands.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No match found</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getMatchStatusIcon(item.match_status)}
                            <span className="text-xs capitalize">{item.match_status.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={processing || selectedItems.size === 0}
                >
                  {processing ? "Importing..." : `Import ${selectedItems.size} Products`}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Unmatched products can be requested via "Request New Product" form
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BulkUploadSheet;
