 import React, { useState, useEffect } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import { format } from 'date-fns';
 import { FileText, Package, Send, ArrowLeft, Save } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Container } from '@/components/ui/container';
 import { Checkbox } from '@/components/ui/checkbox';
 import { useAuth } from '@/contexts/AuthContext';
 import { useRfqService } from '@/hooks/useRfqService';
 import { RFQ, RFQItem, SellerQuote, SellerQuoteItem } from '@/types/rfq';
 import { useToast } from '@/hooks/use-toast';
 import { supabase } from '@/integrations/supabase/client';
 
 interface QuoteLineItem {
   rfqItemId: string;
   isQuoting: boolean;
   unitPrice: number;
   availableQty: number;
   leadTimeDays: number;
   brand: string;
   notes: string;
 }
 
 const SellerQuotePage = () => {
   const { rfqId } = useParams<{ rfqId: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { createOrGetQuote, saveQuoteItems, submitQuote, isLoading } = useRfqService();
   const { toast } = useToast();
 
   const [rfq, setRfq] = useState<RFQ | null>(null);
   const [rfqItems, setRfqItems] = useState<any[]>([]);
   const [quote, setQuote] = useState<SellerQuote | null>(null);
   const [lineItems, setLineItems] = useState<Map<string, QuoteLineItem>>(new Map());
   const [deliveryTerms, setDeliveryTerms] = useState('');
   const [paymentTerms, setPaymentTerms] = useState('');
   const [notes, setNotes] = useState('');
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const loadData = async () => {
       if (!rfqId || !user?.id) return;
 
       // Load RFQ details
       const { data: rfqData } = await supabase
         .from('rfqs')
         .select('*')
         .eq('id', rfqId)
         .single();
 
       if (!rfqData) {
         toast({ title: 'Error', description: 'RFQ not found', variant: 'destructive' });
         navigate('/seller/rfqs');
         return;
       }
 
       setRfq(rfqData as RFQ);
 
       // Load RFQ items
       const { data: items } = await supabase
         .from('rfq_items')
         .select('*')
         .eq('rfq_id', rfqId)
         .order('line_number');
 
       setRfqItems(items || []);
 
       // Get or create quote
       const quoteData = await createOrGetQuote(rfqId, user.id);
       if (quoteData) {
         setQuote(quoteData);
         setDeliveryTerms(quoteData.delivery_terms || '');
         setPaymentTerms(quoteData.payment_terms || '');
         setNotes(quoteData.notes || '');
 
         // Load existing quote items
         const { data: existingItems } = await supabase
           .from('seller_quote_items')
           .select('*')
           .eq('quote_id', quoteData.id);
 
         const itemMap = new Map<string, QuoteLineItem>();
         (items || []).forEach((item: any) => {
           const existing = existingItems?.find((ei: any) => ei.rfq_item_id === item.id);
           itemMap.set(item.id, {
             rfqItemId: item.id,
             isQuoting: !!existing,
             unitPrice: existing?.unit_price || 0,
             availableQty: existing?.available_quantity || item.quantity,
             leadTimeDays: existing?.lead_time_days || 7,
             brand: existing?.brand || '',
             notes: existing?.notes || '',
           });
         });
         setLineItems(itemMap);
       }
 
       setLoading(false);
     };
     loadData();
   }, [rfqId, user?.id, createOrGetQuote, navigate, toast]);
 
   const updateLineItem = (itemId: string, field: keyof QuoteLineItem, value: any) => {
     setLineItems(prev => {
       const newMap = new Map(prev);
       const item = newMap.get(itemId);
       if (item) {
         newMap.set(itemId, { ...item, [field]: value });
       }
       return newMap;
     });
   };
 
   const calculateTotals = () => {
     let subtotal = 0;
     let taxAmount = 0;
 
     lineItems.forEach((item, itemId) => {
       if (item.isQuoting && item.unitPrice > 0) {
         const rfqItem = rfqItems.find(ri => ri.id === itemId);
         if (rfqItem) {
           const lineTotal = item.unitPrice * item.availableQty;
           subtotal += lineTotal;
           taxAmount += lineTotal * 0.18; // 18% GST
         }
       }
     });
 
     return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
   };
 
   const handleSave = async () => {
     if (!quote) return;
 
     const itemsToSave: Partial<SellerQuoteItem>[] = [];
     lineItems.forEach((item, itemId) => {
       if (item.isQuoting && item.unitPrice > 0) {
         itemsToSave.push({
           rfq_item_id: itemId,
           quoted_quantity: item.availableQty,
           available_quantity: item.availableQty,
           unit_price: item.unitPrice,
           tax_rate: 18,
           lead_time_days: item.leadTimeDays,
           brand: item.brand || undefined,
           notes: item.notes || undefined,
           is_available: true,
         });
       }
     });
 
     const success = await saveQuoteItems(quote.id, user!.id, itemsToSave);
     if (success) {
       // Update quote terms
       await supabase
         .from('seller_quotes')
         .update({ delivery_terms: deliveryTerms, payment_terms: paymentTerms, notes })
         .eq('id', quote.id);
 
       toast({ title: 'Saved', description: 'Quote draft saved' });
     }
   };
 
   const handleSubmit = async () => {
     if (!quote || !rfqId || !user?.id) return;
 
     await handleSave();
     const success = await submitQuote(quote.id, user.id, rfqId);
     if (success) {
       toast({ title: 'Submitted', description: 'Your quote has been submitted to the buyer' });
       navigate('/seller/rfqs');
     }
   };
 
   const { subtotal, taxAmount, grandTotal } = calculateTotals();
   const quotedCount = Array.from(lineItems.values()).filter(i => i.isQuoting && i.unitPrice > 0).length;
 
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
       <div className="max-w-6xl mx-auto">
         {/* Header */}
         <div className="flex justify-between items-start mb-8">
           <div>
             <Button variant="ghost" onClick={() => navigate('/seller/rfqs')} className="mb-2">
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back to RFQs
             </Button>
             <h1 className="text-3xl font-bold">{rfq?.rfq_number}</h1>
             <p className="text-lg text-muted-foreground">{rfq?.title}</p>
             {rfq?.required_delivery_date && (
               <p className="text-sm text-muted-foreground mt-1">
                 Required by: {format(new Date(rfq.required_delivery_date), 'dd MMM yyyy')}
               </p>
             )}
           </div>
           <div className="text-right">
             <Badge variant={quote?.status === 'submitted' ? 'default' : 'secondary'}>
               {quote?.status === 'submitted' ? 'Submitted' : 'Draft'}
             </Badge>
             <p className="text-sm text-muted-foreground mt-2">
               Quote: {quote?.quote_number}
             </p>
           </div>
         </div>
 
         <div className="grid gap-6 lg:grid-cols-3">
           <div className="lg:col-span-2 space-y-6">
             {/* Line Items */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Package className="h-5 w-5" />
                   Quote Line Items
                 </CardTitle>
                 <CardDescription>
                   Select items to quote and enter your prices. You can quote partially.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {rfqItems.map((item) => {
                     const lineItem = lineItems.get(item.id);
                     if (!lineItem) return null;
 
                     return (
                       <div
                         key={item.id}
                         className={`p-4 border rounded-lg ${lineItem.isQuoting ? 'border-primary bg-primary/5' : ''}`}
                       >
                         <div className="flex items-start gap-4">
                           <Checkbox
                             checked={lineItem.isQuoting}
                             onCheckedChange={(checked) =>
                               updateLineItem(item.id, 'isQuoting', checked)
                             }
                             disabled={quote?.status === 'submitted'}
                           />
                           <div className="flex-1">
                             <div className="flex justify-between mb-2">
                               <div>
                                 <p className="font-medium">{item.description}</p>
                                 <p className="text-sm text-muted-foreground">
                                   Qty: {item.quantity} {item.unit}
                                   {item.preferred_brand && ` • Pref. Brand: ${item.preferred_brand}`}
                                 </p>
                                 {item.rating_specs && (
                                   <p className="text-sm text-muted-foreground">Specs: {item.rating_specs}</p>
                                 )}
                               </div>
                               {item.target_price && (
                                 <Badge variant="outline">Target: ₹{item.target_price}</Badge>
                               )}
                             </div>
 
                             {lineItem.isQuoting && (
                               <div className="grid gap-3 md:grid-cols-4 mt-4 pt-4 border-t">
                                 <div>
                                   <Label className="text-xs">Unit Price (₹)</Label>
                                   <Input
                                     type="number"
                                     value={lineItem.unitPrice || ''}
                                     onChange={(e) =>
                                       updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                     }
                                     disabled={quote?.status === 'submitted'}
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-xs">Available Qty</Label>
                                   <Input
                                     type="number"
                                     value={lineItem.availableQty}
                                     onChange={(e) =>
                                       updateLineItem(item.id, 'availableQty', parseInt(e.target.value) || 0)
                                     }
                                     max={item.quantity}
                                     disabled={quote?.status === 'submitted'}
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-xs">Lead Time (days)</Label>
                                   <Input
                                     type="number"
                                     value={lineItem.leadTimeDays}
                                     onChange={(e) =>
                                       updateLineItem(item.id, 'leadTimeDays', parseInt(e.target.value) || 0)
                                     }
                                     disabled={quote?.status === 'submitted'}
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-xs">Brand/Make</Label>
                                   <Input
                                     value={lineItem.brand}
                                     onChange={(e) => updateLineItem(item.id, 'brand', e.target.value)}
                                     placeholder="e.g., Schneider"
                                     disabled={quote?.status === 'submitted'}
                                   />
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
 
             {/* Terms */}
             <Card>
               <CardHeader>
                 <CardTitle>Terms & Conditions</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label>Delivery Terms</Label>
                     <Input
                       value={deliveryTerms}
                       onChange={(e) => setDeliveryTerms(e.target.value)}
                       placeholder="e.g., Ex-Works Bangalore"
                       disabled={quote?.status === 'submitted'}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Payment Terms</Label>
                     <Input
                       value={paymentTerms}
                       onChange={(e) => setPaymentTerms(e.target.value)}
                       placeholder="e.g., 30 days credit"
                       disabled={quote?.status === 'submitted'}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Additional Notes</Label>
                   <Textarea
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Any additional terms or comments..."
                     disabled={quote?.status === 'submitted'}
                   />
                 </div>
               </CardContent>
             </Card>
           </div>
 
           {/* Summary Sidebar */}
           <div>
             <Card className="sticky top-4">
               <CardHeader>
                 <CardTitle>Quote Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Items Quoted</span>
                   <span className="font-medium">{quotedCount} / {rfqItems.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Subtotal</span>
                   <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">GST (18%)</span>
                   <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                 </div>
                 <hr />
                 <div className="flex justify-between text-lg font-semibold">
                   <span>Grand Total</span>
                   <span>₹{grandTotal.toLocaleString()}</span>
                 </div>
 
                 <div className="space-y-2 pt-4">
                   {quote?.status !== 'submitted' && (
                     <>
                       <Button
                         variant="outline"
                         className="w-full"
                         onClick={handleSave}
                         disabled={isLoading}
                       >
                         <Save className="h-4 w-4 mr-2" />
                         Save Draft
                       </Button>
                       <Button
                         className="w-full"
                         onClick={handleSubmit}
                         disabled={isLoading || quotedCount === 0}
                       >
                         <Send className="h-4 w-4 mr-2" />
                         Submit Quote
                       </Button>
                     </>
                   )}
                   {quote?.status === 'submitted' && (
                     <p className="text-sm text-center text-muted-foreground">
                       Quote has been submitted and is awaiting buyer response.
                     </p>
                   )}
                 </div>
 
                 <p className="text-xs text-muted-foreground text-center">
                   Quote valid for 15 days after submission
                 </p>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </Container>
   );
 };
 
 export default SellerQuotePage;