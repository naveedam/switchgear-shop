import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Trash2, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Source = 'whatsapp' | 'email' | 'phone' | 'web' | 'pdf' | 'excel' | 'image' | 'manual';

interface IntakeItem {
  manufacturer: string;
  product_family: string;
  part_number: string;
  description: string;
  quantity: number;
  unit: string;
}

const emptyItem = (): IntakeItem => ({
  manufacturer: '',
  product_family: '',
  part_number: '',
  description: '',
  quantity: 1,
  unit: 'nos',
});

const RfqIntake: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [source, setSource] = useState<Source>('whatsapp');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<IntakeItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const readFileAsBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleParse = async () => {
    if (!rawText.trim() && !file) {
      toast({ title: 'Nothing to parse', description: 'Paste a message or attach a file.', variant: 'destructive' });
      return;
    }
    setParsing(true);
    try {
      const payload: any = {};
      if (rawText.trim()) payload.text = rawText.trim();
      if (file) {
        payload.fileBase64 = await readFileAsBase64(file);
        payload.mimeType = file.type;
      }
      const { data, error } = await supabase.functions.invoke('parse-rfq-intake', { body: payload });
      if (error) throw error;
      const c = data?.customer || {};
      if (c.name && !customerName) setCustomerName(c.name);
      if (c.company && !customerCompany) setCustomerCompany(c.company);
      if (c.email && !customerEmail) setCustomerEmail(c.email);
      if (c.phone && !customerPhone) setCustomerPhone(c.phone);
      const extracted: IntakeItem[] = (data?.items || []).map((i: any) => ({
        manufacturer: i.manufacturer || '',
        product_family: i.product_family || '',
        part_number: i.part_number || '',
        description: i.description || '',
        quantity: Math.max(1, parseInt(i.quantity) || 1),
        unit: i.unit || 'nos',
      }));
      setItems(extracted.length ? extracted : [emptyItem()]);
      toast({ title: `Extracted ${extracted.length} line items` });
    } catch (e: any) {
      toast({ title: 'Extraction failed', description: e.message, variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<IntakeItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const handleSave = async () => {
    if (items.length === 0) {
      toast({ title: 'Add at least one line item', variant: 'destructive' });
      return;
    }
    if (!customerName && !customerCompany && !customerPhone) {
      toast({ title: 'Add customer info', description: 'Need at least name, company or phone.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: rfqNum, error: numErr } = await supabase.rpc('generate_intake_rfq_number');
      if (numErr) throw numErr;

      const title = customerCompany || customerName || 'WhatsApp RFQ';
      const { data: rfqRow, error: rfqErr } = await supabase
        .from('rfqs')
        .insert({
          rfq_number: rfqNum,
          title: `${title} — ${items.length} item(s)`,
          status: 'open',
          source,
          customer_name: customerName || null,
          customer_company: customerCompany || null,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          raw_message: rawText || null,
          notes: notes || null,
          total_items: items.length,
          validity_days: 30,
        } as any)
        .select('id, rfq_number')
        .single();
      if (rfqErr) throw rfqErr;

      const itemRows = items.map((it, idx) => ({
        rfq_id: rfqRow.id,
        line_number: idx + 1,
        manufacturer: it.manufacturer || null,
        product_family: it.product_family || null,
        part_number: it.part_number || null,
        description: it.description || it.part_number || 'Unspecified item',
        quantity: it.quantity,
        unit: it.unit,
        status: 'open',
      })) as any;
      const { error: itemsErr } = await supabase.from('rfq_items').insert(itemRows);
      if (itemsErr) throw itemsErr;

      toast({ title: 'RFQ created', description: rfqRow.rfq_number });
      navigate(`/admin/rfqs/${rfqRow.id}`);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">RFQ Intake</h1>
        <p className="text-sm text-muted-foreground">
          Paste a WhatsApp / email enquiry or upload a PDF, Excel, image or screenshot. AI extracts line items.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">1. Source enquiry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Source channel</Label>
              <Select value={source} onValueChange={(v) => setSource(v as Source)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['whatsapp','email','phone','web','pdf','excel','image','manual'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Attach file (PDF / Excel / image)</Label>
              <Input type="file" accept=".pdf,.xlsx,.xls,.csv,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div>
            <Label>Paste message / requirement text</Label>
            <Textarea rows={6} value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Hi, need quote for: 1) ABB Tmax T2N 160 MCCB 3P 100A x 5 nos, 2) Siemens 3RT2025 contactor 24VDC x 10 nos…" />
          </div>
          <Button onClick={handleParse} disabled={parsing}>
            {parsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Extract with AI
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">2. Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><Label>Company</Label><Input value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Internal notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">3. Line items ({items.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Add row</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Run AI extraction or add rows manually.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Product Family</TableHead>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><Input className="h-8" value={it.manufacturer} onChange={(e) => updateItem(idx, { manufacturer: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" value={it.product_family} onChange={(e) => updateItem(idx, { product_family: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8 font-mono" value={it.part_number} onChange={(e) => updateItem(idx, { part_number: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} /></TableCell>
                      <TableCell><Input className="h-8" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} /></TableCell>
                      <TableCell><Input className="h-8" value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/admin/rfqs')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || items.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          Create RFQ
        </Button>
      </div>
    </div>
  );
};

export default RfqIntake;
