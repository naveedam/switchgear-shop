import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Package, 
  Upload, 
  FileQuestion, 
  Edit2, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getSellerProducts, 
  getSellerProductRequests,
  getSellerBulkUploads,
  deleteSellerProduct 
} from "@/services/sellerInventoryService";
import { SellerProduct, ProductRequest, BulkUpload } from "@/types/seller-inventory";
import AddFromCatalogSheet from "@/components/seller/inventory/AddFromCatalogSheet";
import RequestNewProductSheet from "@/components/seller/inventory/RequestNewProductSheet";
import BulkUploadSheet from "@/components/seller/inventory/BulkUploadSheet";
import EditProductSheet from "@/components/seller/inventory/EditProductSheet";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SellerInventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sheet states
  const [showAddFromCatalog, setShowAddFromCatalog] = useState(false);
  const [showRequestNew, setShowRequestNew] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<SellerProduct | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [productsData, requestsData, uploadsData] = await Promise.all([
        getSellerProducts(user.id),
        getSellerProductRequests(user.id),
        getSellerBulkUploads(user.id)
      ]);
      setProducts(productsData);
      setProductRequests(requestsData);
      setBulkUploads(uploadsData);
    } catch (error) {
      console.error("Error loading inventory data:", error);
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteSellerProduct(deletingProduct.id);
      toast({ title: "Product removed from your inventory" });
      loadData();
    } catch (error) {
      toast({
        title: "Error removing product",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.catalog_products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.catalog_products?.brands?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'duplicate':
        return <Badge variant="secondary">Duplicate</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">List products from the master catalog or request new additions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddFromCatalog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add from Catalog
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" onClick={() => setShowRequestNew(true)}>
            <FileQuestion className="h-4 w-4 mr-2" />
            Request New Product
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Why Master Catalog?</p>
              <p className="text-sm text-blue-700">
                SwitchgearShop uses a standardized product catalog to ensure accurate BOM matching, 
                specification-based search, and reliable procurement. You can only list products 
                from this catalog or request new additions for admin review.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Listings ({products.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            Product Requests ({productRequests.length})
          </TabsTrigger>
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Uploads ({bulkUploads.length})
          </TabsTrigger>
        </TabsList>

        {/* My Listings Tab */}
        <TabsContent value="listings">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Active Product Listings</CardTitle>
                  <CardDescription>Products you're selling on the marketplace</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products listed yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding products from the master catalog
                  </p>
                  <Button onClick={() => setShowAddFromCatalog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Your Price</TableHead>
                        <TableHead className="text-center">MOQ</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Lead Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate">{product.catalog_products?.name}</div>
                            {product.catalog_products?.category && (
                              <div className="text-xs text-muted-foreground">
                                {product.catalog_products.category.replace(/_/g, ' ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{product.catalog_products?.brands?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <IndianRupee className="h-3 w-3 mr-0.5" />
                              {product.price.toLocaleString('en-IN')}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{product.moq}</TableCell>
                          <TableCell className="text-center">{product.stock}</TableCell>
                          <TableCell className="text-center">
                            {product.lead_time_days ? `${product.lead_time_days} days` : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(product.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>New Product Requests</CardTitle>
              <CardDescription>
                Products you've requested to be added to the master catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No product requests</h3>
                  <p className="text-muted-foreground mb-4">
                    Can't find a product? Request it to be added to the catalog
                  </p>
                  <Button variant="outline" onClick={() => setShowRequestNew(true)}>
                    Request New Product
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Model Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.brand_name}</TableCell>
                          <TableCell>{request.model_number}</TableCell>
                          <TableCell>
                            {request.category?.replace(/_/g, ' ') || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell>{getRequestStatusBadge(request.status)}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate text-sm text-muted-foreground">
                              {request.admin_notes || request.rejection_reason || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Uploads Tab */}
        <TabsContent value="uploads">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload History</CardTitle>
              <CardDescription>
                Track your inventory bulk upload progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bulkUploads.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bulk uploads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload an Excel or CSV file to add multiple products at once
                  </p>
                  <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Inventory File
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead className="text-center">Total Rows</TableHead>
                        <TableHead className="text-center">Matched</TableHead>
                        <TableHead className="text-center">Unmatched</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkUploads.map((upload) => (
                        <TableRow key={upload.id}>
                          <TableCell className="font-medium">{upload.filename}</TableCell>
                          <TableCell className="text-center">{upload.total_rows}</TableCell>
                          <TableCell className="text-center text-green-600">{upload.matched_rows}</TableCell>
                          <TableCell className="text-center text-orange-600">{upload.unmatched_rows}</TableCell>
                          <TableCell>
                            <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                              {upload.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(upload.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheets/Dialogs */}
      <AddFromCatalogSheet 
        open={showAddFromCatalog} 
        onClose={() => setShowAddFromCatalog(false)}
        onSuccess={loadData}
      />
      
      <RequestNewProductSheet
        open={showRequestNew}
        onClose={() => setShowRequestNew(false)}
        onSuccess={loadData}
      />
      
      <BulkUploadSheet
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={loadData}
      />

      {editingProduct && (
        <EditProductSheet
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={loadData}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product from Inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deletingProduct?.catalog_products?.name}" from your listings. 
              Buyers will no longer see this product from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SellerInventory;
