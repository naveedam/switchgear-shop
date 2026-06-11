import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  Upload, FileText, FileSpreadsheet, FileArchive, CheckCircle2,
  Trash2, Eye, AlertCircle, Loader2, ArrowRight, ArrowLeft, Sparkles,
} from 'lucide-react';

type FileType = 'pdf' | 'excel' | 'csv' | 'zip';
type StepKey = 'upload' | 'extract' | 'preview' | 'map' | 'commit';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'extract', label: 'Extract' },
  { key: 'preview', label: 'Preview' },
  { key: 'map', label: 'Map' },
  { key: 'commit', label: 'Commit' },
];

const CATEGORY_OPTIONS = [
  'low_voltage_switchgear',
  'wires_and_cables',
  'switches_and_sockets',
  'relays',
  'starters_and_switches',
  'testing_and_measuring_instruments',
];

const DEFAULT_SELLER_ID = '458d0e72-c507-4682-9b92-210f9c13dbd2';

interface ExtractedProduct {
  _id: string;
  selected: boolean;
  name: string;
  sku: string;
  price: number;
  brand: string;
  category_hint: string;
  description: string;
  image_url?: string;
  category?: string;
  brand_id?: string;
}

interface JobRow {
  id: string;
  file_name: string;
  file_type: FileType;
  status: string;
  extracted_count: number | null;
  committed_count: number | null;
  created_at: string;
  raw_extracted: any;
}

const FIELDS = ['name', 'sku', 'price', 'brand', 'category', 'description', 'image_url'] as const;
type FieldKey = typeof FIELDS[number];

function inferType(file: File): FileType | null {
  const n = file.name.toLowerCase();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.xlsx') || n.endsWith('.xls')) return 'excel';
  if (n.endsWith('.csv')) return 'csv';
  if (n.endsWith('.zip')) return 'zip';
  return null;
}

function autoMap(headers: string[]): Record<FieldKey, string> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const patterns: Record<FieldKey, string[]> = {
    name: ['name', 'productname', 'itemname', 'description', 'title'],
    sku: ['sku', 'partno', 'partnumber', 'code', 'itemcode', 'modelno', 'model'],
    price: ['price', 'mrp', 'rate', 'listprice', 'unitprice', 'cost'],
    brand: ['brand', 'make', 'manufacturer'],
    category: ['category', 'cat', 'group', 'family', 'type'],
    description: ['description', 'desc', 'details', 'specs', 'specification'],
    image_url: ['image', 'imageurl', 'img', 'photo', 'picture'],
  };
  const result = {} as Record<FieldKey, string>;
  FIELDS.forEach(f => { result[f] = ''; });
  for (const h of headers) {
    const hn = norm(h);
    for (const f of FIELDS) {
      if (result[f]) continue;
      if (patterns[f].some(p => hn.includes(p))) {
        result[f] = h;
        break;
      }
    }
  }
  return result;
}

const StepIndicator: React.FC<{ current: StepKey }> = ({ current }) => {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STEPS.map((s, i) => {
        const state = i < idx ? 'done' : i === idx ? 'active' : 'todo';
        return (
          <React.Fragment key={s.key}>
            <div
              className={
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ' +
                (state === 'done'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : state === 'active'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-100 text-slate-500 border-slate-200')
              }
            >
              <span className="w-5 h-5 rounded-full bg-white/20 inline-flex items-center justify-center text-xs">
                {i + 1}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-slate-300" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CatalogIngestion: React.FC = () => {
  const [step, setStep] = useState<StepKey>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractMessage, setExtractMessage] = useState('');

  // Excel/CSV state
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as any);

  // ZIP state
  const [zipImages, setZipImages] = useState<{ name: string; url: string }[]>([]);

  // Products (preview)
  const [products, setProducts] = useState<ExtractedProduct[]>([]);

  // Mapping state
  const [bulkSeller, setBulkSeller] = useState<string>(DEFAULT_SELLER_ID);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkBrand, setBulkBrand] = useState<string>('');

  // Reference data
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [refsLoading, setRefsLoading] = useState(false);

  // Commit state
  const [committing, setCommitting] = useState(false);
  const [committedCount, setCommittedCount] = useState<number | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Jobs list
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [viewJob, setViewJob] = useState<JobRow | null>(null);

  const loadJobs = useCallback(async () => {
    const { data } = await supabase
      .from('catalog_ingestion_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setJobs(data as any);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    (async () => {
      setRefsLoading(true);
      const [sRes, bRes] = await Promise.all([
        supabase.from('companies').select('id,name').eq('is_vendor', true).order('name').limit(500),
        supabase.from('brands').select('id,name').order('name').limit(500),
      ]);
      if (sRes.data) setSellers(sRes.data as any);
      if (bRes.data) setBrands(bRes.data as any);
      setRefsLoading(false);
    })();
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    const t = inferType(f);
    if (!t) {
      toast({ title: 'Unsupported file', description: 'Use PDF, Excel, CSV, or ZIP.', variant: 'destructive' });
      return;
    }
    setFile(f);
    setFileType(t);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
    },
  });

  const fileIcon = useMemo(() => {
    switch (fileType) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'excel':
      case 'csv': return <FileSpreadsheet className="h-5 w-5" />;
      case 'zip': return <FileArchive className="h-5 w-5" />;
      default: return <Upload className="h-5 w-5" />;
    }
  }, [fileType]);

  const startExtraction = async () => {
    if (!file || !fileType) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: 'Sign in required', variant: 'destructive' }); return; }

      const tempId = crypto.randomUUID();
      const storagePath = `catalog-imports/${tempId}/${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(storagePath, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: jobData, error: jobErr } = await supabase
        .from('catalog_ingestion_jobs')
        .insert({
          id: tempId,
          admin_id: user.id,
          file_name: file.name,
          file_type: fileType,
          storage_path: storagePath,
          status: 'extracting',
        })
        .select()
        .single();
      if (jobErr) throw jobErr;
      setJobId(jobData.id);
      setStep('extract');
      loadJobs();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  const runExtract = async () => {
    if (!file || !fileType) return;
    setExtracting(true);
    setExtractProgress(10);
    setExtractMessage('Analysing catalog…');
    try {
      if (fileType === 'excel' || fileType === 'csv') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
        setRawRows(rows);
        const hdrs = rows.length ? Object.keys(rows[0]) : [];
        setHeaders(hdrs);
        setMapping(autoMap(hdrs));
        setExtractProgress(100);
        setExtractMessage(`${rows.length} rows detected.`);
      } else if (fileType === 'zip') {
        const buf = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buf);
        const imgs: { name: string; url: string }[] = [];
        const entries = Object.values(zip.files).filter(
          f => !f.dir && /\.(jpe?g|png|webp|gif)$/i.test(f.name)
        );
        let i = 0;
        for (const entry of entries) {
          const blob = await entry.async('blob');
          imgs.push({ name: entry.name, url: URL.createObjectURL(blob) });
          i++;
          setExtractProgress(Math.round((i / entries.length) * 100));
        }
        setZipImages(imgs);
        setExtractMessage(`${imgs.length} images extracted.`);
      } else if (fileType === 'pdf') {
        setExtractMessage('PDF extraction requires AI processing.');
        setExtractProgress(0);
      }
    } catch (e: any) {
      toast({ title: 'Extraction failed', description: e.message, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const runMockPdfExtract = async () => {
    setExtracting(true);
    setExtractProgress(20);
    setExtractMessage('Calling AI extractor…');
    await new Promise(r => setTimeout(r, 1200));
    const mock: ExtractedProduct[] = [
      { _id: crypto.randomUUID(), selected: true, name: 'MCB 32A C-Curve SP', sku: 'MCB-32A-C-SP', price: 285, brand: 'Havells', category_hint: 'low_voltage_switchgear', description: '32A Single Pole Miniature Circuit Breaker, C-Curve.' },
      { _id: crypto.randomUUID(), selected: true, name: 'RCCB 40A 30mA 2P', sku: 'RCCB-40A-30-2P', price: 1850, brand: 'Schneider', category_hint: 'low_voltage_switchgear', description: '40A 30mA double pole Residual Current Circuit Breaker.' },
      { _id: crypto.randomUUID(), selected: true, name: 'Contactor 25A AC3', sku: 'CON-25A-AC3', price: 920, brand: 'L&T', category_hint: 'starters_and_switches', description: '3-pole 25A AC-3 contactor for motor switching.' },
      { _id: crypto.randomUUID(), selected: true, name: 'Digital Multimeter 600V', sku: 'DMM-600V-AUTO', price: 2400, brand: 'Fluke', category_hint: 'testing_and_measuring_instruments', description: 'Auto-ranging digital multimeter, CAT III 600V.' },
    ];
    setProducts(mock);
    setExtractProgress(100);
    setExtractMessage(`${mock.length} products extracted (mock).`);
    setExtracting(false);
    if (jobId) {
      await supabase.from('catalog_ingestion_jobs').update({
        status: 'preview', extracted_count: mock.length, raw_extracted: mock as any,
      }).eq('id', jobId);
    }
    setStep('preview');
  };

  const applyMappingToProducts = async () => {
    const out: ExtractedProduct[] = rawRows.map((r, idx) => {
      const get = (f: FieldKey) => mapping[f] ? String(r[mapping[f]] ?? '').trim() : '';
      const priceStr = get('price').replace(/[^\d.]/g, '');
      return {
        _id: crypto.randomUUID(),
        selected: true,
        name: get('name') || `Row ${idx + 1}`,
        sku: get('sku') || `SKU-${idx + 1}`,
        price: priceStr ? parseFloat(priceStr) : 0,
        brand: get('brand'),
        category_hint: get('category'),
        description: get('description'),
        image_url: get('image_url') || undefined,
      };
    });
    setProducts(out);
    if (jobId) {
      await supabase.from('catalog_ingestion_jobs').update({
        status: 'preview', extracted_count: out.length, raw_extracted: out as any,
      }).eq('id', jobId);
    }
    setStep('preview');
  };

  const advanceFromZip = async () => {
    const out: ExtractedProduct[] = zipImages.map((img, idx) => ({
      _id: crypto.randomUUID(),
      selected: true,
      name: img.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      sku: `IMG-${idx + 1}`,
      price: 0,
      brand: '',
      category_hint: '',
      description: '',
      image_url: img.url,
    }));
    setProducts(out);
    if (jobId) {
      await supabase.from('catalog_ingestion_jobs').update({
        status: 'preview', extracted_count: out.length,
      }).eq('id', jobId);
    }
    setStep('preview');
  };

  const selectedCount = products.filter(p => p.selected).length;

  const updateP = (id: string, patch: Partial<ExtractedProduct>) => {
    setProducts(prev => prev.map(p => p._id === id ? { ...p, ...patch } : p));
  };

  const applyBulk = () => {
    setProducts(prev => prev.map(p => !p.selected ? p : {
      ...p,
      category: bulkCategory || p.category,
      brand_id: bulkBrand || p.brand_id,
    }));
  };

  const commit = async () => {
    setCommitting(true);
    setCommitError(null);
    try {
      const toInsert = products.filter(p => p.selected).map(p => ({
        name: p.name,
        sku: p.sku,
        price: p.price || 0,
        description: p.description || null,
        vendor_id: bulkSeller || DEFAULT_SELLER_ID,
        category: (p.category || bulkCategory) as any,
        brand_id: p.brand_id || bulkBrand || null,
        status: 'active' as const,
        stock_quantity: 0,
        Images: p.image_url ? [p.image_url] : [],
      }));

      let committed = 0;
      const BATCH = 50;
      for (let i = 0; i < toInsert.length; i += BATCH) {
        const slice = toInsert.slice(i, i + BATCH);
        const { error, data } = await supabase
          .from('products')
          .upsert(slice, { onConflict: 'sku', ignoreDuplicates: true })
          .select('id');
        if (error) throw error;
        committed += data?.length || 0;
      }

      if (jobId) {
        await supabase.from('catalog_ingestion_jobs').update({
          status: 'committed', committed_count: committed,
        }).eq('id', jobId);
      }
      setCommittedCount(committed);
      loadJobs();
    } catch (e: any) {
      setCommitError(e.message);
      if (jobId) {
        await supabase.from('catalog_ingestion_jobs').update({
          status: 'error', error_message: e.message,
        }).eq('id', jobId);
      }
    } finally {
      setCommitting(false);
    }
  };

  const reset = () => {
    setStep('upload'); setFile(null); setFileType(null); setJobId(null);
    setRawRows([]); setHeaders([]); setMapping({} as any); setZipImages([]);
    setProducts([]); setCommittedCount(null); setCommitError(null);
    setExtractProgress(0); setExtractMessage('');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catalog Import</h1>
        <p className="text-sm text-slate-500">Upload supplier catalogs and ingest products into the marketplace.</p>
      </div>

      <Card>
        <CardHeader>
          <StepIndicator current={step} />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ' +
                  (isDragActive ? 'border-amber-500 bg-amber-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50')
                }
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-700 font-medium">
                  {isDragActive ? 'Drop file here…' : 'Drag & drop a catalog, or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, Excel (.xlsx/.xls), CSV, or ZIP of images</p>
              </div>
              {file && fileType && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    {fileIcon}
                    <div>
                      <div className="font-medium text-slate-900">{file.name}</div>
                      <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <Badge className="bg-slate-900 text-white uppercase">{fileType}</Badge>
                  </div>
                  <Button onClick={startExtraction} className="bg-amber-500 hover:bg-amber-600">
                    Start extraction <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'extract' && (
            <div className="space-y-4">
              {extractMessage && <p className="text-sm text-slate-600">{extractMessage}</p>}
              {extractProgress > 0 && <Progress value={extractProgress} />}

              {fileType === 'pdf' && products.length === 0 && (
                <div className="p-6 border rounded-lg bg-amber-50 border-amber-200">
                  <p className="text-sm text-slate-700 mb-3">
                    PDF extraction requires AI processing. Click below to extract with Claude.
                  </p>
                  <Button onClick={runMockPdfExtract} disabled={extracting} className="bg-amber-500 hover:bg-amber-600">
                    {extracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Extract with AI
                  </Button>
                </div>
              )}

              {(fileType === 'excel' || fileType === 'csv') && rawRows.length === 0 && (
                <Button onClick={runExtract} disabled={extracting}>
                  {extracting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Parse spreadsheet
                </Button>
              )}

              {(fileType === 'excel' || fileType === 'csv') && rawRows.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Column mapping</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {FIELDS.map(f => (
                      <div key={f} className="flex items-center gap-3">
                        <label className="w-32 text-sm capitalize text-slate-600">{f.replace('_', ' ')}</label>
                        <Select
                          value={mapping[f] || '__none__'}
                          onValueChange={(v) => setMapping({ ...mapping, [f]: v === '__none__' ? '' : v })}
                        >
                          <SelectTrigger className="flex-1"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <Button onClick={applyMappingToProducts} className="bg-amber-500 hover:bg-amber-600">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {fileType === 'zip' && zipImages.length === 0 && (
                <Button onClick={runExtract} disabled={extracting}>
                  {extracting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Unpack archive
                </Button>
              )}

              {fileType === 'zip' && zipImages.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-auto">
                    {zipImages.map(img => (
                      <div key={img.name} className="border rounded p-1">
                        <img src={img.url} alt={img.name} className="w-full h-20 object-contain" />
                        <p className="text-[10px] truncate text-slate-500 mt-1">{img.name}</p>
                      </div>
                    ))}
                  </div>
                  <Button onClick={advanceFromZip} className="bg-amber-500 hover:bg-amber-600">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-slate-600">
                  <strong>{products.length}</strong> products extracted ·{' '}
                  <strong>{selectedCount}</strong> selected for import
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => setProducts(p => p.map(x => ({ ...x, selected: true })))}>
                    Select all
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => setProducts(p => p.map(x => ({ ...x, selected: false })))}>
                    Deselect all
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-16">Img</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="w-24">Price</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category hint</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p._id}>
                        <TableCell>
                          <Checkbox checked={p.selected}
                            onCheckedChange={(v) => updateP(p._id, { selected: !!v })} />
                        </TableCell>
                        <TableCell>
                          {p.image_url
                            ? <img src={p.image_url} className="h-10 w-10 object-contain" alt="" />
                            : <div className="h-10 w-10 bg-slate-100 rounded" />}
                        </TableCell>
                        <TableCell>
                          <Input value={p.name} onChange={e => updateP(p._id, { name: e.target.value })} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input value={p.sku} onChange={e => updateP(p._id, { sku: e.target.value })} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={p.price}
                            onChange={e => updateP(p._id, { price: parseFloat(e.target.value) || 0 })} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Input value={p.brand} onChange={e => updateP(p._id, { brand: e.target.value })} className="h-8" />
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{p.category_hint}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon"
                            onClick={() => setProducts(prev => prev.filter(x => x._id !== p._id))}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('extract')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep('map')} disabled={selectedCount === 0}
                  className="bg-amber-500 hover:bg-amber-600">
                  Continue to mapping <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Bulk assignment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Seller</label>
                    <Select value={bulkSeller} onValueChange={setBulkSeller}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <Select value={bulkCategory} onValueChange={setBulkCategory}>
                      <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Brand</label>
                    <Select value={bulkBrand} onValueChange={setBulkBrand}>
                      <SelectTrigger><SelectValue placeholder="Choose brand" /></SelectTrigger>
                      <SelectContent>
                        {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={applyBulk} className="w-full bg-slate-900 hover:bg-slate-800">
                    Apply to all selected
                  </Button>
                  {refsLoading && <p className="text-xs text-slate-500">Loading sellers and brands…</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Per-product overrides</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Brand</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.filter(p => p.selected).map(p => (
                          <TableRow key={p._id}>
                            <TableCell className="text-xs">{p.name}</TableCell>
                            <TableCell>
                              <Select value={p.category || ''} onValueChange={v => updateP(p._id, { category: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={p.brand_id || ''} onValueChange={v => updateP(p._id, { brand_id: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex justify-between">
                <Button variant="outline" onClick={() => setStep('preview')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep('commit')} className="bg-amber-500 hover:bg-amber-600">
                  Review & commit <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'commit' && (
            <div className="space-y-4 max-w-2xl">
              {committedCount === null && !commitError && (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Ready to import {selectedCount} products</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Products will be inserted into the products table</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Images uploaded to product-images storage bucket</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Job will be marked as committed</div>
                      <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" /> Existing products with the same SKU will be skipped</div>
                    </CardContent>
                  </Card>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep('map')}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button onClick={commit} disabled={committing} className="bg-amber-500 hover:bg-amber-600">
                      {committing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Confirm & import
                    </Button>
                  </div>
                </>
              )}
              {committedCount !== null && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="text-xl font-semibold text-slate-900">
                      {committedCount} products imported successfully
                    </h3>
                    <div className="flex justify-center gap-2">
                      <Button asChild variant="outline">
                        <Link to="/admin/products">View in Products</Link>
                      </Button>
                      <Button onClick={reset} className="bg-amber-500 hover:bg-amber-600">Start new import</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {commitError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-red-700 font-semibold">
                      <AlertCircle className="h-5 w-5" /> Import failed
                    </div>
                    <p className="text-sm text-slate-700">{commitError}</p>
                    <Button onClick={commit} disabled={committing}>Retry</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Past ingestion jobs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Extracted</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(j => {
                const statusColor: Record<string, string> = {
                  uploading: 'bg-slate-200 text-slate-700',
                  extracting: 'bg-blue-100 text-blue-700',
                  preview: 'bg-blue-100 text-blue-700',
                  mapping: 'bg-blue-100 text-blue-700',
                  committed: 'bg-green-100 text-green-700',
                  error: 'bg-red-100 text-red-700',
                };
                return (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.file_name}</TableCell>
                    <TableCell><Badge variant="outline">{j.file_type}</Badge></TableCell>
                    <TableCell><Badge className={statusColor[j.status] || ''}>{j.status}</Badge></TableCell>
                    <TableCell>{j.extracted_count ?? 0}</TableCell>
                    <TableCell>{j.committed_count ?? 0}</TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(j.created_at).toLocaleString()}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewJob(j)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={async () => {
                        await supabase.from('catalog_ingestion_jobs').delete().eq('id', j.id);
                        loadJobs();
                      }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {jobs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-6">No jobs yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewJob} onOpenChange={(o) => !o && setViewJob(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{viewJob?.file_name}</DialogTitle></DialogHeader>
          <pre className="text-xs bg-slate-50 p-3 rounded max-h-96 overflow-auto">
            {JSON.stringify(viewJob?.raw_extracted, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogIngestion;
