import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Sparkles, ArrowRight, Plus, Trash2, Edit2, Save, X,
  CheckCircle2, AlertTriangle, HelpCircle, Download, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectService } from '@/hooks/useProjectService';
import { Project, ProjectDocument, ProjectBomItem } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_OPTIONS = [
  { value: 'low-voltage-switchgears', label: 'Low Voltage Switchgear' },
  { value: 'controlling-gear-signalling-devices', label: 'Controlling Gear' },
  { value: 'relays', label: 'Relays' },
  { value: 'meters', label: 'Meters' },
  { value: 'capacitors-reactors', label: 'Capacitors & Reactors' },
  { value: 'wires-cables', label: 'Wires & Cables' },
  { value: 'industrial-automation', label: 'Industrial Automation' },
];

const confidenceBadge = (score: number) => {
  if (score >= 0.7) return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" /> High</Badge>;
  if (score >= 0.4) return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertTriangle className="h-3 w-3" /> Medium</Badge>;
  return <Badge className="bg-red-100 text-red-800 gap-1"><HelpCircle className="h-3 w-3" /> Low</Badge>;
};

const validationBadge = (status: string) => {
  if (status === 'complete') return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
  if (status === 'missing_fields') return <Badge className="bg-yellow-100 text-yellow-800">Missing Fields</Badge>;
  return <Badge className="bg-red-100 text-red-800">Needs Review</Badge>;
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    getProject, getDocuments, getBomItems, uploadDocument,
    extractPdfText, parseDocument, updateBomItem, deleteBomItem, addBomItem,
    convertToRfq, isLoading,
  } = useProjectService();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [bomItems, setBomItems] = useState<ProjectBomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ProjectBomItem>>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ProjectBomItem>>({ quantity: 1 });
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqNotes, setRfqNotes] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null); // 'uploading' | 'extracting' | 'generating' | 'extraction_failed' | null

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [p, docs, items] = await Promise.all([
      getProject(projectId),
      getDocuments(projectId),
      getBomItems(projectId),
    ]);
    setProject(p);
    setDocuments(docs);
    setBomItems(items);
    if (p) setRfqTitle(p.name);
    setLoading(false);
  }, [projectId, getProject, getDocuments, getBomItems]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !projectId) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isTextFile = file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt');

    setPipelineStatus('uploading');
    const doc = await uploadDocument(projectId, user.id, file);
    if (!doc) {
      setPipelineStatus(null);
      return;
    }

    setDocuments(prev => [doc, ...prev]);
    toast({ title: 'File Uploaded', description: `${file.name} uploaded successfully` });

    if (isPdf) {
      // Auto-extract text from PDF server-side, then auto-parse
      setPipelineStatus('extracting');
      const extractResult = await extractPdfText(doc.id, projectId, doc.file_url);

      if (extractResult.success && extractResult.extractedText) {
        // Update local doc status
        setDocuments(prev =>
          prev.map(d => d.id === doc.id ? { ...d, processing_status: 'extracted', raw_extracted_text: extractResult.extractedText } : d)
        );

        // Auto-trigger BOM parsing
        setPipelineStatus('generating');
        const result = await parseDocument(projectId, doc.id, extractResult.extractedText);
        if (result.success) {
          toast({
            title: 'BOM Generated',
            description: `Found ${result.items_found} components from PDF. Please review.`,
          });
          const items = await getBomItems(projectId);
          setBomItems(items);
          setProject(prev => prev ? { ...prev, status: 'bom_generated' } : prev);
        }
        setPipelineStatus(null);
      } else {
        // Extraction failed — show fallback
        setPipelineStatus('extraction_failed');
        setDocuments(prev =>
          prev.map(d => d.id === doc.id ? { ...d, processing_status: 'extraction_failed' } : d)
        );
        toast({
          title: 'PDF Text Extraction Failed',
          description: 'Could not extract text from PDF. Please paste text manually.',
          variant: 'destructive',
        });
      }
    } else if (isTextFile) {
      setPipelineStatus('generating');
      const text = await file.text();
      await handleParse(doc.id, text);
      setPipelineStatus(null);
    } else {
      setPipelineStatus(null);
    }
  };

  const handlePasteText = async () => {
    if (!textInput.trim() || !projectId) return;
    // Create a virtual document
    const doc = await uploadDocument(projectId, user?.id || '', new File([textInput], 'pasted-text.txt', { type: 'text/plain' }));
    if (doc) {
      setDocuments(prev => [doc, ...prev]);
      setTextDialogOpen(false);
      await handleParse(doc.id, textInput);
      setTextInput('');
    }
  };

  const handleParse = async (documentId: string, rawText: string) => {
    if (!projectId) return;
    setParsing(true);
    const result = await parseDocument(projectId, documentId, rawText);
    if (result.success) {
      toast({
        title: 'Parsing Complete',
        description: `Found ${result.items_found} components. Please review before proceeding.`,
      });
      // Reload items
      const items = await getBomItems(projectId);
      setBomItems(items);
      setProject(prev => prev ? { ...prev, status: 'bom_generated' } : prev);
    }
    setParsing(false);
  };

  const handleParseDocument = async (doc: ProjectDocument) => {
    if (doc.raw_extracted_text) {
      await handleParse(doc.id, doc.raw_extracted_text);
    } else {
      toast({
        title: 'Text Extraction Required',
        description: 'Please paste the text content from this document, or use the "Paste Text" option.',
        variant: 'destructive',
      });
    }
  };

  // Inline editing
  const startEdit = (item: ProjectBomItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateBomItem(editingId, editData);
    setBomItems(prev => prev.map(i => i.id === editingId ? { ...i, ...editData } as ProjectBomItem : i));
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteItem = async (id: string) => {
    if (await deleteBomItem(id)) {
      setBomItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleAddItem = async () => {
    if (!projectId || !newItem.description?.trim()) return;
    const item = await addBomItem({
      project_id: projectId,
      description: newItem.description!,
      ...newItem,
    });
    if (item) {
      setBomItems(prev => [...prev, item]);
      setAddDialogOpen(false);
      setNewItem({ quantity: 1 });
    }
  };

  const handleConvertToRfq = async () => {
    if (!projectId || !user?.id || bomItems.length === 0) return;
    const rfqId = await convertToRfq(projectId, user.id, rfqTitle, bomItems, rfqNotes || undefined);
    if (rfqId) {
      navigate(`/buyer/rfqs/${rfqId}`);
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

  if (!project) {
    return (
      <Container className="py-8">
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">Project not found</h2>
          <Button className="mt-4" onClick={() => navigate('/buyer/projects')}>Back to Projects</Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge variant="outline" className="text-xs">Beta</Badge>
            </div>
            {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
          </div>
          <Button variant="outline" onClick={() => navigate('/buyer/projects')}>← Back</Button>
        </div>

        {/* AI Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800 flex gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>AI-generated suggestions require review before RFQ. Always verify extracted specs.</span>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="bom">BOM ({bomItems.length})</TabsTrigger>
            <TabsTrigger value="rfq" disabled={bomItems.length === 0}>Convert to RFQ</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload design PDFs, Excel BOMs, or paste text. AI will extract electrical components.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => document.getElementById('doc-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Upload File
                  </Button>
                  <input
                    id="doc-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" /> Paste Text
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Paste Document Text</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Copy and paste the text content from your design document or BOM. 
                          AI will extract electrical component data.
                        </p>
                        <Textarea
                          value={textInput}
                          onChange={e => setTextInput(e.target.value)}
                          placeholder={`Example:\n1. MCCB 3P 160A 25kA - Schneider EZC250\n2. Contactor 3P 95A 415V - ABB AX95\n3. Overload Relay 80-100A - L&T MN2`}
                          rows={12}
                          className="font-mono text-sm"
                        />
                        <Button onClick={handlePasteText} disabled={!textInput.trim() || isLoading}>
                          <Sparkles className="h-4 w-4 mr-2" /> Extract Components
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {documents.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.uploaded_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${
                            doc.processing_status === 'completed' ? 'border-green-300 text-green-700' :
                            doc.processing_status === 'extraction_failed' || doc.processing_status === 'failed' ? 'border-red-300 text-red-700' :
                            doc.processing_status === 'extracting' || doc.processing_status === 'processing' ? 'border-blue-300 text-blue-700' :
                            ''
                          }`}>
                            {doc.processing_status === 'extracting' && 'Extracting...'}
                            {doc.processing_status === 'extracted' && 'Text Extracted'}
                            {doc.processing_status === 'extraction_failed' && 'Extraction Failed'}
                            {doc.processing_status === 'completed' && 'Completed'}
                            {doc.processing_status === 'processing' && 'Processing...'}
                            {doc.processing_status === 'failed' && 'Failed'}
                            {doc.processing_status === 'pending' && 'Pending'}
                          </Badge>
                          {(doc.processing_status === 'pending' || doc.processing_status === 'extraction_failed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleParseDocument(doc)}
                              disabled={parsing}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              {parsing ? 'Parsing...' : doc.processing_status === 'extraction_failed' ? 'Paste Text' : 'Parse'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(parsing || pipelineStatus) && (
                  <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                    <div className="text-center w-full max-w-md">
                      {pipelineStatus === 'extraction_failed' ? (
                        <>
                          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
                          <p className="text-sm font-medium text-destructive">PDF text could not be reliably extracted.</p>
                          <p className="text-xs text-muted-foreground mt-1">Paste text manually using the "Paste Text" button above.</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPipelineStatus(null)}>
                            Dismiss
                          </Button>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                          <p className="text-sm font-medium">
                            {pipelineStatus === 'uploading' && 'Uploading document...'}
                            {pipelineStatus === 'extracting' && 'Extracting text from PDF...'}
                            {pipelineStatus === 'generating' && 'AI is generating BOM...'}
                            {!pipelineStatus && parsing && 'AI is extracting components...'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                          <Progress value={
                            pipelineStatus === 'uploading' ? 20 :
                            pipelineStatus === 'extracting' ? 50 :
                            pipelineStatus === 'generating' ? 80 : 60
                          } className="mt-3 h-2" />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOM Tab */}
          <TabsContent value="bom">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bill of Materials</CardTitle>
                  <CardDescription>
                    {bomItems.length} items extracted. Review and edit before creating RFQ.
                  </CardDescription>
                </div>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Row</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add BOM Item</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label>Description *</Label>
                        <Input
                          value={newItem.description || ''}
                          onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                          placeholder="e.g., MCCB 3P 160A 25kA"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Component Type</Label>
                          <Input
                            value={newItem.component_type || ''}
                            onChange={e => setNewItem(p => ({ ...p, component_type: e.target.value }))}
                            placeholder="e.g., MCCB"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={newItem.quantity || 1}
                            onChange={e => setNewItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Rated Current</Label>
                          <Input
                            value={newItem.rated_current || ''}
                            onChange={e => setNewItem(p => ({ ...p, rated_current: e.target.value }))}
                            placeholder="e.g., 160 A"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Rated Voltage</Label>
                          <Input
                            value={newItem.rated_voltage || ''}
                            onChange={e => setNewItem(p => ({ ...p, rated_voltage: e.target.value }))}
                            placeholder="e.g., 415 V"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label>Poles</Label>
                          <Input
                            value={newItem.poles || ''}
                            onChange={e => setNewItem(p => ({ ...p, poles: e.target.value }))}
                            placeholder="e.g., 3P"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Breaking Cap.</Label>
                          <Input
                            value={newItem.breaking_capacity || ''}
                            onChange={e => setNewItem(p => ({ ...p, breaking_capacity: e.target.value }))}
                            placeholder="e.g., 25 kA"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Brand</Label>
                          <Input
                            value={newItem.brand || ''}
                            onChange={e => setNewItem(p => ({ ...p, brand: e.target.value }))}
                            placeholder="e.g., Schneider"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddItem} className="w-full" disabled={!newItem.description?.trim()}>
                        Add Item
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {bomItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>No BOM items yet. Upload a document and parse it, or add items manually.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="min-w-[200px]">Description</TableHead>
                          <TableHead className="w-16">Qty</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>Voltage</TableHead>
                          <TableHead>Poles</TableHead>
                          <TableHead>Breaking Cap.</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bomItems.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                            {editingId === item.id ? (
                              <>
                                <TableCell>
                                  <Input
                                    value={editData.component_type || ''}
                                    onChange={e => setEditData(d => ({ ...d, component_type: e.target.value }))}
                                    className="h-8 text-xs w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.description || ''}
                                    onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                                    className="h-8 text-xs"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={editData.quantity || 1}
                                    onChange={e => setEditData(d => ({ ...d, quantity: parseInt(e.target.value) || 1 }))}
                                    className="h-8 text-xs w-16"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.rated_current || ''}
                                    onChange={e => setEditData(d => ({ ...d, rated_current: e.target.value }))}
                                    className="h-8 text-xs w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.rated_voltage || ''}
                                    onChange={e => setEditData(d => ({ ...d, rated_voltage: e.target.value }))}
                                    className="h-8 text-xs w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.poles || ''}
                                    onChange={e => setEditData(d => ({ ...d, poles: e.target.value }))}
                                    className="h-8 text-xs w-14"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.breaking_capacity || ''}
                                    onChange={e => setEditData(d => ({ ...d, breaking_capacity: e.target.value }))}
                                    className="h-8 text-xs w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={editData.brand || ''}
                                    onChange={e => setEditData(d => ({ ...d, brand: e.target.value }))}
                                    className="h-8 text-xs w-24"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={editData.category_slug || ''}
                                    onValueChange={v => setEditData(d => ({ ...d, category_slug: v }))}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-32">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CATEGORY_OPTIONS.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>{confidenceBadge(item.confidence_score)}</TableCell>
                                <TableCell>{validationBadge(item.validation_status)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="text-xs font-medium">{item.component_type || '-'}</TableCell>
                                <TableCell className="text-xs max-w-[200px] truncate">{item.description}</TableCell>
                                <TableCell className="text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-xs">{item.rated_current || '-'}</TableCell>
                                <TableCell className="text-xs">{item.rated_voltage || '-'}</TableCell>
                                <TableCell className="text-xs">{item.poles || '-'}</TableCell>
                                <TableCell className="text-xs">{item.breaking_capacity || '-'}</TableCell>
                                <TableCell className="text-xs">{item.brand || '-'}</TableCell>
                                <TableCell className="text-xs">
                                  {CATEGORY_OPTIONS.find(c => c.value === item.category_slug)?.label || item.category_slug || '-'}
                                </TableCell>
                                <TableCell>{confidenceBadge(item.confidence_score)}</TableCell>
                                <TableCell>{validationBadge(item.validation_status)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)}>
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteItem(item.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RFQ Tab */}
          <TabsContent value="rfq">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Convert BOM to RFQ</CardTitle>
                    <CardDescription>
                      Create a Request for Quotation from your reviewed BOM. Sellers will receive invitations to quote.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>RFQ Title *</Label>
                      <Input
                        value={rfqTitle}
                        onChange={e => setRfqTitle(e.target.value)}
                        placeholder="e.g., MCC Panel Components - Project Alpha"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes / Requirements</Label>
                      <Textarea
                        value={rfqNotes}
                        onChange={e => setRfqNotes(e.target.value)}
                        placeholder="Any delivery requirements, technical clarifications, etc."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items</span>
                      <span className="font-medium">{bomItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Complete</span>
                      <span className="font-medium text-green-600">
                        {bomItems.filter(i => i.validation_status === 'complete').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Needs Review</span>
                      <span className="font-medium text-amber-600">
                        {bomItems.filter(i => i.validation_status !== 'complete').length}
                      </span>
                    </div>
                    <hr />
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleConvertToRfq}
                      disabled={isLoading || bomItems.length === 0 || !rfqTitle.trim()}
                    >
                      {isLoading ? 'Creating RFQ...' : 'Create RFQ & Send to Sellers'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      RFQ will be sent to all active sellers. Validity: 7 days.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default ProjectDetailPage;
