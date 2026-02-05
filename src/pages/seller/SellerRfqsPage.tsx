 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { format } from 'date-fns';
 import { FileText, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Container } from '@/components/ui/container';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useAuth } from '@/contexts/AuthContext';
 import { useRfqService } from '@/hooks/useRfqService';
 import { SellerQuote } from '@/types/rfq';
 
 const SellerRfqsPage = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { getSellerRfqInvitations, getSellerQuotes } = useRfqService();
 
   const [invitations, setInvitations] = useState<any[]>([]);
   const [quotes, setQuotes] = useState<SellerQuote[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const loadData = async () => {
       if (!user?.id) return;
       const [invData, quoteData] = await Promise.all([
         getSellerRfqInvitations(user.id),
         getSellerQuotes(user.id),
       ]);
       setInvitations(invData);
       setQuotes(quoteData);
       setLoading(false);
     };
     loadData();
   }, [user?.id, getSellerRfqInvitations, getSellerQuotes]);
 
   const getStatusBadge = (status: string) => {
     const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
       pending: { variant: 'outline', label: 'New' },
       viewed: { variant: 'secondary', label: 'In Progress' },
       draft: { variant: 'secondary', label: 'Draft' },
       submitted: { variant: 'default', label: 'Submitted' },
       accepted: { variant: 'default', label: 'Accepted' },
       rejected: { variant: 'destructive', label: 'Rejected' },
     };
     const { variant, label } = config[status] || { variant: 'secondary', label: status };
     return <Badge variant={variant}>{label}</Badge>;
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
       <div className="max-w-6xl mx-auto">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground">RFQ Management</h1>
           <p className="text-muted-foreground mt-2">
             View and respond to Request for Quotations from buyers
           </p>
         </div>
 
         <Tabs defaultValue="invitations">
           <TabsList>
             <TabsTrigger value="invitations" className="flex items-center gap-2">
               <AlertCircle className="h-4 w-4" />
               New RFQs ({invitations.length})
             </TabsTrigger>
             <TabsTrigger value="quotes" className="flex items-center gap-2">
               <FileText className="h-4 w-4" />
               My Quotes ({quotes.length})
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="invitations" className="mt-6">
             {invitations.length === 0 ? (
               <Card>
                 <CardContent className="py-12 text-center">
                   <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <h3 className="text-lg font-medium mb-2">No Pending RFQs</h3>
                   <p className="text-muted-foreground">
                     You'll be notified when buyers send RFQs matching your products
                   </p>
                 </CardContent>
               </Card>
             ) : (
               <Card>
                 <CardContent className="p-0">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>RFQ Number</TableHead>
                         <TableHead>Title</TableHead>
                         <TableHead>Items</TableHead>
                         <TableHead>Delivery Date</TableHead>
                         <TableHead>Expires</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {invitations.map((inv) => (
                         <TableRow key={inv.id}>
                           <TableCell className="font-mono text-sm">{inv.rfq?.rfq_number}</TableCell>
                           <TableCell className="font-medium">{inv.rfq?.title}</TableCell>
                           <TableCell>{inv.rfq?.total_items}</TableCell>
                           <TableCell>
                             {inv.rfq?.required_delivery_date
                               ? format(new Date(inv.rfq.required_delivery_date), 'dd MMM yyyy')
                               : '-'}
                           </TableCell>
                           <TableCell>
                             {inv.rfq?.expires_at
                               ? format(new Date(inv.rfq.expires_at), 'dd MMM')
                               : '-'}
                           </TableCell>
                           <TableCell>{getStatusBadge(inv.status)}</TableCell>
                           <TableCell>
                             <Button
                               size="sm"
                               onClick={() => navigate(`/seller/rfq/${inv.rfq_id}/quote`)}
                             >
                               <Eye className="h-4 w-4 mr-1" />
                               View & Quote
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           <TabsContent value="quotes" className="mt-6">
             {quotes.length === 0 ? (
               <Card>
                 <CardContent className="py-12 text-center">
                   <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <h3 className="text-lg font-medium mb-2">No Quotes Yet</h3>
                   <p className="text-muted-foreground">
                     Your submitted quotes will appear here
                   </p>
                 </CardContent>
               </Card>
             ) : (
               <Card>
                 <CardContent className="p-0">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Quote Number</TableHead>
                         <TableHead>RFQ</TableHead>
                         <TableHead>Total Amount</TableHead>
                         <TableHead>Submitted</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {quotes.map((quote) => (
                         <TableRow key={quote.id}>
                           <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
                           <TableCell className="font-medium">
                             {(quote as any).rfq?.rfq_number || '-'}
                           </TableCell>
                           <TableCell>₹{quote.grand_total.toLocaleString()}</TableCell>
                           <TableCell>
                             {quote.submitted_at
                               ? format(new Date(quote.submitted_at), 'dd MMM yyyy')
                               : '-'}
                           </TableCell>
                           <TableCell>{getStatusBadge(quote.status)}</TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => navigate(`/seller/rfq/${quote.rfq_id}/quote`)}
                             >
                               <Eye className="h-4 w-4 mr-1" />
                               View
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
         </Tabs>
       </div>
     </Container>
   );
 };
 
 export default SellerRfqsPage;