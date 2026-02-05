 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { format } from 'date-fns';
 import { FileText, Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Container } from '@/components/ui/container';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useAuth } from '@/contexts/AuthContext';
 import { useRfqService } from '@/hooks/useRfqService';
 import { RFQ, BomUpload } from '@/types/rfq';
 
 const BuyerRfqsPage = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { getUserRfqs, getUserBoms } = useRfqService();
 
   const [rfqs, setRfqs] = useState<RFQ[]>([]);
   const [boms, setBoms] = useState<BomUpload[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const loadData = async () => {
       if (!user?.id) return;
       const [rfqData, bomData] = await Promise.all([
         getUserRfqs(user.id),
         getUserBoms(user.id),
       ]);
       setRfqs(rfqData);
       setBoms(bomData);
       setLoading(false);
     };
     loadData();
   }, [user?.id, getUserRfqs, getUserBoms]);
 
   const getStatusBadge = (status: string) => {
     const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
       draft: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
       open: { variant: 'default', icon: <Clock className="h-3 w-3" /> },
       quoted: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
       partially_quoted: { variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
       converted: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
       expired: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
       cancelled: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
     };
     const { variant, icon } = config[status] || config.draft;
     return (
       <Badge variant={variant} className="flex items-center gap-1 w-fit">
         {icon}
         {status.replace('_', ' ')}
       </Badge>
     );
   };
 
   const getBomStatusBadge = (status: string) => {
     const config: Record<string, 'default' | 'secondary' | 'outline'> = {
       draft: 'secondary',
       processing: 'outline',
       ready: 'default',
       converted: 'default',
       cancelled: 'secondary',
     };
     return <Badge variant={config[status] || 'secondary'}>{status}</Badge>;
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
         <div className="flex justify-between items-start mb-8">
           <div>
             <h1 className="text-3xl font-bold text-foreground">RFQs & BOMs</h1>
             <p className="text-muted-foreground mt-2">
               Manage your Bill of Materials and Request for Quotations
             </p>
           </div>
           <Button onClick={() => navigate('/buyer/bom/upload')}>
             <Plus className="mr-2 h-4 w-4" />
             Upload New BOM
           </Button>
         </div>
 
         <Tabs defaultValue="rfqs">
           <TabsList>
             <TabsTrigger value="rfqs">RFQs ({rfqs.length})</TabsTrigger>
             <TabsTrigger value="boms">BOMs ({boms.length})</TabsTrigger>
           </TabsList>
 
           <TabsContent value="rfqs" className="mt-6">
             {rfqs.length === 0 ? (
               <Card>
                 <CardContent className="py-12 text-center">
                   <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <h3 className="text-lg font-medium mb-2">No RFQs Yet</h3>
                   <p className="text-muted-foreground mb-4">
                     Upload a BOM to create your first RFQ
                   </p>
                   <Button onClick={() => navigate('/buyer/bom/upload')}>
                     <Plus className="mr-2 h-4 w-4" />
                     Upload BOM
                   </Button>
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
                         <TableHead>Quotes</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Created</TableHead>
                         <TableHead>Expires</TableHead>
                         <TableHead></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {rfqs.map((rfq) => (
                         <TableRow key={rfq.id}>
                           <TableCell className="font-mono text-sm">{rfq.rfq_number}</TableCell>
                           <TableCell className="font-medium">{rfq.title}</TableCell>
                           <TableCell>{rfq.total_items}</TableCell>
                           <TableCell>{rfq.quoted_items}</TableCell>
                           <TableCell>{getStatusBadge(rfq.status)}</TableCell>
                           <TableCell>{format(new Date(rfq.created_at), 'dd MMM yyyy')}</TableCell>
                           <TableCell>
                             {rfq.expires_at ? format(new Date(rfq.expires_at), 'dd MMM') : '-'}
                           </TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => navigate(`/buyer/rfqs/${rfq.id}`)}
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
 
           <TabsContent value="boms" className="mt-6">
             {boms.length === 0 ? (
               <Card>
                 <CardContent className="py-12 text-center">
                   <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <h3 className="text-lg font-medium mb-2">No BOMs Uploaded</h3>
                   <p className="text-muted-foreground mb-4">
                     Upload your first Bill of Materials
                   </p>
                   <Button onClick={() => navigate('/buyer/bom/upload')}>
                     <Plus className="mr-2 h-4 w-4" />
                     Upload BOM
                   </Button>
                 </CardContent>
               </Card>
             ) : (
               <Card>
                 <CardContent className="p-0">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Filename</TableHead>
                         <TableHead>Project</TableHead>
                         <TableHead>Items</TableHead>
                         <TableHead>Matched</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Uploaded</TableHead>
                         <TableHead></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {boms.map((bom) => (
                         <TableRow key={bom.id}>
                           <TableCell className="font-medium">{bom.filename}</TableCell>
                           <TableCell>{bom.project_name || '-'}</TableCell>
                           <TableCell>{bom.total_items}</TableCell>
                           <TableCell>{bom.matched_items}</TableCell>
                           <TableCell>{getBomStatusBadge(bom.status)}</TableCell>
                           <TableCell>{format(new Date(bom.created_at), 'dd MMM yyyy')}</TableCell>
                           <TableCell>
                             {bom.status === 'ready' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => navigate(`/buyer/rfq/create/${bom.id}`)}
                               >
                                 Create RFQ
                               </Button>
                             )}
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
 
 export default BuyerRfqsPage;