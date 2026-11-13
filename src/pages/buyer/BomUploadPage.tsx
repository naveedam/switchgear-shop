 import React, { useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Upload, FileSpreadsheet, Check, AlertCircle, X, ArrowRight } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Textarea } from '@/components/ui/textarea';
 import { Container } from '@/components/ui/container';
 import { useAuth } from '@/contexts/AuthContext';
 import { useBomUpload } from '@/hooks/useBomUpload';
 import { useRfqService } from '@/hooks/useRfqService';
 import { ParsedBomRow } from '@/types/rfq';
 import { useToast } from '@/hooks/use-toast';
 import InstantQuotePanel from '@/components/buyer/InstantQuotePanel';
 
 const BomUploadPage = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { parseFile, isProcessing, error: parseError } = useBomUpload();
   const { createBom, saveBomItems, isLoading } = useRfqService();
   const { toast } = useToast();
 
   const [file, setFile] = useState<File | null>(null);
   const [projectName, setProjectName] = useState('');
   const [parsedRows, setParsedRows] = useState<ParsedBomRow[]>([]);
   const [step, setStep] = useState<'upload' | 'review' | 'saved'>('upload');
   const [bomId, setBomId] = useState<string | null>(null);
 
   const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
     const selectedFile = e.target.files?.[0];
     if (!selectedFile) return;
 
     setFile(selectedFile);
     try {
       const rows = await parseFile(selectedFile);
       setParsedRows(rows);
       setStep('review');
       toast({ title: 'File parsed', description: `Found ${rows.length} items` });
     } catch (err) {
       toast({ title: 'Parse Error', description: parseError || 'Failed to parse file', variant: 'destructive' });
     }
   }, [parseFile, parseError, toast]);
 
   const handleDrop = useCallback(async (e: React.DragEvent) => {
     e.preventDefault();
     const droppedFile = e.dataTransfer.files[0];
     if (!droppedFile) return;
 
     const input = document.createElement('input');
     input.type = 'file';
     const dataTransfer = new DataTransfer();
     dataTransfer.items.add(droppedFile);
     
     setFile(droppedFile);
     try {
       const rows = await parseFile(droppedFile);
       setParsedRows(rows);
       setStep('review');
     } catch (err) {
       toast({ title: 'Parse Error', description: parseError || 'Failed to parse file', variant: 'destructive' });
     }
   }, [parseFile, parseError, toast]);
 
   const handleSaveBom = async () => {
     if (!user?.id || !file) return;
 
     const bom = await createBom(user.id, file.name, projectName || undefined);
     if (!bom) return;
 
     const success = await saveBomItems(bom.id, parsedRows);
     if (success) {
       setBomId(bom.id);
       setStep('saved');
       toast({ title: 'BOM Saved', description: 'Your BOM has been saved. You can now create an RFQ.' });
     }
   };
 
   const handleRemoveRow = (lineNumber: number) => {
     setParsedRows(prev => prev.filter(r => r.lineNumber !== lineNumber));
   };
 
   return (
     <Container className="py-8">
       <div className="max-w-5xl mx-auto">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground">Upload BOM / BOQ</h1>
           <p className="text-muted-foreground mt-2">
             Upload your Bill of Materials to request quotes from multiple verified sellers
           </p>
         </div>
 
         {step === 'upload' && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <FileSpreadsheet className="h-5 w-5" />
                 Upload Your BOM
               </CardTitle>
               <CardDescription>
                 Supported formats: Excel (.xlsx, .xls) and CSV. Required columns: Item Description, Quantity.
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="space-y-2">
                 <Label htmlFor="projectName">Project Name (Optional)</Label>
                 <Input
                   id="projectName"
                   placeholder="e.g., MCC Panel - Phase 2"
                   value={projectName}
                   onChange={(e) => setProjectName(e.target.value)}
                 />
               </div>
 
               <div
                 className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                 onDrop={handleDrop}
                 onDragOver={(e) => e.preventDefault()}
                 onClick={() => document.getElementById('bom-file')?.click()}
               >
                 {isProcessing ? (
                   <div className="flex flex-col items-center">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                     <p className="text-muted-foreground">Processing file...</p>
                   </div>
                 ) : (
                   <>
                     <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                     <p className="text-lg font-medium">Drop your BOM file here</p>
                     <p className="text-muted-foreground mt-1">or click to browse</p>
                     <p className="text-sm text-muted-foreground mt-4">
                       Accepts .xlsx, .xls, .csv files up to 10MB
                     </p>
                   </>
                 )}
                 <input
                   id="bom-file"
                   type="file"
                   accept=".xlsx,.xls,.csv"
                   className="hidden"
                   onChange={handleFileSelect}
                 />
               </div>
 
               <div className="bg-muted/50 rounded-lg p-4">
                 <h4 className="font-medium mb-2">Expected Column Headers</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                   <div><Badge variant="default">Required</Badge> Item Description</div>
                   <div><Badge variant="default">Required</Badge> Quantity</div>
                   <div><Badge variant="secondary">Optional</Badge> Unit</div>
                   <div><Badge variant="secondary">Optional</Badge> Brand/Make</div>
                   <div><Badge variant="secondary">Optional</Badge> Rating/Specs</div>
                   <div><Badge variant="secondary">Optional</Badge> Target Price</div>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {step === 'review' && (
           <div className="space-y-6">
             <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                   <CardTitle>Review BOM Items</CardTitle>
                   <CardDescription>
                     {parsedRows.length} items parsed from {file?.name}
                   </CardDescription>
                 </div>
                 <Button variant="outline" onClick={() => { setStep('upload'); setParsedRows([]); setFile(null); }}>
                   Upload Different File
                 </Button>
               </CardHeader>
               <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead className="w-12">#</TableHead>
                         <TableHead>Description</TableHead>
                         <TableHead className="w-20">Qty</TableHead>
                         <TableHead className="w-20">Unit</TableHead>
                         <TableHead>Brand</TableHead>
                         <TableHead>Specs</TableHead>
                         <TableHead className="w-24">Target ₹</TableHead>
                         <TableHead className="w-12"></TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {parsedRows.map((row) => (
                         <TableRow key={row.lineNumber}>
                           <TableCell className="font-mono text-xs">{row.lineNumber}</TableCell>
                           <TableCell className="font-medium">{row.description}</TableCell>
                           <TableCell>{row.quantity}</TableCell>
                           <TableCell>{row.unit || 'Nos'}</TableCell>
                           <TableCell>{row.preferredBrand || '-'}</TableCell>
                           <TableCell className="max-w-[200px] truncate">{row.ratingSpecs || '-'}</TableCell>
                           <TableCell>{row.targetPrice ? `₹${row.targetPrice.toLocaleString()}` : '-'}</TableCell>
                           <TableCell>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleRemoveRow(row.lineNumber)}
                             >
                               <X className="h-4 w-4" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               </CardContent>
             </Card>
 
             <div className="flex justify-end gap-4">
               <Button variant="outline" onClick={() => { setStep('upload'); setParsedRows([]); }}>
                 Cancel
               </Button>
               <Button onClick={handleSaveBom} disabled={isLoading || parsedRows.length === 0}>
                 {isLoading ? 'Saving...' : 'Save BOM & Continue'}
                 <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
             </div>
           </div>
         )}
 
         {step === 'saved' && bomId && (
           <div className="space-y-6">
           <InstantQuotePanel bomId={bomId} />
           <Card>
             <CardContent className="py-12 text-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="h-8 w-8 text-green-600" />
               </div>
               <h2 className="text-2xl font-bold mb-2">BOM Saved Successfully!</h2>
               <p className="text-muted-foreground mb-6">
                 Your Bill of Materials with {parsedRows.length} items has been saved.
               </p>
               <div className="flex justify-center gap-4">
                 <Button variant="outline" onClick={() => navigate('/buyer/boms')}>
                   View All BOMs
                 </Button>
                 <Button onClick={() => navigate(`/buyer/rfq/create/${bomId}`)}>
                   Create RFQ from BOM
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
               </div>
             </CardContent>
           </Card>
           </div>
         )}
 
         {/* Disclaimer */}
         <div className="mt-8 p-4 bg-muted/50 rounded-lg">
           <div className="flex gap-3">
             <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
             <div className="text-sm text-muted-foreground">
               <p className="font-medium text-foreground">Multi-Seller Marketplace</p>
               <p>
                 RFQs may result in quotes from multiple verified sellers. Orders will be fulfilled directly by sellers, 
                 who are responsible for issuing GST-compliant tax invoices.
               </p>
             </div>
           </div>
         </div>
       </div>
     </Container>
   );
 };
 
 export default BomUploadPage;