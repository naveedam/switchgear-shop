import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileQuestion, 
  Check, 
  X, 
  ExternalLink, 
  Clock, 
  AlertCircle,
  FileText,
  Building2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAllProductRequests, reviewProductRequest } from "@/services/sellerInventoryService";
import { ProductRequest } from "@/types/seller-inventory";

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

const AdminProductRequests: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  
  // Review dialog
  const [reviewingRequest, setReviewingRequest] = useState<ProductRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Approval form
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productHsn, setProductHsn] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadRequests();
  }, [isAuthenticated, user, navigate, filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllProductRequests(filter);
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error loading requests",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (request: ProductRequest) => {
    setReviewingRequest(request);
    setDecision('approved');
    setAdminNotes("");
    setRejectionReason("");
    // Pre-fill approval form
    setProductName(`${request.brand_name} ${request.model_number}`);
    setProductDescription(request.description || "");
    setProductCategory(request.category || "");
    setProductHsn("");
    setSuggestedPrice("");
  };

  const handleReviewSubmit = async () => {
    if (!reviewingRequest) return;

    if (decision === 'rejected' && !rejectionReason.trim()) {
      toast({ title: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    if (decision === 'approved' && !productName.trim()) {
      toast({ title: "Please provide a product name", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await reviewProductRequest(
        reviewingRequest.id,
        decision,
        adminNotes.trim() || undefined,
        decision === 'rejected' ? rejectionReason.trim() : undefined,
        decision === 'approved' ? {
          name: productName.trim(),
          description: productDescription.trim() || undefined,
          category: productCategory || undefined,
          hsn_code: productHsn.trim() || undefined,
          suggested_price: suggestedPrice ? parseFloat(suggestedPrice) : undefined
        } : undefined
      );

      toast({
        title: decision === 'approved' ? "Product approved and added to catalog" : "Request rejected",
        description: decision === 'approved' 
          ? `${productName} is now available in the master catalog`
          : "The seller has been notified"
      });
      
      setReviewingRequest(null);
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error processing request",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'duplicate':
        return <Badge variant="secondary">Duplicate</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Requests</h1>
          <p className="text-muted-foreground">Review and approve new product submissions from sellers</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            <AlertCircle className="h-4 w-4 mr-1" />
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <Card>
            <CardHeader>
              <CardTitle>Product Requests</CardTitle>
              <CardDescription>
                {filter === 'pending' 
                  ? "New product submissions awaiting your review"
                  : `Showing ${filter} requests`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No {filter} requests</h3>
                  <p className="text-muted-foreground">
                    {filter === 'pending' 
                      ? "All caught up! No new product requests to review."
                      : `No ${filter} requests found.`
                    }
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand / Model</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Datasheet</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="font-medium">{request.brand_name}</div>
                            <div className="text-sm text-muted-foreground">{request.model_number}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm">{request.companies?.name || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">{request.companies?.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.category?.replace(/_/g, ' ') || '-'}
                          </TableCell>
                          <TableCell>
                            {request.datasheet_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(request.datasheet_url, '_blank')}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            {request.status === 'pending' ? (
                              <Button size="sm" onClick={() => openReviewDialog(request)}>
                                Review
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => openReviewDialog(request)}>
                                View
                              </Button>
                            )}
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

      {/* Review Dialog */}
      <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reviewingRequest?.status === 'pending' ? 'Review Product Request' : 'Product Request Details'}
            </DialogTitle>
            <DialogDescription>
              {reviewingRequest?.brand_name} {reviewingRequest?.model_number}
            </DialogDescription>
          </DialogHeader>

          {reviewingRequest && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Seller</Label>
                  <p className="font-medium">{reviewingRequest.companies?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {new Date(reviewingRequest.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Brand</Label>
                  <p className="font-medium">{reviewingRequest.brand_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Model Number</Label>
                  <p className="font-medium">{reviewingRequest.model_number}</p>
                </div>
                {reviewingRequest.category && (
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{reviewingRequest.category.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {reviewingRequest.datasheet_url && (
                  <div>
                    <Label className="text-muted-foreground">Datasheet</Label>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => window.open(reviewingRequest.datasheet_url, '_blank')}
                    >
                      View Document <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {reviewingRequest.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{reviewingRequest.description}</p>
                </div>
              )}

              {reviewingRequest.technical_specs && Object.keys(reviewingRequest.technical_specs).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Technical Specifications</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(reviewingRequest.technical_specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Form (only for pending) */}
              {reviewingRequest.status === 'pending' && (
                <>
                  <div className="border-t pt-4">
                    <Label className="mb-2 block">Decision</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={decision === 'approved' ? 'default' : 'outline'}
                        onClick={() => setDecision('approved')}
                        className={decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant={decision === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => setDecision('rejected')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {decision === 'approved' && (
                    <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">Add to Master Catalog</h4>
                      <div className="grid gap-3">
                        <div>
                          <Label htmlFor="productName">Product Name *</Label>
                          <Input
                            id="productName"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Full product name for catalog"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productDescription">Description</Label>
                          <Textarea
                            id="productDescription"
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="productCategory">Category</Label>
                            <Select value={productCategory} onValueChange={setProductCategory}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
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
                          <div>
                            <Label htmlFor="productHsn">HSN Code</Label>
                            <Input
                              id="productHsn"
                              value={productHsn}
                              onChange={(e) => setProductHsn(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="suggestedPrice">Suggested Price (₹)</Label>
                          <Input
                            id="suggestedPrice"
                            type="number"
                            value={suggestedPrice}
                            onChange={(e) => setSuggestedPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {decision === 'rejected' && (
                    <div className="space-y-3 p-4 bg-red-50 rounded-lg">
                      <div>
                        <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why this request is being rejected..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes, visible to seller"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Show decision for reviewed requests */}
              {reviewingRequest.status !== 'pending' && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Label>Decision:</Label>
                    {getStatusBadge(reviewingRequest.status)}
                  </div>
                  {reviewingRequest.admin_notes && (
                    <div className="mt-2">
                      <Label className="text-muted-foreground">Admin Notes</Label>
                      <p className="text-sm">{reviewingRequest.admin_notes}</p>
                    </div>
                  )}
                  {reviewingRequest.rejection_reason && (
                    <div className="mt-2">
                      <Label className="text-muted-foreground">Rejection Reason</Label>
                      <p className="text-sm text-red-600">{reviewingRequest.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewingRequest(null)}>
              {reviewingRequest?.status === 'pending' ? 'Cancel' : 'Close'}
            </Button>
            {reviewingRequest?.status === 'pending' && (
              <Button
                onClick={handleReviewSubmit}
                disabled={submitting}
                className={decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                variant={decision === 'rejected' ? 'destructive' : 'default'}
              >
                {submitting ? "Processing..." : (
                  decision === 'approved' ? 'Approve & Add to Catalog' : 'Reject Request'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductRequests;
