 import React, { useState, useEffect } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import { format } from 'date-fns';
 import { FileText, Calendar, ArrowRight, Package, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Container } from '@/components/ui/container';
 import { useAuth } from '@/contexts/AuthContext';
 import { useRfqService } from '@/hooks/useRfqService';
 import { BomItem, BomUpload } from '@/types/rfq';
 import { useToast } from '@/hooks/use-toast';
 
 const RfqCreatePage = () => {
   const { bomId } = useParams<{ bomId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { getBomWithItems, createRfqFromBom, isLoading } = useRfqService();
   const { toast } = useToast();
 
   const [bom, setBom] = useState<BomUpload | null>(null);
   const [bomItems, setBomItems] = useState<BomItem[]>([]);
   const [loading, setLoading] = useState(true);
 
   const [title, setTitle] = useState('');
   const [deliveryDate, setDeliveryDate] = useState('');
   const [notes, setNotes] = useState('');
 
   useEffect(() => {
     const loadBom = async () => {
       if (!bomId) return;
       const result = await getBomWithItems(bomId);
       if (result) {
         setBom(result.bom);
         setBomItems(result.items);
         setTitle(result.bom.project_name || `RFQ - ${format(new Date(), 'dd MMM yyyy')}`);
       } else {
         toast({ title: 'Error', description: 'BOM not found', variant: 'destructive' });
         navigate('/buyer/boms');
       }
       setLoading(false);
     };
     loadBom();
   }, [bomId, getBomWithItems, navigate, toast]);
 
   const handleCreateRfq = async () => {
     if (!user?.id || !bomId) return;
 
     const rfq = await createRfqFromBom(
       user.id,
       bomId,
       title,
       deliveryDate || undefined,
       notes || undefined
     );
 
     if (rfq) {
       navigate(`/buyer/rfqs/${rfq.id}`);
     }
   };
 
   const getMatchBadge = (status: string) => {
     switch (status) {
       case 'matched':
         return <Badge className="bg-green-100 text-green-800">Matched</Badge>;
       case 'partial':
         return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
       case 'manual':
         return <Badge className="bg-blue-100 text-blue-800">Manual</Badge>;
       default:
         return <Badge variant="secondary">Open for Quote</Badge>;
     }
   };
 
   if (loading) {
     return (
       <Container className="py-8">
         <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
         </div>
       </Container>
     );
   }
 
   return (
     <Container className="py-8">
       <div className="max-w-5xl mx-auto">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground">Create RFQ</h1>
           <p className="text-muted-foreground mt-2">
             Request quotes from verified sellers for your BOM items
           </p>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-3">
           <div className="lg:col-span-2 space-y-6">
             {/* RFQ Details */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <FileText className="h-5 w-5" />
                   RFQ Details
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="title">RFQ Title *</Label>
                   <Input
                     id="title"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="e.g., MCC Panel Components - Building A"
                   />
                 </div>
 
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label htmlFor="deliveryDate">Required Delivery Date</Label>
                     <Input
                       id="deliveryDate"
                       type="date"
                       value={deliveryDate}
                       onChange={(e) => setDeliveryDate(e.target.value)}
                       min={format(new Date(), 'yyyy-MM-dd')}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>RFQ Validity</Label>
                     <Input value="7 days" disabled />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="notes">Notes / Technical Clarifications</Label>
                   <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Add any specific requirements, delivery location, or technical details..."
                     rows={3}
                   />
                 </div>
               </CardContent>
             </Card>
 
             {/* BOM Items */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Package className="h-5 w-5" />
                   Items to Quote ({bomItems.length})
                 </CardTitle>
                 <CardDescription>
                   From BOM: {bom?.filename}
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-12">#</TableHead>
                         <TableHead>Description</TableHead>
                         <TableHead className="w-20">Qty</TableHead>
                         <TableHead>Brand Pref.</TableHead>
                         <TableHead>Specs</TableHead>
                         <TableHead>Status</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {bomItems.map((item) => (
                         <TableRow key={item.id}>
                           <TableCell className="font-mono text-xs">{item.line_number}</TableCell>
                           <TableCell className="font-medium">{item.description}</TableCell>
                           <TableCell>{item.quantity} {item.unit}</TableCell>
                           <TableCell>{item.preferred_brand || 'Any'}</TableCell>
                           <TableCell className="max-w-[150px] truncate">
                             {item.rating_specs || '-'}
                           </TableCell>
                           <TableCell>{getMatchBadge(item.match_status)}</TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               </CardContent>
             </Card>
           </div>
 
           {/* Summary Sidebar */}
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>RFQ Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Total Items</span>
                   <span className="font-medium">{bomItems.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Matched Products</span>
                   <span className="font-medium">
                     {bomItems.filter(i => i.match_status === 'matched').length}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Open for Quote</span>
                   <span className="font-medium">
                     {bomItems.filter(i => i.match_status === 'unmatched').length}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Validity</span>
                   <span className="font-medium">7 days</span>
                 </div>
 
                 <hr />
 
                 <Button
                   className="w-full"
                   size="lg"
                   onClick={handleCreateRfq}
                   disabled={isLoading || !title.trim()}
                 >
                   {isLoading ? 'Creating RFQ...' : 'Send RFQ to Sellers'}
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
 
                 <p className="text-xs text-muted-foreground text-center">
                   RFQ will be sent to all relevant sellers
                 </p>
               </CardContent>
             </Card>
 
             {/* Info Card */}
             <Card className="bg-muted/50">
               <CardContent className="pt-6">
                 <div className="flex gap-3">
                   <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                   <div className="text-sm">
                     <p className="font-medium">How RFQs Work</p>
                     <ul className="mt-2 space-y-1 text-muted-foreground">
                       <li>• Sellers can quote partially or fully</li>
                       <li>• Compare quotes side-by-side</li>
                       <li>• Accept quotes from multiple sellers</li>
                       <li>• GST invoices issued by sellers</li>
                     </ul>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </Container>
   );
 };
 
 export default RfqCreatePage;